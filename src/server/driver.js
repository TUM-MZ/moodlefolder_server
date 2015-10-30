require('es6-promise');
require('promise.prototype.finally');

import pg from 'pg';

import { listCourses, updateResource, addCourse } from './db/db_actions';
import { getCourseResources } from './moodle_proxy';

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
          });
        });
      });
    }, (error) => (console.error('Error encountered: ', error)))
    .finally(() => {
      pg.end();
    });
}

// addCourse(3)
//   .then(() => updateResources());

updateResources()
  .then(() => console.log("Updated"), console.error);

// getCourseResources({moodleid: 3}).then(console.log, console.error);

// listCourses().then(console.log, console.error).finally(pg.end());
