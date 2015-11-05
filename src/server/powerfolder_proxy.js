import { downloadFile } from './moodle_proxy';
import path from 'path';
import {pflogin, pfpassword} from '../../pfauth';
import fs from 'fs';
import pure_request from 'request';
import mime from 'mime';
const cookie_jar = pure_request.jar();
const jarred_request = pure_request.defaults({jar: cookie_jar});
require('es6-promise').polyfill();

const PF_URL = 'https://syncandshare.lrz.de/';

function request(options) {
  return new Promise((fulfill, reject) => {
    const extOptions = Object.assign(options, {jar: cookie_jar});
    pure_request(extOptions, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        fulfill(body);
      } else {
        reject(error || 'Error ' + response.statusCode);
      }
    }).on('response', (response) => console.log("header cookies", response.headers.cookie));
  });
}

/**
 * Download a specified resource into the course folder in PowerFolder
 * @param {Object} resource
 */
export function downloadResource(resource) {
  downloadFile(resource, path.join('/tmp/pf/', resource.filename));
}

function getFolderInfo(folderid) {
  request
    .get(PF_URL + 'api/folders')
    .query({
      action: 'getInfo',
      ID: folderid,
    })
    .auth(pflogin, pfpassword)
    .end((err, res) => {
      console.log(res.body);
    });
}

const folderid = 'MlRWY2lXUkFTaGQ4NXNQeVZ2TmFY';

//getFolderInfo(folderid);

function login() {
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

function upload_file(file_path, folder_id, filename) {
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

const promise = login();
promise.then(() => request({url: PF_URL + 'folderstable'})).then((body) => {
  fs.writeFile('/tmp/res.html', body, () => (console.log('written')));
  console.log(cookie_jar.getCookies(PF_URL));
  return upload_file("/home/alendit/Documents/akkubohrer_rechnung.pdf", folderid);
}, console.error).then(() => (console.log('uploaded')));


// https://syncandshare.lrz.de/filesjson/MlRWY2lXUkFTaGQ4NXNQeVZ2TmFY?CSRFToken=
