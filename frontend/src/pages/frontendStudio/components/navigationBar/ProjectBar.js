import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Accordion from '../../../../components/Accordion';
import { loadUserTasks } from '../../../../redux/slices/userTasksSlice';

function UserTaskCard({ task, onSelect, isSelected }) {
  const handleClick = () => {
    onSelect(task);
  };

  return (
    <div
      className={`bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-lg p-4 m-2 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isSelected ? "border-4 border-blue-500 bg-gray-700 hover:bg-gray-600" : ""}`}
      tabIndex="0"
      aria-selected={isSelected ? "true" : "false"}
      onClick={handleClick}
    >
      <p className="text-gray-300">
        Title: {task.title || 'New Component'}
      </p>
      <p className="text-gray-300">Category: {task.category.charAt(0).toUpperCase() + task.category.slice(1)}</p>
      <p className="text-gray-300">Created: {new Date(task.created).toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}</p>
    </div>
  );
}


export default function ProjectBar({
  setOpen,
  isOpen,
  onSelectTask,
}) {
  const {isLoadingList, isAddingNewTask, userTasks: tasks, selectedTaskIndex, error} = useSelector((state) => state.userTasks);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadUserTasks());
  }, [dispatch]);
  const isLoading = isLoadingList || isAddingNewTask;
  return (
    <div className="flex w-full flex-col">
      <Accordion header="Component History" setOpen={setOpen} isOpen={isOpen}>
        <div className="p-4 text-gray-300">
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
          ) : error ? (
            <div role="alert" className="text-red-500 font-semibold">
              {error.includes("network") ? (
                <p className="flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>Network
                  error: Please check your internet connection.
                </p>
              ) : error.includes("fetch") ? (
                <p className="flex items-center">
                  <i className="fas fa-cloud-download-alt mr-2"></i>Data
                  fetching error: Unable to retrieve tasks.
                </p>
              ) : (
                <p className="flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>Unexpected
                  error: {error}
                </p>
              )}
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <UserTaskCard
                key={task.id}
                task={task}
                onSelect={(task) => onSelectTask(task)}
                isSelected={tasks[selectedTaskIndex]?.id === task.id}
              />
            ))
          ) : (
            <div
              className="flex justify-center items-center py-4"
              aria-live="polite"
            >
              <p className="text-gray-400 font-semibold flex items-center">
                <i className="fas fa-tasks-slash mr-2" aria-label="No tasks" />
                You haven't created any components yet!
              </p>
            </div>
          )}
        </div>
      </Accordion>
    </div>
  );
}

ProjectBar.propTypes = {
  setOpen: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onSelectTask: PropTypes.func.isRequired,
};

// export default function ProjectBar({ setOpen, isOpen }) {
//   return (
//     <div className='flex w-full flex-col'>
//       <Accordion header='Component History' setOpen={setOpen} isOpen={isOpen}>
//         <div className='p-4 text-gray-300'>
//           <p>Component history will be displayed here.</p>
//         </div>
//       </Accordion>
//     </div>
//   )
// }
