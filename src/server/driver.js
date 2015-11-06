require('es6-promise');
require('promise.prototype.finally');

import pg from 'pg';

import { listCourses, updateResource, addCourseToDB } from './db/db_actions';
import { getCourseResources, getCourseInfo } from './moodle_proxy';
import { createFolder, uploadResource, getFolderIdByName } from './powerfolder_proxy';
import { partial } from 'lodash';

function pmap(list, callback) {
  const promises = list.map(callback);
  return Promise.all(promises);
}

export function updateResources() {
  return listCourses()
    .then((courses) => {
      return pmap(courses, (course) => {
        return getCourseResources(course).then((resources) => {
          return pmap(resources, (resource) => {
            return updateResource(course, resource);
          })
          .then((resourcesToUpdate) => {
            console.log(resourcesToUpdate);
            pmap(resourcesToUpdate, partial(uploadResource, course));
          })
          .then((uploaded) => (console.log('uploaded', uploaded)));
        });
      });
    }, (error) => (console.error('Error encountered: ', error)))
    .finally(() => {
      pg.end();
    });
}

export function addCourse(courseid) {
  return getCourseInfo(courseid)
    .then((courseinfo) => {
      return createFolder(courseinfo.shorttitle)
        .then(() => {
          return getFolderIdByName(courseinfo.shorttitle);
        })
        .then((powerfolderid) => ({powerfolderid, ...courseinfo}),
          () => (console.log(`Folder for course ${courseinfo.shorttitle} already exists`)));
    })
    .then(addCourseToDB);
}

addCourse(3)
   .then(() => updateResources());

//updateResources()
//  .then(() => console.log('Updated'), console.error);

// getCourseResources({moodleid: 3}).then(console.log, console.error);

// listCourses().then(console.log, console.error).finally(pg.end());
