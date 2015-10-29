import request from 'superagent';
import { WS_TOKEN } from './token.js';
import saPromise from 'superagent-promise';
import { Promise } from 'es6-promise';
import path from 'path';
import fs from 'fs';

const agent = saPromise(request, Promise);

const MOODLE_BASE_URL = 'http://localhost/~alendit/moodle/';
const MOODLE_REST_API = `${MOODLE_BASE_URL}webservice/rest/server.php`;
const MOODLE_DOWNLOAD_URL = `${MOODLE_BASE_URL}webservice/pluginfile.php`;

export function getCourseInfo(courseid) {
  return new Promise((fulfill, reject) => {
    request
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

export function getCourseResources(courseid) {
  const courseContent = new Promise((fulfill, reject) => {
    request
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
            resources.push(module);
          }
        });
      }
    });
    return resources;
  });
}

export function downloadFile(resource, targetPath) {
  const fileurl = resource.fileurl;
  request
    .get(fileurl)
    .query({token: WS_TOKEN})
    .end(function(err, res) {
      if (res.ok) {
        fs.writeFileSync(targetPath, res.body);
      } else {
        throw Error(err);
      }
    });
}

const resource = { type: 'file',
       filename: 'helizone_banner.png',
       filepath: '/',
       filesize: 452783,
       fileurl: 'http://localhost/~alendit/moodle/webservice/pluginfile.php/63/mod_resource/content/0/helizone_banner.png?forcedownload=1',
       timecreated: 1446118655,
       timemodified: 1446118655,
       sortorder: 1,
       userid: 2,
       author: null,
       license: 'allrightsreserved' };

