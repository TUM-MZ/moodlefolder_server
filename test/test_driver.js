import { uploadResource } from '../src/server/driver';
import { assertPromise } from './test_utils';

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
    }

    const uploadpromise = uploadResource(course, resource);

    assertPromise(done, uploadpromise, () => undefined);
  });
})