require('es6-promise').polyfill();

import superagent from 'superagent';
import { request } from './utils';
import pure_request from 'request';
import { WS_TOKEN, WS_USER_TOKEN } from './tokens.js';
import path from 'path';
import fs from 'fs';

const MOODLE_BASE_URL = process.env.MOODLE_URL || 'http://localhost/~alendit/moodle/';
 //const MOODLE_BASE_URL = 'https://support.moodle.tum.de/';
const MOODLE_REST_API = `${MOODLE_BASE_URL}webservice/rest/server.php`;

export function getCourseInfo(courseid) {
  return request({
    url: MOODLE_REST_API,
    qs: {
      wstoken: WS_TOKEN,
      wsfunction: 'core_course_get_courses',
      moodlewsrestformat: 'json',
      options: {
        ids: [courseid],
      },
    },
    json: true,
  })
    .then((body) => {
      const courseinfo = body[0];
      return {
        moodleid: courseinfo.id,
        url: `${MOODLE_BASE_URL}course/view.php?id=${courseinfo.id}`,
        longtitle: courseinfo.fullname,
        shorttitle: courseinfo.shortname,
      };
    });
}

export async function getCourseResources(course) {
  const courseid = course.moodleid;
  if (!courseid) throw new Error('Course has to have moodleid');
  const courseContent = await request({
    url: MOODLE_REST_API,
    json: true,
    qs: {
      wstoken: WS_TOKEN,
      wsfunction: 'core_course_get_contents',
      moodlewsrestformat: 'json',
      courseid: courseid,
    },
  });
  const resources = [];
  courseContent.forEach(section => {
    if (section.visible === 1 && section.modules) {
      section.modules.forEach(module => {
        if (module.visible) {
          if (module.modname === 'resource') {
            module.contents.forEach(file => resources.push(file));
          } else if (module.modname === 'folder') {
            module.contents.forEach(file => {
              const { filepath, ...rest } = file;
              resources.push({ ...rest, filepath: `/${module.name}${filepath}`})
            })
          }
        }
      })
    }
  });
  return resources;
}

export function downloadFile(resource, targetPath) {
  const file = fs.createWriteStream(targetPath);
  const fileurl = resource.fileurl;
  return new Promise((fulfill, reject) => {
    const req = pure_request({
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

export function getUserInfo(lrzid) {
  return request({
    method: 'get',
    url: MOODLE_REST_API,
    qs: {
      wstoken: WS_USER_TOKEN,
      wsfunction: 'core_user_get_users',
      moodlewsrestformat: 'json',
      criteria: [{
        key: 'username',
        value: lrzid,
      }],
    },
    json: true,
  })
    .then((body) => {
      if (!body.users) throw Error(`Body ${JSON.stringify(body)} does not contain users`);
      const userInfo = body.users[0];
      if (!userInfo) throw Error(`User ${lrzid} not found`)
      return { lrzid: userInfo.username, email: userInfo.email };
    }, console.error);
}
