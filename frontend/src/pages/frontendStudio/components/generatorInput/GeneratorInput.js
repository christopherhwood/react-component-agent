import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import TopBar from './topBar/TopBar'
import { GenerationStatus } from '../../../../redux/slices/userTaskInputSlice';
import { startGeneration, setInputValue, pauseGeneration, resumeGeneration, clearGenerationState } from '../../../../redux/slices/userTaskInputSlice';
import { selectUserTask } from '../../../../redux/slices/userTasksSlice';
import { getUpdates } from '../../../../redux/selectors';
import ComponentTypeSelector from './ComponentTypeSelector';
import DetailInputField from './DetailInputField';
import GenerationOutputLabel from './GenerationFailedLabel';
import ProgressBar from './ProgressBar';


function useProgress() {
  const tasks = useSelector(getUpdates);
  const calculateProgress = useMemo(() => {
    if (!tasks) return { progress: 0, generationFailed: false };

    const completedTasks = tasks.filter(task => task.status === 'SUCCESS').length;
    const failedTask = tasks.find(task => task.status === 'FAILED');
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    return { progress, generationFailed: failedTask };
  }, [tasks]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressInfo(calculateProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateProgress]);

  const [progressInfo, setProgressInfo] = useState({ progress: 0, generationFailed: false });

  return progressInfo;
}

// Custom hook to call state.userTaskInput.setInputValue and state.userTaskInput.startGeneration
function useUserTaskInput() {
  const dispatch = useDispatch();
  const { inputValue, category, generationStatus, generatorError } = useSelector(state => state.userTaskInput);
  
  const setUserTaskInput = useCallback(({input, category}) => {
    dispatch(setInputValue({input, category}));
  }, [dispatch]);

  const startUserTaskGeneration = useCallback(() => {
    dispatch(startGeneration());
  }, [dispatch]);

  const pauseUserTaskGeneration = useCallback(() => {
    dispatch(pauseGeneration());
  }, [dispatch]);

  const resumeUserTaskGeneration = useCallback(() => {
    dispatch(resumeGeneration());
  }, [dispatch]);

  const clearUserTask = useCallback(() => {
    dispatch(clearGenerationState());
  }, [dispatch]);

  const selectNoUserTask = useCallback(() => {
    dispatch(selectUserTask(null));
  }, [dispatch]);

  return { inputValue, category, generationStatus, generatorError, setInputValue: setUserTaskInput, startUserTaskGeneration, pauseUserTaskGeneration, resumeUserTaskGeneration, clearUserTask, selectNoUserTask };
}

function ComponentRequestForm({ featureFlag }) {
  const { generationStatus, generatorError, inputValue, category, setInputValue, startUserTaskGeneration, pauseUserTaskGeneration, resumeUserTaskGeneration, clearUserTask, selectNoUserTask } =
    useUserTaskInput();
  const [selectedComponent, setSelectedComponent] = useState("");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(true);
  
  const { progress, generationFailed } = useProgress();

  const handleComponentChange = useCallback((event) => {
    const value = event.target.value;
    setSelectedComponent(value);
    setShowSuccess(false);
  }, []);

  const handleDetailChange = useCallback((event) => {
    setDetail(event.target.value);
    setShowSuccess(false);
  }, []);

  const handleNewGeneration = () => {
    setSelectedComponent("");
    setDetail("");
    setError("");
    setShowSuccess(false);
    clearUserTask();
    setShowGenerateButton(true);
    selectNoUserTask();
  };

  const handlePauseResume = () => {
    generationStatus === GenerationStatus.RUNNING ? pauseUserTaskGeneration() : resumeUserTaskGeneration();
  };

  const progressBarRef = useRef(null);
  const errorAlertRef = useRef(null);
  const componentTypeSelectRef = useRef(null);
  const detailInputRef = useRef(null);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (
        !selectedComponent ||
        (selectedComponent === "custom" && !detail.trim())
      ) {
        setError(
          selectedComponent === "custom" && !detail.trim()
            ? "Please provide the necessary details for the custom component."
            : "Please select a component.",
        );
        if (selectedComponent === "custom" && !detail.trim()) {
          detailInputRef.current.focus();
        } else {
          componentTypeSelectRef.current.focus();
        }
        errorAlertRef.current.setAttribute("aria-live", "assertive");
      } else {
        setInputValue({input: detail.trim(), category: selectedComponent});
        startUserTaskGeneration();
        setShowGenerateButton(false);
        setShowSuccess(false);
      }
    },
    [selectedComponent, detail, setInputValue, startUserTaskGeneration],
  );

  useEffect(() => {
    setDetail(inputValue);
  }, [inputValue]);

  useEffect(() => {
    setSelectedComponent(category);
  }, [category]);

  useEffect(() => {
    setShowGenerateButton(generationStatus === GenerationStatus.PENDING);
   
    setShowSuccess(progress === 100);
  }, [generationStatus, progress]);

  const pauseResumeButtonEnabled = generationStatus === GenerationStatus.RUNNING || generationStatus === GenerationStatus.PAUSED;
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center p-4 text-gray-100"
      aria-labelledby="formTitle"
    >
      <TopBar
        handleNewGeneration={handleNewGeneration}
        handlePauseResume={handlePauseResume}
        generationStatus={generationStatus}
        pauseResumeButtonEnabled={pauseResumeButtonEnabled}
      />
      
      <ComponentTypeSelector 
        componentTypeSelectRef={componentTypeSelectRef}
        generationStatus={generationStatus}
        error={error}
        selectedComponent={selectedComponent}
        handleComponentChange={handleComponentChange}
        customComponentFeatureFlag={featureFlag}
      />

      <DetailInputField
        generationStatus={generationStatus}
        selectedComponent={selectedComponent}
        detailInputRef={detailInputRef}
        detail={detail}
        handleDetailChange={handleDetailChange}
        error={error}
      />

      {showGenerateButton ? (
        <button
          type="submit"
          className="mt-4 px-4 py-2 rounded text-gray-950 font-semibold bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-500"
          aria-hidden="false"
        >
          Generate
        </button>
      ) : (
        <div className="text-center text-gray-300 w-full max-w-md mt-4" aria-live="assertive">
          <ProgressBar
            generationStatus={generationStatus}
            generationFailed={generationFailed}
            progress={progress}
            progressBarRef={progressBarRef}
          />
          <GenerationOutputLabel
            showSuccess={showSuccess}
            generationFailed={generationFailed}
            generationStatus={generationStatus}
            generatorError={generatorError}
            errorAlertRef={errorAlertRef}
            error={error}
            startUserTaskGeneration={startUserTaskGeneration}
          />
        </div>
      )} 
    </form>
  );
}

ComponentRequestForm.propTypes = {
  featureFlag: PropTypes.bool.isRequired,
};

export default ComponentRequestForm;
