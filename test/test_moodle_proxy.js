import { getCourseResources, getCourseInfo } from '../src/server/moodle_proxy';
import { expect } from 'chai';
import { identity } from 'lodash';
import request from 'request';
import { assertPromise } from './test_utils';

describe('getting resource list from the API', () => {
  it('should get the list of objects of a specified course', (done) => {

    const courseinfo = getCourseResources({moodleid: 3});
    assertPromise(courseinfo, (resourses) => {
      expect(resourses).to.have.length(2);
    }, done);
  });

  it('should get course information of a specified course', (done) => {
    const courseinfo = getCourseInfo({moodleid: 2});
    assertPromise(courseinfo, (info) => {
      expect(info.shorttitle).to.equal('f1');
      expect(info.moodleid).to.equal(2);
    }, done);
  });
});
