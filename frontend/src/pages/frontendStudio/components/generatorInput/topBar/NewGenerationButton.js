import PropTypes from 'prop-types';

const NewGenerationButton = ({ handleNewGeneration }) => {
  return (
    <div className="tooltip" title= "Start a new component" aria-label="Start a new component">
      <button
        type="button"
        aria-label="Start New Component"
        className="p-2 rounded focus:ring-2 focus:ring-blue-500 flex items-center justify-around"
        onClick={handleNewGeneration}
      >
        <img src="/create-new.svg" alt="New Generation" className="h-[40px] w-[40px]" /> 
        New Component
      </button>
    </div>
  );
};

NewGenerationButton.propTypes = {
  handleNewGeneration: PropTypes.func.isRequired,
};

export default NewGenerationButton;

