import PropTypes from 'prop-types';
import { GenerationStatus } from '../../../../redux/slices/userTaskInputSlice';

const ProgressBar = ({generationStatus, generationFailed, progress, progressBarRef}) => {
  return (
    <>
     <p>{generationStatus === GenerationStatus.RUNNING ? "Generating your component now..." : "Generation has been paused."}</p>
       <div className="relative w-full h-1.5 rounded-full bg-gray-700">
         <div
           ref={progressBarRef}
           role="progressbar"
           aria-valuenow={progress}
           aria-valuemin="0"
           aria-valuemax="100"
           aria-valuetext={`${progress}% complete`}
           style={{ width: `${progress}%` }}
           className={`absolute left-0 top-0 h-1.5 rounded-full transition-all ease-linear ${generationFailed ? "bg-red-500" : "bg-green-500"}`}
           tabIndex="-1"
           aria-live="polite"
         ></div>
       </div>
    </>
  );
};

ProgressBar.propTypes = {
  generationStatus: PropTypes.oneOf(Object.values(GenerationStatus)).isRequired,
  generationFailed: PropTypes.bool.isRequired,
  progress: PropTypes.number.isRequired,
  progressBarRef: PropTypes.object.isRequired,
}

export default ProgressBar;
