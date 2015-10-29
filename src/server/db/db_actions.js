import { getCourseInfo } from '../moodle_proxy';
import { Promise } from 'es6-promise';
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
  });
}

export function addCourse(courseid) {
  return getCourseInfo(courseid)
    .then((courseinfo) => {
      return runQuery(`INSERT INTO course (moodleid, url, longtitle, shorttitle)
             VALUES ($1, $2, $3, $4)`, courseinfo.moodleid, courseinfo.url, courseinfo.longtitle, courseinfo.shorttitle);
    });
}

export function listCourses(courseid) {
  return runQuery(`SELECT * FROM course`);
}

export function fetchCourses(courseid) {
  return true;
}

listCourses().then((res) => {
  console.log('outer', res.rows)
  return null;
}, (error) => (console.error(error)));

pg.end();
