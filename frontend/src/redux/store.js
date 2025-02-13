import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas/index';
import waitlistUserReducer from './slices/waitlistUserSlice';
import userTaskInputReducer from './slices/userTaskInputSlice';
import userSignInReducer from './slices/userSignInSlice';
import userSignUpReducer from './slices/userSignUpSlice';
import userTasksReducer from './slices/userTasksSlice';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    userSignIn: userSignInReducer,
    userSignUp: userSignUpReducer,
    userTasks: userTasksReducer,
    userTaskInput: userTaskInputReducer,
    waitlistUser: waitlistUserReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false}).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export default store;
