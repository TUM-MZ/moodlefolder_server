require('es6-promise');
require('promise.prototype.finally');

import pg from 'pg';

import { listCourses, updateResource, addCourseToDB } from './db/db_actions';
import { getCourseResources, getCourseInfo } from './moodle_proxy';
import { createFolder, uploadResource, getFolderIdByName, login } from './powerfolder_proxy';
import { partial } from 'lodash';

function pmap(list, callback) {
  const promises = list.map(callback);
  return Promise.all(promises);
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
  return getCourseInfo(courseid)
    .then(courseinfo => createFolder(courseinfo.shorttitle))
    .then(() => getFolderIdByName(courseinfo.shorttitle))
    .then(powerfolderid => ({powerfolderid, ...courseinfo}),
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

addCourse(3)
   .then(() => updateResources(), console.error);

//updateResources().then(console.log);
//  .then(() => console.log('Updated'), console.error);

// getCourseResources({moodleid: 3}).then(console.log, console.error);

// listCourses().then(console.log, console.error).finally(pg.end());
