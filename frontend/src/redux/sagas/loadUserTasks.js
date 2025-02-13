import { call, put, takeLatest } from 'redux-saga/effects';
import { loadUserTasks, loadUserTasksFailure, loadUserTasksSuccess } from '../slices/userTasksSlice';
import * as api from '../../api';

function* handleLoadUserTasks() {
  try {
    const { data } = yield call(api.getUserTasks);
    const { userTasks } = data;
    yield put(loadUserTasksSuccess(userTasks));
  } catch (error) {
    yield put(loadUserTasksFailure(error));
  }
}

export function* watchLoadUserTasks() {
  yield takeLatest(loadUserTasks, handleLoadUserTasks);
}

