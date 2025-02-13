import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoadingList: false,
  isAddingNewTask: false,
  selectedUpdateIndex: null,
  selectedTaskIndex: null,
  userTasks: [],
  enqueuedUpdates: [],
  error: null,
};

const userTasksSlice = createSlice({
  name: 'userTasks',
  initialState,
  reducers: {
    loadUserTasks: (state, action) => {
      state.isLoadingList = true;
      state.error = null;
    },
    loadUserTasksSuccess: (state, action) => {
      state.isLoadingList = false;
      state.userTasks = action.payload;
    },
    loadUserTasksFailure: (state, action) => {
      state.isLoadingList = false;
      state.userTasks = [];
    },
    selectUserTask: (state, action) => {
      state.selectedTaskIndex = state.userTasks.findIndex(task => task.id === action.payload?.id);
      if (state.selectedTaskIndex === -1) {
        state.selectedTaskIndex = null;
      }
      if (!state.selectedTaskIndex) {
        state.selectedUpdateIndex = null;
      } else {
        state.selectedUpdateIndex = [...state.userTasks[state.selectedTaskIndex].tasks].reverse().findIndex(update => update.status === 'SUCCESS');
      }
    },
    showAddingNewTaskLoading: (state, action) => {
      state.isAddingNewTask = true;
    },
    addUserTask: (state, action) => {
      state.isAddingNewTask = false;
      state.userTasks.unshift(action.payload);
      state.error = null;
      state.selectedTaskIndex = 0;
    },
    clearUserTasks: (state, action) => {
      state.userTasks = [];
      state.error = null;
      state.selectedTaskIndex = null;
      state.isLoading = false;
    },
    enqueueUpdate: (state, action) => {
      const update = action.payload;
      const userTask = state.userTasks.find(t => t.id === update.userTaskId);
      if (userTask) {
        const existingIndex = userTask.tasks.findIndex(t => t.id === update.id);
        if (existingIndex === -1) return;
        state.enqueuedUpdates.push(update);
      }
    },
    dequeueUpdate: (state, action) => {
      const update = action.payload;
      const userTask = state.userTasks.find(t => t.id === update.userTaskId);
      if (userTask) {
        const existingIndex = userTask.tasks.findIndex(t => t.id === update.id);
        if (existingIndex === -1) return;
        state.enqueuedUpdates = state.enqueuedUpdates.filter(u => u.id !== update.id);
      }
    },
    updateUpdate: (state, action) => {
      const newUpdate = action.payload;
      const userTask = state.userTasks.find(t => t.id === newUpdate.userTaskId);
      if (userTask) {
        const existingIndex = userTask.tasks.findIndex(update => update.id === newUpdate.id);
        if (existingIndex === -1) return;
        userTask.tasks[existingIndex] = newUpdate;
      }
    },
    // Can only select a successful update
    selectUpdate: (state, action) => {
      if (action.payload.status !== 'SUCCESS') return;
      if (action.payload.id === state.userTasks[state.selectedTaskIndex]?.tasks[state.selectedUpdateIndex]?.id) return;
      state.selectedUpdateIndex = state.userTasks[state.selectedTaskIndex]?.tasks.findIndex(task => task.id === action.payload.id);
    },
    // Don't worry about selected updates being deleted because SUCCESS updates can't be deleted.
    deleteUpdate: (state, action) => {
      const updateToDelete = action.payload;
      if (updateToDelete.status === 'SUCCESS') return;
      const userTask = state.userTasks.find(t => t.id === updateToDelete.userTaskId);
      userTask.tasks = userTask.tasks.filter(update => update.id !== updateToDelete.id);
      state.enqueuedUpdates = state.enqueuedUpdates.filter(update => update.id !== updateToDelete.id);
    },
    setIsUpdateProcessing: (state, action) => {
      const { isProcessing, userTaskId } = action.payload;
      const userTask = state.userTasks.find(ut => ut.id === userTaskId);
      if (userTask) {
        userTask.isProcessing = isProcessing;
      }
    },
  },
});

export const { loadUserTasks, loadUserTasksSuccess, loadUserTasksFailure, selectUserTask, addUserTask, clearUserTasks, showAddingNewTaskLoading, enqueueUpdate, dequeueUpdate, updateUpdate, selectUpdate, deleteUpdate, setIsUpdateProcessing } = userTasksSlice.actions;

export default userTasksSlice.reducer;
