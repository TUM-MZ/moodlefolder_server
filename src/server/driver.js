require('es6-promise');
require('promise.prototype.finally');

import pg from 'pg';

import { listCourses, updateResource, addCourseToDB, readCourse,
  deleteCourse, readUser, connectUserToCourse, create, read, update, deleteRecord, runQuery } from './db/db_actions';
import { getCourseResources, getCourseInfo, downloadFile, getUserInfo } from './moodle_proxy';
import { createFolder, getFolderIdsByName, login, uploadFile,
  removeFolder, shareFolder, unshareFolder } from './powerfolder_proxy';
import { partial } from 'lodash';
import path from 'path';
import fs from 'fs';

function pmap(list, callback) {
  const promises = list.map(callback);
  return Promise.all(promises);
}


/**
 * Download a specified resource into the course folder in PowerFolder
 * @param {Object} resource
 */
export function uploadResource(course, resource) {
  if (!course || !resource) return undefined;
  const tempPath = path.join('/tmp/', resource.filename);
  return downloadFile(resource, tempPath)
    .then(() =>
      uploadFile(tempPath, course.powerfolderexternalid, course.powerfolderinternalid, resource.filename)
    , console.error)
    .then(() => (fs.unlinkSync(tempPath)));
}

export function updateResources() {
  return login()
    .then(listCourses)
    .then((courses) => {
      return pmap(courses, (course) => {
        return getCourseResources(course).then((resources) => {
          return pmap(resources, (resource) => {
            return updateResource(course, resource);
          })
          .then((resourcesToUpdate) => {
            return pmap(resourcesToUpdate, partial(uploadResource, course));
          })
          .then((uploaded) => (console.log('uploaded', uploaded)), console.error);
        });
      });
    }, (error) => (console.error('Error encountered: ', error)))
    .finally(() => {
      pg.end();
    });
}

export function addCourse(courseid) {
  let courseinfo;
  return getCourseInfo(courseid)
    .then(responseCourseinfo => {
      courseinfo = responseCourseinfo;
      return getFolderIdsByName(courseinfo.shorttitle);
    })
    .then((folderinfo) => {
      if (!!folderinfo) {
        return folderinfo;
      } else {
        return createFolder(courseinfo.shorttitle)
          .then(() => getFolderIdsByName(courseinfo.shorttitle));
      }
    }, () => console.error(`Can\'t retrieve infomation for courseid ${courseid}.`))
    .then(({ powerfolderexternalid, powerfolderinternalid }) => ({
      powerfolderexternalid,
      powerfolderinternalid,
      ...courseinfo}),
          () => (console.error(`Folder for course ${courseinfo.shorttitle} already exists`)))
    .then((fullcourseinfo) => {
      return read('course', { moodleid: fullcourseinfo.moodleid })
        .then((course) => {
          if (!course) {
            return addCourseToDB(fullcourseinfo);
          } else {
            return update('course', { moodleid: fullcourseinfo.moodleid }, fullcourseinfo);
          }
        });
    });
}

export function removeUserFromCourse(lrzid, courseid) {
  return Promise.all([readCourse(courseid), read('moodleuser', { lrzid })])
    .then(([course, user]) => {
      return unshareFolder(course, user)
        .then(() => deleteRecord('user_course', { courseid: course.id, userid: user.id }))
    });
}

export function clearCourse(courseid) {
  return readCourse(courseid)
    .then((courseinfo) => removeFolder(courseinfo.powerfolderinternalid))
    .then(() => deleteCourse(courseid));
}

export function createUser(lrzid) {
  return getUserInfo(lrzid)
    .then((userinfo) => create('moodleuser', userinfo));
}

export function addUserToCourse(lrzid, courseid) {
  return Promise.all([readCourse(courseid), readUser(lrzid)])
    .then(([course, userinfo]) => {
      const coursepromise = course || addCourse(courseid).then(() => readCourse(courseid));
      const userpromise = userinfo || createUser(lrzid).then(() => read('moodleuser', { lrzid }));
      return Promise.all([coursepromise, userpromise]);
    })
    .then(([courseinfo, userinfo]) =>
      read('user_course', {userid: userinfo.id, courseid: courseinfo.id})
        .then((result) => {
          if (!result) {
            return connectUserToCourse(userinfo, courseinfo)
              .then(() => shareFolder(courseinfo, userinfo));
          }
        })
    );
}

export function listCoursesForUser(lrzid) {
  return runQuery(`SELECT c.moodleid, c.shorttitle
    FROM course as c, moodleuser as m, user_course as uc
    WHERE c.id = uc.courseid AND m.id = uc.userid AND m.lrzid=$1`, lrzid)
    .then((result) => result.rows);
}
