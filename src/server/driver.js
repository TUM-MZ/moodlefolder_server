require('es6-promise');
require('promise.prototype.finally');

import pg from 'pg';

import { listCourses, updateResource, addCourseToDB } from './db/db_actions';
import { getCourseResources, getCourseInfo, downloadFile } from './moodle_proxy';
import { createFolder, getFolderIdByName, login, uploadFile } from './powerfolder_proxy';
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
    , console.error);
    // .then(() => (fs.unlinkSync(tempPath)));
}

export function updateResources() {
  return login()
    .then(listCourses)
    .then((courses) => {
      console.log('got list of courses');
      return pmap(courses, (course) => {
        return getCourseResources(course).then((resources) => {
          return pmap(resources, (resource) => {
            return updateResource(course, resource);
          })
          .then((resourcesToUpdate) => {
            console.log(resourcesToUpdate);
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
  return getCourseInfo(courseid)
    .then(courseinfo => createFolder(courseinfo.shorttitle))
    .then((folderinfo) => {
      powerfolderinternalid = folderinfo.ID;
      return getFolderIdByName(courseinfo.shorttitle);
    })
    .then(powerfolderid => ({
      powerfolderexternalid: powerfolderid,
      powerfolderinternalid,
      ...courseinfo}),
          () => (console.log(`Folder for course ${courseinfo.shorttitle} already exists`)))
    .then(addCourseToDB);
}

export function addUser(lrzid, courseid) {
  readCourse(courseid)
    .then((course) => {
      let coursePromise;
      if (course.length === 0) {
        return addCourse(courseid);
      } else {
        return course[0];
      }
    })
    .then((course) => {
      const user = readUser(lrzid)
        .then((userinfo) => {
          if (userinfo.length === 0) {
            return getUserInfo(lrzid);
          } else {
            return userinfo[0];
          }
        })
    })
}
