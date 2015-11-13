require('es6-promise');
require('promise.prototype.finally');

import pg from 'pg';

import { listCourses, updateResource, addCourseToDB, readCourse,
  deleteCourse, readUser, connectUserToCourse, create, read } from './db/db_actions';
import { getCourseResources, getCourseInfo, downloadFile, getUserInfo } from './moodle_proxy';
import { createFolder, getFolderIdByName, login, uploadFile,
  removeFolder, shareFolder } from './powerfolder_proxy';
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
        console.log(courses);
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
  let powerfolderinternalid;
  let courseinfo;
  return getCourseInfo(courseid)
    .then(responseCourseinfo => {
      courseinfo = responseCourseinfo;
      return createFolder(courseinfo.shorttitle);
    }, () => console.log(`Can\'t retrieve infomation for courseid ${courseid}.`))
    .then((folderinfo) => {
      powerfolderinternalid = folderinfo.ID;
      return getFolderIdByName(folderinfo.folderName);
    }, (err) => console.log(`Can't get internal id for course ${courseid} (${err})`))
    .then(powerfolderid => ({
      powerfolderexternalid: powerfolderid,
      powerfolderinternalid,
      ...courseinfo}),
          () => (console.log(`Folder for course ${courseinfo.shorttitle} already exists`)))
    .then(addCourseToDB);
}

export function clearCourse(courseid) {
  return readCourse(courseid)
    .then((courseinfo) => {
      return removeFolder(courseinfo.powerfolderinternalid);
    })
    .then(() => deleteCourse(courseid));
}

export function createUser(lrzid) {
  return getUserInfo(lrzid)
    .then((userinfo) =>
      create('moodleuser', userinfo)
    );
}

export function addUserToCourse(lrzid, courseid) {
  return Promise.all([readCourse(courseid), readUser(lrzid)])
    .then(([course, userinfo]) => {
      let coursepromise;
      let userpromise;
      coursepromise = course || addCourse(courseid).then(readCourse(courseid));
      userpromise = userinfo || createUser(lrzid).then(read('moodleuser', { lrzid }));
      return Promise.all([coursepromise, userpromise]);
    })
    .then(([courseinfo, userinfo]) =>
      read('user_course', {userid: userinfo.id, courseid: courseinfo.id})
        .then((result) => {
          if (result.length === 0) {
            const promise = connectUserToCourse(userinfo, courseinfo)
              .then(() => shareFolder(courseinfo, userinfo));
          }
          console.log('no action needed', result);
        })
    );
}
