require('es6-promise').polyfill();

import superagent from 'superagent';
import request from 'request';
import { WS_TOKEN } from './token.js';
import path from 'path';
import fs from 'fs';

const MOODLE_BASE_URL = 'http://localhost/~alendit/moodle/';
//const MOODLE_BASE_URL = 'https://support.moodle.tum.de/';
const MOODLE_REST_API = `${MOODLE_BASE_URL}webservice/rest/server.php`;
const MOODLE_DOWNLOAD_URL = `${MOODLE_BASE_URL}webservice/pluginfile.php`;

export function getCourseInfo(courseid) {
  return new Promise((fulfill, reject) => {
    superagent
      .get(MOODLE_REST_API)
      .query({
        wstoken: WS_TOKEN,
        wsfunction: 'core_course_get_courses',
        moodlewsrestformat: 'json',
      })
      .query(`options[ids][]=${courseid}`)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.ok && !res.body.exception) {
          const courseinfo = res.body[0];
          fulfill({
            moodleid: courseinfo.id,
            url: `${MOODLE_BASE_URL}course/view.php?id=${courseinfo.id}`,
            longtitle: courseinfo.fullname,
            shorttitle: courseinfo.shortname,
          });
        } else {
          reject(res.text);
        }
      });
  });
}

export function getCourseResources(course) {
  const courseid = course.moodleid;
  const courseContent = new Promise((fulfill, reject) => {
    superagent
      .get(MOODLE_REST_API)
      .query({
        wstoken: WS_TOKEN,
        wsfunction: 'core_course_get_contents',
        moodlewsrestformat: 'json',
        courseid: courseid,
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (res.ok) {
          fulfill(res.body);
        } else {
          reject(err);
        }
      });
  });
  return courseContent.then((res) => {
    const resources = [];
    res.forEach((section) => {
      if (section.modules) {
        section.modules.forEach((module) => {
          if (module.modname === 'resource') {
            module.contents.forEach((file) => resources.push(file));
          }
        });
      }
    });
    return resources;
  });
}

export function downloadFile(resource, targetPath) {
  const file = fs.createWriteStream(targetPath);
  const fileurl = resource.fileurl;
  return new Promise((fulfill, reject) => {
    const req = request({
      method: 'get',
      url: fileurl,
      qs: {token: WS_TOKEN},
      json: true,
    })
      .pipe(file);
    req.on('error', reject);
    req.on('finish', () => {
      file.close();
      fulfill(targetPath);
    });
  });
}