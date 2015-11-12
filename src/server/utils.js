import pure_request from 'request';
export const cookieJar = pure_request.jar();

 export function request(options) {
  return new Promise((fulfill, reject) => {
    const extOptions = Object.assign(options, {jar: cookieJar});
    pure_request(extOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        fulfill(body);
      } else {
        reject(error || 'Error ' + response.statusCode + ', body: ' + body);
      }
    });
  });
}