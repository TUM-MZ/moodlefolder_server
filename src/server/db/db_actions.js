require('es6-promise').polyfill();
require('promise.prototype.finally');

import pg from 'pg';
import { keys, values, zip } from 'lodash';

const pghostname = process.env.PG_PORT_5432_TCP_ADDR || 'localhost';
const pgport = process.env.PG_PORT_5432_TCP_PORT || 5432;
const connString = process.env.DATABASE_URL ||
                    `postgres://postgres@${pghostname}:${pgport}/moodlefolder`;

export function runQuery(query, ...params) {
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

function extractObjectInfoForDB(object, firstindex=0) {
  return {
    columns: keys(object),
    columnIndexes: keys(object).map((value, index) => '$' + (firstindex + index + 1)),
    columnValues: values(object),
  };
}

function getSelectionPairs({ columns, columnIndexes }) {
  return zip(columns, columnIndexes).map(([column, index]) => `${column}=${index}`);
}

export function create(tablename, object) {
  const objectInfo = extractObjectInfoForDB(object);

  return runQuery(`INSERT INTO ${tablename} (${objectInfo.columns.join(', ')})
    VALUES (${objectInfo.columnIndexes.join(', ')})`, ...objectInfo.columnValues)
    .then((result) => result.rows);
}

/*
  tablename: string
  selectorObject: { columnName: value }
 */
export function read(tablename, selectorObject) {
  const objectInfo = extractObjectInfoForDB(selectorObject);
  const selectorPairs = getSelectionPairs(objectInfo);
  const querystring = `SELECT * FROM ${tablename} WHERE ${selectorPairs.join(' AND ')}`;
  return runQuery(querystring, ...objectInfo.columnValues)
    .then((result) => result.rows[0]);
}

export function update(tablename, keyObject, updateObject) {
  const updateInfo = extractObjectInfoForDB(updateObject);
  const keyInfo = extractObjectInfoForDB(keyObject, updateInfo.columns.length);

  const updatePairs = getSelectionPairs(updateInfo);
  const selectPairs = getSelectionPairs(keyInfo);
  return runQuery(
    `UPDATE ${tablename} SET ${updatePairs.join(',')} WHERE ${selectPairs.join(' AND ')}`,
    ...updateInfo.columnValues, ...keyInfo.columnValues);
}

export function deleteRecord(tablename, selector) {
  const objectInfo = extractObjectInfoForDB(selector);
  const selectorPairs = getSelectionPairs(objectInfo);
  const queryString = `DELETE FROM ${tablename} WHERE ${selectorPairs.join(' AND ')}`;
  return runQuery(queryString, ...objectInfo.columnValues);
}

export function addCourseToDB(courseinfo) {
  return runQuery(`INSERT INTO course (moodleid, url, longtitle, shorttitle, powerfolderinternalid, powerfolderexternalid)
         VALUES ($1, $2, $3, $4, $5, $6)`,
    courseinfo.moodleid, courseinfo.url, courseinfo.longtitle,
    courseinfo.shorttitle, courseinfo.powerfolderinternalid, courseinfo.powerfolderexternalid)
    .then(() => courseinfo);
}

export function listCourses() {
  return runQuery(`SELECT * FROM course`)
    .then((result) => (result.rows));
}

export function readCourse(courseid) {
  return runQuery('SELECT * FROM course WHERE moodleid=$1', courseid)
    .then(result => result.rows[0]);
}

export function deleteCourse(courseid) {
  return runQuery('DELETE FROM course WHERE moodleid=$1', courseid)
    .then(() => courseid);
}

export function readUser(lrzid) {
  return runQuery('SELECT * from moodleuser WHERE lrzid=$1', lrzid)
    .then(result => result.rows[0]);
}

export function connectUserToCourse(user, course) {
  return read('user_course', {userid: user.id, courseid: course.id})
    .then(result => result.rows.length > 0 ? null : create('user_course', {
    userid: user.id,
    courseid: course.id,
  }));
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
          .then(() => (resource), console.error);
      } else {
        return updateResourceEntry(resource).then(() => {
          if (result.rows[0].lastmodified < resource.lastmodified) {
            return resource;
          }
        }, console.error);
      }
    });
}
