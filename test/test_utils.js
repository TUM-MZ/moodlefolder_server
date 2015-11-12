export function assertPromise(promise, handler, done) {
  promise.then(handler).then(done).catch((err) => { throw new Error(err) })
  .catch((err) => {
    console.error(err);
    done(err);
  });
}