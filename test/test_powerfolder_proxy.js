import { login, createFolder, removeFolder, getFolderIdsByName, shareFolder,
  uploadFile, unshareFolder, getFolderMembers } from '../src/server/powerfolder_proxy';
import { cookieJar, request } from '../src/server/utils';
import { assertPromise } from './test_utils';
import { expect } from 'chai';
import { identity, pluck } from 'lodash';
import path from 'path';

describe('powerfolder proxy', () => {
  it('should get cookie JSESSIONID when it logs in', function(done) {
    this.timeout(4000);
    const loginpromise = login();
    assertPromise(done, loginpromise, () => {
      expect(JSON.stringify(cookieJar.getCookies('https://syncandshare.lrz.de/'))).to.contain('JSESSIONID');
    });
  });

  it('should create folder and remove', function (done) {
    this.timeout(8000);
    const createpromise = createFolder('testfolder')
      .then((folderdata) => {
        return removeFolder(folderdata.folderName, folderdata.ID);
      })
    assertPromise(done, createpromise, () => undefined);
  });

  it('should get folder external id by name', (done) => {
    const getpromise = getFolderIdsByName('perm');
    assertPromise(done, getpromise, ({ powerfolderexternalid, powerfolderinternalid }) => {
      expect(powerfolderexternalid).to.equal('Mkw5TWdIdkJQUFpMWWlRY1laNU5q');
      expect(powerfolderinternalid).to.equal('2L9MgHvBPPZLYiQcYZ5Nj');
    });
  });

  it('should return undefined if folder with a name doesn\'t exist', (done) => {
    const getpromise = getFolderIdsByName('asdffdas123123');
    assertPromise(done, getpromise, (response) => {
      expect(response).to.be.an('undefined');
    });
  });

  it('should upload specified file', (done) => {
    const uploadpromise = uploadFile(path.join(__dirname, 'test_file.txt'), 'Mkw5TWdIdkJQUFpMWWlRY1laNU5q',
      '2L9MgHvBPPZLYiQcYZ5Nj', 'test_file.txt');
    assertPromise(done, uploadpromise, (res) => { expect(JSON.parse(res).message).to.equal('File Uploaded') });
  });

  it('should share a course\'s folder to the specified user', function(done) {
    this.timeout(4000);
    const course = { powerfolderexternalid: 'Mkw5TWdIdkJQUFpMWWlRY1laNU5q' };
    const user = { lrzid: 'test_vorona_1' };
    const promise = shareFolder(course, user);
    assertPromise(done, promise, identity);
  });

  it('should share and then unshare course to a user', function(done) {
    this.timeout(8000);
    const course = { powerfolderexternalid: 'Mkw5TWdIdkJQUFpMWWlRY1laNU5q' };
    const user = { lrzid: 'test_vorona_1' };
    const promise = shareFolder(course, user)
      .then(() => unshareFolder(course, user))
      .then(() => getFolderMembers(course))
      .then((members) => {
        expect(pluck(members, 'username')).to.not.contain('test_vorona_1');
      });
    assertPromise(done, promise, identity);
  })
});
