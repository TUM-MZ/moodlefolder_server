import { downloadFile } from './moodle_proxy';
import path from 'path';
import {pflogin, pfpassword} from '../../pfauth';
import fs from 'fs';
import mime from 'mime';
import { filter } from 'lodash';
import { request } from './utils';
require('es6-promise').polyfill();

const PF_URL = 'https://syncandshare.lrz.de/';

export function login() {
  return request({
    method: 'get',
    url: PF_URL + 'login',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0'
    },
  })
    .then(() => {
      return request({
        method: 'post',
        url: PF_URL + 'login',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0'
        },
        form: {
          Username: pflogin,
          Password: pfpassword,
          autoLogin: 'true',
          Login: 'Login',
          originalURI: '',
          CSRFToken: '',
        },
      });
    });
}

export function createFolder(folderName) {
  return request({
    method: 'GET',
    url: PF_URL + 'api/folders',
    qs: {
      action: 'create',
      name: folderName,
    },
    auth: {
      user: pflogin,
      pass: pfpassword,
    },
  }).then((body) => JSON.parse(body));
}


const folderid = 'MlRWY2lXUkFTaGQ4NXNQeVZ2TmFY';


export function getFolderIdByName(foldername) {
  return login()
    .then(() => {
      return request({
        method: 'get',
        url: PF_URL + 'foldersjson',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
      });
    })
    .then((body) => {
      fs.writeFile("/tmp/res.html", body);
      const folder = filter(JSON.parse(body).ResultSet.Result, (f) => (f.name === foldername))[0];
      return /https:\/\/syncandshare.lrz.de\/files\/(.*)$/g.exec(folder.resourceURL)[1];
    });
}

function uploadFile(targetPath, folder_id, filename) {
  return request({
    method: 'post',
    url: PF_URL + 'upload/' + folder_id,
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0'
    },
    formData: {
      folderID: folder_id,
      path: '',
      ajax: 1,
      //action: 'rename',
      CSRFToken: '',
      file: {
        value: fs.createReadStream(targetPath),
        options: {
          filename: filename || path.basename(targetPath),
          contentType: mime.lookup(targetPath),
        },
      },
    },
  });
}

/**
 * Download a specified resource into the course folder in PowerFolder
 * @param {Object} resource
 */
export function uploadResource(course, resource) {
  if (!course || !resource) return undefined;
  const tempPath = path.join('/tmp/pf/', resource.filename);
  return downloadFile(resource, tempPath)
    .then(() => {
      return uploadFile(tempPath, course.powerfolderid, resource.filename);
    }, console.error)
    .then(() => (fs.unlinkSync(tempPath)));
}

//getFolderIdByName('child1_1').then(console.log);
