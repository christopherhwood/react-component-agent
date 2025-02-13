export const getUserInput = state => state.userTaskInput.inputValue || "";
export const getUserSelectedCategory = state => state.userTaskInput.category || "";
export const getUpdates = state => state.userTasks.userTasks[state.userTasks.selectedTaskIndex]?.tasks || [];
export const getEnqueuedUpdates = state => state.userTasks.enqueuedUpdates;
export const getGenerationStatus = state => state.userTaskInput.generationStatus;
export const getSelectedTask = state => state.userTasks.userTasks[state.userTasks.selectedTaskIndex];
export const getSelectedStatusUpdate = state => state.userTasks.userTasks[state.userTasks.selectedTaskIndex]?.tasks[state.userTasks.selectedUpdateIndex];
export const getCurrentCode = state => state.userTasks.userTasks[state.userTasks.selectedTaskIndex]?.tasks[state.userTasks.selectedUpdateIndex]?.code;