import { createSlice } from '@reduxjs/toolkit';

export const GenerationStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  SUCCESS: 'success',
  FAILED: 'failed',
};


// Initial state for the user's task input
const initialState = {
  inputValue: '', // The user's input text
  category: '',
  generationStatus: GenerationStatus.PENDING, // Tracks if the request to generate the component is in progress
  generatorError: null, // Any error messages from trying to generate the component
  userTaskId: null,
};

const userTaskInputSlice = createSlice({
  name: 'userTaskInput', 
  initialState,
  reducers: {
    // Updates the inputValue based on user input
    setInputValue: (state, action) => {
      state.inputValue = action.payload.input;
      state.category = action.payload.category;
    },
    // Sets isGenerating to true when the generation process starts
    startGeneration: state => {
      state.generationStatus = GenerationStatus.RUNNING;
      state.generatorError = null;
    },
    pauseGeneration: state => {
      state.generationStatus = GenerationStatus.PAUSED;
    },
    resumeGeneration: state => {
      state.generationStatus = GenerationStatus.RUNNING;
    },
    // Handles successful component generation
    generationSuccess: state => {
      state.generationStatus = GenerationStatus.SUCCESS;
    },
    // Handles errors in component generation
    generationFailure: (state, action) => {
      state.generationStatus = GenerationStatus.FAILED;
      state.generatorError = action.payload; // Error message is passed as payload
    },
    clearGenerationState: state => {
      state.inputValue = '';
      state.category = '';
      state.generationStatus = GenerationStatus.PENDING;
      state.generatorError = null;
      state.userTaskId = null;
    },
    setStateForSelectedTask: (state, action) => {
      state.inputValue = action.payload.input;
      state.category = action.payload.category;
      state.generationStatus = action.payload.generationStatus;
      state.userTaskId = action.payload.userTaskId;
    }
  },
});

// Export the action creators
export const { setInputValue, startGeneration, generationSuccess, generationFailure, pauseGeneration, resumeGeneration, clearGenerationState, setStateForSelectedTask } = userTaskInputSlice.actions;

// Export the reducer
export default userTaskInputSlice.reducer;

