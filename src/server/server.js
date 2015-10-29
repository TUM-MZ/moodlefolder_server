import restify from 'restify';
import { VERSION } from '../version';

const server = restify.createServer({
  name: 'moodleFolderServer',
  version: VERSION,
});

server.get('test', (req, res, next) => {
  res.send('Hello, world!');
  return next();
});

export default server;
