import React, { useContext, createContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deleteUpdate, updateUpdate, selectUpdate } from '../../../../redux/slices/userTasksSlice';
import Accordion from '../../../../components/Accordion';
import { pauseGeneration, resumeGeneration } from '../../../../redux/slices/userTaskInputSlice';
import { getSelectedStatusUpdate, getSelectedTask, getUpdates } from '../../../../redux/selectors';
import { enqueueUpdate } from '../../../../redux/slices/userTasksSlice';

const TaskContext = createContext();

function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

function TaskProvider({ children }) {
  const selectedUpdate = useSelector(getSelectedStatusUpdate);
  const subtasks = useSelector(getUpdates);
  const updates = subtasks || [];
  const isLoading = useSelector((state) => state.userTasks.isAddingNewTask);
  const dispatch = useDispatch();

  const deleteTask = (task) => {
    if (task.status === 'FAILED' && updates.filter(u => u.status === 'FAILED').length === 1) {
      dispatch(pauseGeneration());
    }
    dispatch(deleteUpdate(task));
  };

  const updateTaskStatus = (id, newStatus) => {
    let update = updates.find((update) => update.id === id);
    if (update) {
      dispatch(updateUpdate({ ...update, previousStatus: update.status, status: newStatus }));
    }
  };

  const onSelectTask = (task) => {
    if (task.status === 'SUCCESS') {
      dispatch(selectUpdate(task));
    }
  }

  return (
    <TaskContext.Provider value={{ tasks: updates,  deleteTask, updateTaskStatus, isLoading, selectedTask: selectedUpdate, onSelectTask }}>
      {children}
    </TaskContext.Provider>
  );
}

function TaskSidebar() {
  const { tasks, isLoading, onSelectTask, selectedTask } = useTasks();

  return (
    <div className='flex-1 p-4'>
      {isLoading ? (
            <div
              className="flex flex-col justify-center items-center"
              role="status"
            >
              <svg
                className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-lg font-medium text-white">Loading...</p>
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} deletable={task.status === 'PENDING' || task.status === 'FAILED'} onSelect={(task) => onSelectTask(task)} isSelected={selectedTask?.id === task.id} />
            ))
          ) : (<div
          className="flex justify-center items-center py-4"
          aria-live="polite"
        >
          <p className="text-gray-400 font-semibold flex items-center">
            <i className="fas fa-tasks-slash mr-2" aria-label="No subasks" />
            No subtasks created yet - start generating!
          </p>
        </div>
  )};
    </div>
  );
}

function TaskCard({ task, index, deletable, onSelect, isSelected }) {
  const { deleteTask, updateTaskStatus } = useTasks();
  const handleClick = () => {
    onSelect(task);
  };

  // StatusIndicator and TaskActions components have been moved outside of TaskCard for better reusability and maintainability.

  function StatusIndicator({ status }) {
    const statusInfo = statusTextColor(status);
    return (
      <div className={`flex items-center text-sm ${statusInfo.bgClass} ${statusInfo.textClass} p-1 rounded`} aria-label={`Status: ${status}`} role="status">
        {statusInfo.icon}<span>{status}</span>
      </div>
    );
  }

  function RetryButton({ onRetry }) {
    const [isRetrying, setIsRetrying] = useState(false);
  
    const handleClick = () => {
      setIsRetrying(true);
      onRetry();
    };
  
    return (
      <button
        onClick={handleClick}
        disabled={isRetrying}
        aria-disabled={isRetrying}
        aria-busy={isRetrying}
        aria-live="polite"
        className={`ml-2 px-3 py-2 ${isRetrying ? "text-blue-300" : "text-blue-500 hover:text-blue-300"} bg-blue-900 rounded transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        tabIndex={isRetrying ? -1 : 0}
      >
        {isRetrying ? "Retrying..." : "Retry"}
      </button>
    );
  }
  
  RetryButton.propTypes = {
    onRetry: PropTypes.func.isRequired,
  };

  TaskActions.propTypes = {
    task: PropTypes.object.isRequired,
    deletable: PropTypes.bool.isRequired,
    deleteTask: PropTypes.func.isRequired,
    updateTaskStatus: PropTypes.func.isRequired,
  }
  
  function TaskActions({ task, deletable, deleteTask }) {
    const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
    const dialogRef = React.useRef(null);
    const dispatch = useDispatch();
  
    React.useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
          setShowConfirmDialog(false);
        }
      };
  
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
  
    React.useEffect(() => {
      if (showConfirmDialog) {
        dialogRef.current?.focus();
      }
    }, [showConfirmDialog]);
  
    const handleDelete = (event) => {
      event.stopPropagation();
      setShowConfirmDialog(true);
    };
  
    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        event.stopPropagation();
        setShowConfirmDialog(false);
      }
    };

    const handleRetry = () => {
      dispatch(enqueueUpdate(task));
      dispatch(resumeGeneration());
    };
  
    return (
      <div className='flex space-x-2'>
        {deletable && (
          <button aria-label='Delete task' className='px-3 py-2 text-red-500 hover:text-red-300 hover:bg-red-900 rounded transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50' onClick={(event) => handleDelete(event)}>Delete</button>
        )}
        {task.status === "FAILED" && <RetryButton onRetry={handleRetry} />}
        {showConfirmDialog && ReactDOM.createPortal(
          <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center' onMouseDown={handleClickOutside}>
            <div className='bg-gray-950 bg-opacity-100 p-12 border-2 border-gray-300 rounded-lg shadow-lg' ref={dialogRef} tabIndex='-1' role='dialog' aria-modal='true' aria-labelledby='dialogTitle' style={{zIndex: 1000}}>
              <h2 id='dialogTitle' className="text-2xl mt-2 mb-4 font-bold text-gray-100">Are you sure you want to delete this task?</h2>
              <div className='flex justify-end space-x-2 mt-4 mx-auto'>
                <button className='px-4 py-2 rounded text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50' onClick={() => setShowConfirmDialog(false)}>Cancel</button>
                <button className='px-4 py-2 rounded text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50' onClick={() => { deleteTask(task); setShowConfirmDialog(false); }}>Confirm Delete</button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div 
      className={`bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-lg p-2 m-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isSelected ? "border-4 border-blue-500 bg-gray-700 hover:bg-gray-600" : ""}`}
      tabIndex="0"
      aria-selected={isSelected ? "true" : "false"}
      onClick={handleClick}
    >
      <div className='flex justify-between items-center'>
        <div className='w-full'>
          <h3 className='text-m font-regular text-gray-300'>{task.title}</h3>
          <div className='inline-block min-w-min w-1/2' style={{paddingRight: '4px'}}>
            <StatusIndicator status={task.status} />
          </div>
        </div>
        <TaskActions task={task} deletable={deletable} deleteTask={deleteTask} updateTaskStatus={updateTaskStatus} />
      </div>
    </div>
  );
}

const statusTextColor = (status) => {
  switch (status) {
    case 'SUCCESS':
      return { bgClass: 'bg-green-900', textClass: 'text-green-200', icon: <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> };
    case 'IN PROGRESS':
      return { bgClass: 'bg-yellow-900', textClass: 'text-yellow-200', icon: <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> };
    case 'PAUSED':
      return { bgClass: 'bg-blue-900', textClass: 'text-blue-200', icon: <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0-4H8" /></svg> }
    case 'UNDONE':
      return { bgClass: 'bg-purple-900', textClass: 'text-purple-200', icon: <svg className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> };
    case 'FAILED':
      return { bgClass: 'bg-red-900', textClass: 'text-red-200', icon: <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
    case 'PENDING':
      return { bgClass: 'bg-gray-900', textClass: 'text-gray-200', icon: <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> };
    default:
      return { bgClass: 'bg-gray-900', textClass: 'text-gray-200', icon: null };
  }
};

function AutoOpeningStatusBarAccordion({setOpen, isOpen}) {
  const { tasks } = useTasks();
  const [autoOpenedUserTaskId, setAutoOpenedUserTaskId] = React.useState(null);

  useEffect(() => {
    if (tasks.length > 0 && !autoOpenedUserTaskId) {
      setOpen(true);
      setAutoOpenedUserTaskId(tasks[0].userTaskId);
    }
  }, [autoOpenedUserTaskId, tasks, setOpen]);

  useEffect(() => {
    if (tasks.length === 0) {
      setAutoOpenedUserTaskId(null);
    }
  }, [tasks, setOpen]);

  return (
    <div className='flex w-full'>
      <div className='flex w-full flex-col'>
        <Accordion header='Current Component Tasks' setOpen={setOpen} isOpen={isOpen}>
          <TaskSidebar />
        </Accordion>
      </div>
    </div>
  );
}

/**
 * @returns {JSX.Element} The JSX element for the status update bar
 */
export default function StatusUpdateBar({setOpen, isOpen}) {
  return (
    <>
      <TaskProvider>
        <AutoOpeningStatusBarAccordion setOpen={setOpen} isOpen={isOpen} />
      </TaskProvider>
    </>
  );
}
