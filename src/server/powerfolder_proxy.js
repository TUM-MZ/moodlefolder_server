import { downloadFile } from './moodle_proxy';
import path from 'path';
import {pflogin, pfpassword} from '../../pfauth';
import fs from 'fs';
import mime from 'mime';
import { filter } from 'lodash';
import { request } from './utils';
require('es6-promise').polyfill();

const PF_URL = 'https://syncandshare.lrz.de/';

let pflogin, pfpassword;

try {
  const pfauth = require('../../pfauth');
  pflogin = pfauth.pflogin;
  pfpassword = pfauth.pfpassword;
} catch (e) {
  pflogin = process.env.PFLOGIN;
  pfpassword = process.env.PFPASSWORD;
}

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
  }).then((body) => ({folderName, ...JSON.parse(body)}));
}

/*
 * takes the internal folder ID not the external one
 */
export function removeFolder(internalfolderid) {
  return login()
    .then(() =>
      request({
        url: PF_URL + 'leavefolder',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
          leave: 'true',
          removePermission: 'true',
          FolderID: internalfolderid,
          FolderName: 'doesntmatter',
          action: 'leave',
          CSRFToken: '$CSRFToken',
        },
      })
    );
}

export function getFolderIdsByName(foldername) {
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
      const folder = filter(JSON.parse(body).ResultSet.Result, (f) => (f.name === foldername))[0];
      if (!folder) return undefined;
      return {
        powerfolderexternalid: /https:\/\/syncandshare.lrz.de\/files\/(.*)$/g.exec(folder.resourceURL)[1],
        powerfolderinternalid: folder.ID,
      };
    });
}

export function shareFolder(course, user) {
  const externalid = course.powerfolderexternalid;
  const lrzid = user.lrzid;
  return login()
    .then(() =>
      request({
        method: 'post',
        url: PF_URL + 'members/' + externalid,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
          CSRFToken: '',
          OID: '',
          permission: 'READ',
          invite: 'true',
          username: lrzid,
          isGroup: '',
        },
        json: true,
      })
    )
    .then((response) => {
      if (!response.message) {
        throw Error(reponse);
      }
    });
}

export function unshareFolder(course, user) {
  const externalid = course.powerfolderexternalid;
  const lrzid = user.lrzid;
  return login()
    .then(() =>
      request({
        method: 'DELETE',
        url: PF_URL + 'members/' + externalid,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
          CSRFToken: '',
          OID: '',
          permission: 'READ',
          invite: 'true',
          username: lrzid,
          isGroup: '',
        },
        json: true,
      })
    )
    .then((response) => {
      if (!response.message) {
        throw Error(reponse);
      }
    });
}

export function getFolderMembers(course) {
  const externalid = course.powerfolderexternalid;

  return login()
    .then(() =>
      request({
        method: 'GET',
        url: PF_URL + 'membersjson/' + externalid,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
          CSRFToken: '',
        },
        json: true,
      })
    )
    .then((response) => {
      return response.ResultSet.Result;
    })
}

export function uploadFile(targetPath, externalFolderID, internalFolderID, filename) {
  return login()
    .then(() => request({
      method: 'post',
      url: PF_URL + 'upload/' + externalFolderID,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      formData: {
        folderID: internalFolderID,
        path: '',
        ajax: 1,
        // action: 'rename',
        CSRFToken: '',
        file: {
          value: fs.createReadStream(targetPath),
          options: {
            filename: filename || path.basename(targetPath),
            contentType: mime.lookup(targetPath),
          },
        },
      },
    }));
}

