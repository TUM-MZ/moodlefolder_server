import { uploadResource, addCourse, clearCourse, updateResources, addUserToCourse, createUser } from '../src/server/driver';
import { assertPromise } from './test_utils';
import { readCourse, read, runQuery } from '../src/server/db/db_actions';
import { identity } from 'lodash';
import { expect } from 'chai';

describe('main driver', () => {
  it('should upload specified resource', (done) => {
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
    const course = {
      powerfolderexternalid: 'Mkw5TWdIdkJQUFpMWWlRY1laNU5q',
      powerfolderinternalid: '2L9MgHvBPPZLYiQcYZ5Nj',
    };

    const uploadpromise = uploadResource(course, resource);

    assertPromise(done, uploadpromise, () => undefined);
  });

  it('should create a new course by moodle id and remove it', function(done) {
    const moodleid = 3;
    let courseinfo;
    this.timeout(4000);
    const addpromise = addCourse(moodleid)
      .then(() => readCourse(moodleid))
      .then((responseCourseinfo) => {
        courseinfo = responseCourseinfo;
        return clearCourse(moodleid);
      })
      .then(() => courseinfo);
    assertPromise(done, addpromise, (course) => {
      expect(course.moodleid).to.equal(moodleid);
    });
  });

  it('should update the list of added courses with their content', function(done) {
    // const promise = addCourse(3)
    //  .then(() => updateResources);
    this.timeout(4000);
    const promise = updateResources();

    assertPromise(done, promise, () => undefined);
  });

  it('should add a user to a course', function(done) {
    this.timeout(4000);
    const promise = addUserToCourse('admin', 3);
    assertPromise(done, promise, identity);
  });

  it('it should create a user', (done) => {
    const promise = createUser('admin')
      .then(() => read('moodleuser', {lrzid: 'admin'}))
      .then((result) => {
        expect(result[0].lrzid).to.equal('admin');
        expect(result[0].email).to.equal('alendit@gmail.com');
      })
      .catch(() => runQuery('DELETE FROM moodleuser WHERE lrzid=$1', 'admin'))
      .then(() => undefined);
    assertPromise(done, promise, identity);
  });
});
