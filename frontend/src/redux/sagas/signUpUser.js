import { call, put, takeLatest } from 'redux-saga/effects';
import * as api from '../../api';
import { validateInvitationCodeSuccess, validateInvitationCodeFailure, validateInvitationCode } from '../slices/userSignUpSlice';
import { signInSuccess } from '../slices/userSignInSlice';

function* handleSignUp(action) {
  try {
    const { invitationCode } = action.payload;
    yield call(api.validateInvite, invitationCode);
    yield put(validateInvitationCodeSuccess());
    yield put(signInSuccess({invitationRequired: false}));
  } catch (error) {
    yield put(validateInvitationCodeFailure(error.response.data.message));
  }
}

export function* watchSignUp() {
  yield takeLatest(validateInvitationCode, handleSignUp);
}