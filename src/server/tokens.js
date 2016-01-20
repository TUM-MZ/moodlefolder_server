export let WS_TOKEN;
export let WS_USER_TOKEN;

try {
  const secret_tokens = require('./secret_tokens');
  WS_TOKEN = secret_tokens.WS_TOKEN;
  WS_USER_TOKEN = secret_tokens.WS_USER_TOKEN;
  console.log("loaded from secret");
}
catch (e) {
  WS_TOKEN = process.env.WS_TOKEN;
  WS_USER_TOKEN = process.env.WS_USER_TOKEN;
  console.log("loaded from env");
}
