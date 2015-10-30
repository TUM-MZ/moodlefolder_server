require('es6-promise').polyfill();
require('promise.prototype.finally');

import { getCourseInfo } from '../moodle_proxy';
import { downloadResource } from '../powerfolder_proxy';
import pg from 'pg';

const connString = 'postgres://postgres@localhost/moodlefolder';

function runQuery(query, ...params) {
  return new Promise((fulfill, reject) => {
    pg.connect(connString, (connErr, client, done) => {
      if (connErr) {
        reject('error fetching client from pool: ' + connErr);
      } else {
        client.query(query, params, (queryErr, results) => {
          done();
          if (queryErr) {
            reject('error running query with parameters: ' + queryErr);
          } else {
            fulfill(results);
          }
        });
      }
    });
  })
  .then(result => result, (error) => {
    console.error('Query error: ', error);
    pg.end();
    return error;
  });
}

export function addCourse(courseid) {
  return getCourseInfo(courseid)
    .then((courseinfo) => {
      return runQuery(`INSERT INTO course (moodleid, url, longtitle, shorttitle)
             VALUES ($1, $2, $3, $4)`, courseinfo.moodleid, courseinfo.url, courseinfo.longtitle, courseinfo.shorttitle);
    });
}

export function listCourses() {
  return runQuery(`SELECT * FROM course`)
    .then((result) => (result.rows));
}

export function addResource(course, resource) {
  return runQuery('INSERT INTO resource (url, title, resPath, lastmodified, courseid) VALUES ($1, $2, $3, to_timestamp($4), $5)',
      resource.fileurl, resource.filename,
      resource.filepath + resource.filename, resource.timemodified, course.moodleid)
    .then(result => result);
}

export function updateResourceEntry(resource) {
  return runQuery(`UPDATE resource SET
        url=$1,
        title=$2,
        resPath=$3,
        lastmodified=to_timestamp($4)
      where
        url=$1`, resource.fileurl, resource.filename, resource.filepath + resource.filename, resource.timemodified)
    .then(result => result);
}

export function updateResource(course, resource) {
  return runQuery('SELECT id, lastmodified from resource where url=$1', resource.fileurl)
    .then((result) => {
      if (result.rows.length === 0) {
        return addResource(course, resource)
          .then(() => downloadResource(resource), console.error);
      } else {
        return updateResourceEntry(resource).then(() => {
          if (result.rows[0].lastmodified < resource.lastmodified) {
            return downloadResource(resource);
          }
        }, console.error);
      }
    });
}
