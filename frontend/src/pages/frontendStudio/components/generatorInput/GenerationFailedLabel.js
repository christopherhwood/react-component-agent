import PropTypes from 'prop-types';
import { GenerationStatus } from '../../../../redux/slices/userTaskInputSlice';

const GenerationFailedLabel = ({generationStatus, generatorError, errorAlertRef, error, startUserTaskGeneration}) => {
  return (
    <>
      <div
        ref={errorAlertRef}
        id="generationError"
        role="alert"
        className="text-red-500 mt-4 flex items-center justify-center"
        tabIndex="-1"
        aria-live="polite"
      >
        {generatorError || error}
      </div>
      {generationStatus === GenerationStatus.FAILED && (
        <button
          type="button"
          className="mt-2 px-4 py-2 rounded text-white font-semibold bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-500"
          onClick={startUserTaskGeneration}
        >
          Restart Generation
        </button>
      )}
    </>
  );
};

GenerationFailedLabel.propTypes = {
  generationStatus: PropTypes.oneOf(Object.values(GenerationStatus)).isRequired,
  generatorError: PropTypes.string.isRequired,
  error: PropTypes.bool.isRequired,
  startUserTaskGeneration: PropTypes.func.isRequired,
}

const GenerationSuccessLabel = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-green-500 mt-2 px-4 py-2 rounded bg-gray-800"
    >
      Component generation successful!
    </div>
  );
};

const GenerationOutputLabel = ({showSuccess, generationFailed, generationStatus, generatorError, errorAlertRef, error, startUserTaskGeneration}) => {
  return (
    <>
      {showSuccess && (
        <GenerationSuccessLabel/>
      )}
      {(generationFailed || generationStatus === GenerationStatus.FAILED) && (
        <GenerationFailedLabel
          generationStatus={generationStatus}
          generatorError={generatorError}
          errorAlertRef={errorAlertRef}
          error={error}
          startUserTaskGeneration={startUserTaskGeneration}
        />
      )}
    </>
  );
};

export default GenerationOutputLabel;

