import { call, put, takeLatest } from 'redux-saga/effects';
import * as api from '../../api';
import { signIn, signInSuccess, signOut } from '../slices/userSignInSlice';
import { clearUserTasks } from '../slices/userTasksSlice';

function* handleSignIn() {
  try {
    const { data } = yield call(api.signIn);
    const { invitationRequired, userId } = data;
    yield put(signInSuccess({ invitationRequired, userId }));
  } catch {
  }
}

function* handleSignOut() {
  yield put(clearUserTasks());
}

export function* watchSignIn() {
  yield takeLatest(signIn, handleSignIn);
}

export function* watchSignOut() {
  yield takeLatest(signOut, handleSignOut);
}
