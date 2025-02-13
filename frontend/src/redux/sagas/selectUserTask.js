import { put, takeLatest, select } from 'redux-saga/effects';
import { selectUserTask, addUserTask } from '../slices/userTasksSlice.js';
import { getSelectedTask } from '../selectors/index.js';
import { GenerationStatus, clearGenerationState, setStateForSelectedTask } from '../slices/userTaskInputSlice.js';

function* handleSelectUserTask() {
  const selectedTask = yield select(getSelectedTask);
  if (!selectedTask) return;
  yield put(clearGenerationState());

  // TODO - populate input values & lock them.
  // NOTE - pause here since the user might not want to run this yet.
  let generationStatus = GenerationStatus.SUCCESS;
  if (selectedTask.tasks.filter(t => t.status === 'PENDING').length > 0) {
    generationStatus = GenerationStatus.PAUSED;
  }
  yield put(setStateForSelectedTask({input: selectedTask.description, category: selectedTask.category, generationStatus: generationStatus, userTaskId: selectedTask._id}));
}

function* handleAddUserTask() {
  const selectedTask = yield select(getSelectedTask);
  if (!selectedTask) return;
  // Not clearing the state like in the select task!

  // TODO - populate input values & lock them.
  let generationStatus = GenerationStatus.SUCCESS;
  if (selectedTask.tasks.filter(t => t.status === 'PENDING').length > 0) {
    generationStatus = GenerationStatus.RUNNING; // This is different from select task!
  }
  // This is updating the userTaskId & the generation status
  yield put(setStateForSelectedTask({input: selectedTask.description, category: selectedTask.category, generationStatus: generationStatus, userTaskId: selectedTask._id})); 
}

export function* watchSelectUserTask() {
  yield takeLatest(selectUserTask, handleSelectUserTask);
}

export function* watchAddUserTask() {
  yield takeLatest(addUserTask, handleAddUserTask);
}

