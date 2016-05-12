import pure_request from 'request';
export const cookieJar = pure_request.jar();
let CSRFToken = '';

 export function request(options) {
  return new Promise((fulfill, reject) => {
    const { form, qs, ...restOptions } = options;

    const extOptions = {
      ...restOptions,
      jar: cookieJar,
      followAllRedirects: true,
    };
    if (!!form) {
      extOptions.form = { ...form, CSRFToken }
    }
    if (!!qs) {
      extOptions.qs = { ...qs, CSRFToken }
    }
    pure_request(extOptions, (error, response, body) => {
      const tokenMatch = /var csrf_token = \'(.*)\'/g.exec(body);
      if (!!tokenMatch) {
        CSRFToken = tokenMatch[1];
      }
      if (!error && response.statusCode === 200) {
        fulfill(body);
      } else {
        reject(error || 'Error at ' + extOptions.url +': ' + response.statusCode + ', body: ' + body);
      }
    });
  });
}