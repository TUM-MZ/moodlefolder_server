import { create, read, runQuery, connectUserToCourse } from '../src/server/db/db_actions';
import { expect } from 'chai';
import { assertPromise } from './test_utils';
import { identity } from 'lodash';

describe('database utils', () => {
  it('should create an object to the specified table', (done) => {
    const promise = create('moodleuser', {lrzid: 'test', email: 'test@test.com'})
      .then(() =>
        runQuery('SELECT * FROM moodleuser WHERE lrzid=$1', 'test')
      )
      .then((result) => {
        expect(result.rows.length).to.equal(1);
        const row = result.rows[0];
        expect(row.lrzid).to.equal('test');
        expect(row.email).to.equal('test@test.com');
      })
      .then(() =>
        runQuery('DELETE FROM moodleuser WHERE lrzid=$1', 'test')
      )
      .then(() => undefined);
    assertPromise(done, promise, identity);
  });

  it('should read a created object', (done) => {
    const promise = create('moodleuser', {lrzid: 'test', email: 'test@test.com'})
      .then(() => create('moodleuser', {lrzid: 'test2', email: 'test2@test.com'}))
      .then(() => read('moodleuser', {lrzid: 'test'}))
      .then((rows) => {
        expect(rows.length).to.equal(1);
        expect(rows[0].lrzid).to.equal('test');
        expect(rows[0].email).to.equal('test@test.com');
      })
      .then(() => runQuery('DELETE FROM moodleuser WHERE lrzid=$1 or lrzid=$2', 'test', 'test2'))
      .then(() => undefined);
    assertPromise(done, promise, identity);
  });
});
