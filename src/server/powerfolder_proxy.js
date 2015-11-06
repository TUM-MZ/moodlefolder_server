import { downloadFile } from './moodle_proxy';
import path from 'path';
import {pflogin, pfpassword} from '../../pfauth';
import fs from 'fs';
import pure_request from 'request';
import mime from 'mime';
const cookie_jar = pure_request.jar();
const jarred_request = pure_request.defaults({jar: cookie_jar});
import { filter } from 'lodash';
require('es6-promise').polyfill();

const PF_URL = 'https://syncandshare.lrz.de/';

let isLoggedIn = false;

function request(options) {
  return new Promise((fulfill, reject) => {
    const extOptions = Object.assign(options, {jar: cookie_jar});
    pure_request(extOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        fulfill(body);
      } else {
        reject(error || 'Error ' + response.statusCode + ', body: ' + body);
      }
    });
  });
}

function login() {
  if (isLoggedIn) {
    console.log('already logged in');
    return null;
  }
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
    })
    .then(() => {
      isLoggedIn = true;
      return true;
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

function uploadFile(file_path, folder_id, filename) {
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
        value: fs.createReadStream(file_path),
        options: {
          filename: filename || path.basename(file_path),
          contentType: mime.lookup(file_path),
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
  if (!course) return;
  const tempPath = path.join('/tmp/pf/', resource.filename);
  downloadFile(resource, tempPath);
  return uploadFile(tempPath, course.powerfolderid, resource.filename);
  //fs.unlinkSync(tempPath);
}

//getFolderIdByName('child1_1').then(console.log);
