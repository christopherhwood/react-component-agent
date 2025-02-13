const Router = require('koa-router');
const userTaskController = require('../controllers/userTaskController');
const subtaskController = require('../controllers/subtaskController');
const userController = require('../controllers/userController');
const { validateActiveUser, invalidateActiveUserCacheMiddleware } = require('../middleware/validateActiveUser');

const router = new Router();

router.prefix('/api/react-studio');

router.get(
  '/user-task',
  // validateActiveUser,
  userTaskController.getUserTasks
);
router.post(
  '/user-task', 
  // validateActiveUser,
  userTaskController.createUserTask
);
router.post(
  '/task/execute', 
  // validateActiveUser, 
  subtaskController.executeTask
);
router.post('/user/waitlist', userController.addToWaitlist);
router.post('/user/signIn', userController.signIn);
router.post(
  '/user/validateInvite', 
  invalidateActiveUserCacheMiddleware, 
  userController.validateInvite
);

module.exports = router;

