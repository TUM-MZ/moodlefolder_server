export function assertPromise(done, promise, handler) {
  promise.then(handler).then(done).catch((err) => { throw new Error(err); })
  .catch((err) => {
    console.error(err);
    done(err);
  });
}