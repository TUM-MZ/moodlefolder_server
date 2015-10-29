import { getCourseResources, getCourseInfo } from '../src/server/moodle_proxy';
import { expect } from 'chai';

describe('getting resource list from the API', () => {
  it('should get the list of objects of a specified course', (done) => {
    const courseinfo = getCourseResources(3);
    courseinfo.then((resourses) => {
      expect(resourses).to.have.length(2);
      done();
    });
  });

  it('should get course information of a specified course', (done) => {
    const courseinfo = getCourseInfo(2);
    courseinfo.then((info) => {
      expect(info.shorttitle).to.equal('f1');
      expect(info.moodle_id).to.equal(2);
      done();
    });
  });
});
