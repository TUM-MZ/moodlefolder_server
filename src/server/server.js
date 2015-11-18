import restify from 'restify';
import { addUserToCourse, listCoursesForUser, updateResources } from './driver';
import { VERSION } from '../version';

const server = restify.createServer({
  name: 'moodleFolderServer',
  version: VERSION,
});

server.use(restify.queryParser())

server.get('test', (req, res, next) => {
  res.send('Hello, world!');
  return next();
});

function handleError(response, next) {
  return (error) => {
    response.send(`An error occured: ${error}`);
    next();
  };
}

server.get('addUserToCourse/', (request, response, next) => {
  const { courseid, userid } = request.params;
  addUserToCourse(userid, courseid)
    .then(() => {
      response.send({'message': `Added user ${userid} to course ${courseid}`});
      next();
    }, handleError(response, next));
});

server.get('listCourseForUser/', (request, response, next) => {
  const { userid } = request.params;
  listCoursesForUser(userid)
    .then((courses) => {
      response.send({user: userid, courses});
      next();
    }, handleError(response, next));
});

server.get('updateResources/', (request, response, next) => {
  updateResources()
    .then(() => {
      response.send({'message': 'Resources updated'});
      next();
    }, handleError(response, next));
})

export default server;
