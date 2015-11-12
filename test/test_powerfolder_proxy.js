import { login, createFolder, removeFolder, getFolderIdByName, uploadFile } from '../src/server/powerfolder_proxy';
import { cookieJar } from '../src/server/utils';
import { assertPromise } from './test_utils';
import { expect } from 'chai';
import path from 'path';

describe('powerfolder proxy', () => {
  it('should get cookie JSESSIONID when it logs in', (done) => {
    const loginpromise = login();
    assertPromise(done, loginpromise, () => {
      expect(JSON.stringify(cookieJar.getCookies('https://syncandshare.lrz.de/'))).to.contain('JSESSIONID');
    });
  });

  it('should create folder and remove', (done) => {
    const createpromise = createFolder('testfolder')
      .then((folderdata) => {
        return removeFolder(folderdata.ID);
      })
    assertPromise(done, createpromise, () => undefined);
  });

  it('should get folder external id by name', (done) => {
    const getpromise = getFolderIdByName('Alex Biro BA');
    assertPromise(done, getpromise, (externalid) => {
      expect(externalid).to.equal('Mld6a2gyZlFMUlVVQzdXeXhkb0pT');
    });
  });

  it('should upload specified file', (done) => {
    const uploadpromise = uploadFile(path.join(__dirname, 'test_file.txt'), 'Mkw5TWdIdkJQUFpMWWlRY1laNU5q',
      '2L9MgHvBPPZLYiQcYZ5Nj', 'test_file.txt');
    assertPromise(done, uploadpromise, (res) => { expect(JSON.parse(res).message).to.equal('File Uploaded') });
  });
});
