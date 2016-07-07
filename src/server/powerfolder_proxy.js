import { downloadFile } from './moodle_proxy';
import path from 'path';
import fs from 'fs';
import mime from 'mime';
import { filter } from 'lodash';
import { CSRFRequest, cookieJar, CSRFToken } from './utils';

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

export async function login(attempt = 0) {
  if (CSRFToken !== '') return CSRFToken;
  try {
    const result = await CSRFRequest({
      method: 'post',
      url: PF_URL + 'login',
      form: {
        Username: pflogin,
        Password: pfpassword,
        Login: 'Login',
        originalURI: '',
      },
    });
    if (CSRFToken === '') {
      if (attempt > 3) {
        throw Error(`Cannot get the CSRFToken after ${attempt} attempts`);
      } else {
        return await login(++attempt);
      }
    } else {
      return result;
    }
  } catch (err) {
    throw Error(err);
  }
}

export function createFolder(folderName) {
  return CSRFRequest({
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
export function removeFolder(foldername, internalfolderid) {
  return login()
    .then(() =>
      CSRFRequest({
        url: PF_URL + 'leavefolder',
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
          leave: 'true',
          removePermission: 'true',
          FolderID: internalfolderid,
          FolderName: foldername,
          action: 'leave',
        },
      })
    );
}

export function getFolderIdsByName(foldername) {;
  return login()
    .then(() => {
      return CSRFRequest({
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
      CSRFRequest({
        method: 'post',
        url: PF_URL + 'members/' + externalid,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
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
        throw Error(response);
      }
      return response.oid;
    });
}

export function unshareFolder(course, user, oid) {
  const externalid = course.powerfolderexternalid;
  const lrzid = user.lrzid;
  return login()
    .then(() =>
      CSRFRequest({
        method: 'DELETE',
        url: PF_URL + 'members/' + externalid,
        qs: {
          OID: 'doesntmatter',
          username: lrzid,
        },
        json: true,
      })
    )
    .then((response) => {
      if (!response.message) {
        throw Error(response);
      }
    }, (err) => {console.log('errunshare', err); throw Error(err)});
}

export function getFolderMembers(course) {
  const externalid = course.powerfolderexternalid;

  return login()
    .then(() =>
      CSRFRequest({
        method: 'GET',
        url: PF_URL + 'membersjson/' + externalid,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        },
        qs: {
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
    .then(() => CSRFRequest({
      method: 'post',
      url: PF_URL + 'upload/' + externalFolderID,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:12.0) Gecko/20100101 Firefox/12.0',
        'X-Requested-With': 'XMLHttpCSRFRequest',
      },
      formData: {
        folderID: internalFolderID,
        path: '',
        ajax: 1,
        // action: 'rename',
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

