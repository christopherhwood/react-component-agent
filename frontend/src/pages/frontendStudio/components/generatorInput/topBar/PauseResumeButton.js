import PropTypes from 'prop-types';
import { GenerationStatus } from '../../../../../redux/slices/userTaskInputSlice';

const PauseResumeButton = ({ handlePauseResume, generationStatus, disabled }) => {
  return (
    <div className="tooltip" aria-label={generationStatus === GenerationStatus.RUNNING ? "Pause Generation" : "Resume Generation"}>
      <button
        type="button"
        disabled={disabled}
        aria-label={generationStatus === GenerationStatus.RUNNING ? "Pause Generation" : "Resume Generation"}
        className={`p-2 rounded focus:ring-2 flex items-center justify-center ${disabled ? "opacity-50" : ""}`}
        onClick={handlePauseResume}
      >
        {generationStatus === GenerationStatus.RUNNING ? (
          <img src="/pause.svg" alt="Pause" className="h-[40px] w-[40px]" />
        ) : (
          <img src="/play.svg" alt="Resume" className="h-[40px] w-[40px]" />
        )}
      </button>
    </div>
  );
};

PauseResumeButton.propTypes = {
  handlePauseResume: PropTypes.func.isRequired,
  generationStatus: PropTypes.oneOf(Object.values(GenerationStatus)).isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default PauseResumeButton;

