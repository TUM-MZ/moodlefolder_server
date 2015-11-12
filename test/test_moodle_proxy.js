import { getCourseResources, getCourseInfo, downloadFile, getUserInfo } from '../src/server/moodle_proxy';
import { expect } from 'chai';
import { assertPromise } from './test_utils';
import fs from 'fs';

describe('getting resource list from the moodle API', () => {
  it('should get the list of objects of a specified course', (done) => {

    const courseinfo = getCourseResources({moodleid: 3});
    assertPromise(done, courseinfo, (resourses) => {
      expect(resourses).to.have.length(2);
    }, done);
  });

  it('should get course information of a specified course', (done) => {
    const courseinfo = getCourseInfo(2);
    assertPromise(done, courseinfo, (info) => {
      expect(info.shorttitle).to.equal('f1');
      expect(info.moodleid).to.equal(2);
    });
  });

  it('should download a file if told so', (done) => {
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
    const targetPath = '/tmp/resource.png';
    const downloadfile = downloadFile(resource, targetPath);
    assertPromise(done, downloadfile, () => {
      expect(fs.existsSync(targetPath)).to.equal(true);
      fs.unlinkSync(targetPath);
    });
  })

  it('should retrieve user infomation', (done) => {
    const userinfo = getUserInfo('admin');
    assertPromise(done, userinfo, (info) => {
      expect(info.lrzid).to.equal('admin');
      expect(info.email).to.equal('alendit@gmail.com');
    });
  });
});
