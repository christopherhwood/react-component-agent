import { call, put, takeLatest, select } from 'redux-saga/effects';
import { pauseGeneration, resumeGeneration, generationSuccess } from '../slices/userTaskInputSlice';
import { dequeueUpdate, enqueueUpdate, selectUpdate, updateUpdate, setIsUpdateProcessing } from '../slices/userTasksSlice.js';
import { executeTask } from '../../api';
import { getUpdates, getEnqueuedUpdates, getSelectedTask } from '../selectors';

function* handleResumeGeneration() {
  const updates = yield select(getUpdates);
  const inProgressUpdate = updates.find(update => update.status === 'IN PROGRESS');
  if (!inProgressUpdate) {
    const nextUpdate = updates.find(update => update.status === 'PENDING');
    if (nextUpdate) {
      yield put(enqueueUpdate(nextUpdate));
    } else if (updates.every(update => update.status === 'SUCCESS')) {
      yield put(generationSuccess());
    } else {
      yield put(pauseGeneration());
    }
  }
}

function* handleEnqueueUpdate() {
  const userTask = yield select(getSelectedTask);
  if (userTask.isUpdateProcessing) {
    // Exit if an update is already being processed
    return;
  }
  const taskId = userTask.id;

  // Set the flag to indicate that update processing is starting
  yield put(setIsUpdateProcessing(true));

  const updates = yield select(getEnqueuedUpdates);
  for (const update of updates) {
    yield put(dequeueUpdate(update));
    yield put(updateUpdate({ ...update, status: 'IN PROGRESS' }));
    yield call(executeUpdate, update);
  }

  // Set the flag to false to indicate that update processing is completed
  yield put(setIsUpdateProcessing(false));
  const checkUserTask = yield select(getSelectedTask);

  // Only update the generation state if the user has not switched tasks.
  if (checkUserTask.id === taskId) {
    yield put(resumeGeneration());
  }
}

function* executeUpdate(update) {
  try {
    const { data } = yield call(executeTask, update.id);
    const { task } = data;
    yield put(updateUpdate(task));
    const selectedUserTask = yield select(getSelectedTask);
    if (task.status === 'SUCCESS' && selectedUserTask.id === task.userTaskId) {
      yield put(selectUpdate(task));
    }
  } catch (error) {
    // Mark task as FAILED and report the error.
    yield put(updateUpdate({ ...update, status: 'FAILED' }));
  }
}

export function* watchEnqueueUpdate() {
  yield takeLatest(enqueueUpdate, handleEnqueueUpdate);
}

export function* watchResumeGeneration() {
  yield takeLatest(resumeGeneration, handleResumeGeneration);
}

