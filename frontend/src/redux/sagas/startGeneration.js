import { call, put, takeLatest, select } from 'redux-saga/effects';
import { createUserTask } from '../../api';
import { startGeneration, generationFailure } from '../slices/userTaskInputSlice';
import { getSelectedTask, getUserInput, getUserSelectedCategory } from '../selectors/index.js';
import { addUserTask, showAddingNewTaskLoading, enqueueUpdate, selectUpdate } from '../slices/userTasksSlice.js';

function* handleStartGeneration() {
  try {
    const userInput = yield select(getUserInput);
    const category = yield select(getUserSelectedCategory);
    yield put(showAddingNewTaskLoading());
    
    const { data } = yield call(createUserTask, {input: userInput, category: category});
    // We get back a user task w/ subtasks attached.
    yield put(addUserTask(data));
    const selectedUserTask = yield select(getSelectedTask);
    const selectedUserTaskId = selectedUserTask?.id;
    // select the last success subtask
    if (selectedUserTaskId === data.id) {
      const lastSuccessSubtask = [...data.tasks].reverse().find(subtask => subtask.status === 'SUCCESS');
      if (lastSuccessSubtask) {
        yield put(selectUpdate(lastSuccessSubtask));
      }
      // get the first subtask marked pending
      const firstPendingSubtask = data.tasks.find(subtask => subtask.status === 'PENDING');
      yield put(enqueueUpdate(firstPendingSubtask));
    }
  } catch (error) {
    console.log('error', error);
    yield put(generationFailure('Failed to start generation'));
  }
}

export function* watchStartGeneration() {
  yield takeLatest(startGeneration, handleStartGeneration);
}