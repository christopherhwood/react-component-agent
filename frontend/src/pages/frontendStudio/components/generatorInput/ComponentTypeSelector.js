import PropTypes from 'prop-types';
import { GenerationStatus } from '../../../../redux/slices/userTaskInputSlice';

const ComponentTypeSelector = ({componentTypeSelectRef, generationStatus, error, selectedComponent, handleComponentChange, customComponentFeatureFlag}) => {
  
  return (
    <div className="flex flex-col items-center p-4 text-gray-100">
      <label htmlFor="componentSelect" className="mb-2">
        Select a Component
      </label>
      <select
        id="componentSelect"
        ref={componentTypeSelectRef}
        value={selectedComponent}
        onChange={handleComponentChange}
        className={`mb-4 p-2 ${generationStatus !== GenerationStatus.PENDING ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50" : "bg-gray-800 text-gray-300 border-2"} ${error && !selectedComponent ? "border-red-500" : "border-gray-700"} rounded focus:outline-none focus:ring-2 focus:ring-green-500`}
        aria-describedby={
          error && !selectedComponent ? "generationError" : undefined
        }
        required
        disabled={generationStatus !== GenerationStatus.PENDING}
        aria-disabled={generationStatus !== GenerationStatus.PENDING}
      >
        <option value="" disabled>
          Select one...
        </option>
        <option value="carousel">Carousel</option>
        <option value="list">List</option>
        <option value="rich text editor">Rich Text Editor</option>
        <option value="form">Form</option>
        {customComponentFeatureFlag && <option value="custom">Custom</option>}
      </select>
    </div>
  );
};

ComponentTypeSelector.propTypes = {
  componentTypeSelectRef: PropTypes.object.isRequired,
  generationStatus: PropTypes.oneOf(Object.values(GenerationStatus)).isRequired,
  error: PropTypes.bool.isRequired,
  selectedComponent: PropTypes.string.isRequired,
  handleComponentChange: PropTypes.func.isRequired,
  customComponentFeatureFlag: PropTypes.bool.isRequired,
};

export default ComponentTypeSelector;

