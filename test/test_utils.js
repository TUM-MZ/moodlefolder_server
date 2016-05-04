import { identity } from 'lodash';

export function assertPromise(done, promise, handler = identity) {
  promise.then(handler).then(done).catch((err) => {
    console.error('Catched error at:');
    console.error(err.stack);
    throw new Error(err); })
  .catch((err) => {
    console.error(err);
    done(err);
  });
}