import { create, read, update, deleteRecord, runQuery } from '../src/server/db/db_actions';
import { expect } from 'chai';
import { assertPromise } from './test_utils';
import { identity } from 'lodash';

describe('database utils', () => {
  it('should create an object to the specified table', (done) => {
    const promise = create('moodleuser', {lrzid: 'test', email: 'test@test.com'})
      .then(() =>
        runQuery('SELECT * FROM moodleuser WHERE lrzid=$1', 'test')
      )
      .then(({rows}) => {
        expect(rows.length).to.equal(1);
        expect(rows[0].lrzid).to.equal('test');
        expect(rows[0].email).to.equal('test@test.com');
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
      .then((result) => {
        expect(result).to.be.ok;
        expect(result.lrzid).to.equal('test');
        expect(result.email).to.equal('test@test.com');
      })
      .then(() => runQuery('DELETE FROM moodleuser WHERE lrzid=$1 or lrzid=$2', 'test', 'test2'))
      .then(() => undefined);
    assertPromise(done, promise, identity);
  });

  it('should update a created object', (done) => {
    const promise = create('moodleuser', { lrzid: 'test', 'email': 'test@test.com' })
      .then(() => update('moodleuser', { lrzid: 'test' }, { lrzid: 'test2', 'email': 'test2@test.com' }))
      .then(() => read('moodleuser', { lrzid: 'test2' }))
      .then((result) => {
        expect(result).to.be.ok;
        expect(result.lrzid).to.equal('test2');
        expect(result.email).to.equal('test2@test.com');
      })
      .then(() => runQuery('DELETE FROM moodleuser WHERE lrzid=$1', 'test2'))
      .then(() => undefined);
    assertPromise(done, promise, identity);
  });

  it('should create and delete record', (done) => {
    const promise = create('moodleuser', { lrzid: 'aksdfjaldsjf', 'email': 'adsf@adsfa.com' })
      .then(() => deleteRecord('moodleuser', { lrzid: 'aksdfjaldsjf'}))
      .then(() => read('moodleuser', { lrzid: 'aksdfjaldsjf' }))
      .then((result) => {
        expect(result).to.be.undefined;
      });
    assertPromise(done, promise, identity);
    })
});
