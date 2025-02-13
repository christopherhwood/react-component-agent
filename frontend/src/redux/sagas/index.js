import { all } from 'redux-saga/effects';
import { watchAddToWaitlist } from './waitlistUser';
import { watchStartGeneration } from './startGeneration';
import { watchResumeGeneration, watchEnqueueUpdate } from './processTask';
import { watchSignIn } from './signInUser';
import { watchSignUp } from './signUpUser';
import { watchSelectUserTask, watchAddUserTask } from './selectUserTask';
import { watchLoadUserTasks } from './loadUserTasks';

export default function* rootSaga() {
  yield all([
    watchAddToWaitlist(),
    watchStartGeneration(),
    watchSignIn(),
    watchSignUp(),
    watchLoadUserTasks(),
    watchResumeGeneration(),
    watchSelectUserTask(),
    watchAddUserTask(),
    watchEnqueueUpdate(),
  ]);
}
