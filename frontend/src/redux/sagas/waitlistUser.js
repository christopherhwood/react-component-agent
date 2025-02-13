import { call, put, takeLatest } from 'redux-saga/effects';
import { addToWaitlist, addToWaitlistFailure, addToWaitlistSuccess } from '../slices/waitlistUserSlice';
import * as api from '../../api';

function* handleAddToWaitlist(action) {
  try {
    const { email } = action.payload;
    yield call(api.addToWaitlist, email);
    yield put(addToWaitlistSuccess(email));
  } catch (error) {
    yield put(addToWaitlistFailure(error.message));
  }
}

export function* watchAddToWaitlist() {
  yield takeLatest(addToWaitlist, handleAddToWaitlist);
}