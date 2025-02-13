import PropTypes from 'prop-types';
import { GenerationStatus } from '../../../../redux/slices/userTaskInputSlice';

const DetailInputField = ({generationStatus, selectedComponent, detailInputRef, detail, handleDetailChange, error}) => {
  return (
    <>
      <label htmlFor="detailInput" className="mb-2">
        Additional Details (Optional)
      </label>
      <textarea
        id="detailInput"
        ref={detailInputRef}
        value={detail}
        onChange={handleDetailChange}
        placeholder="Additional details about the component..."
        className={`w-full max-w-md p-2 ${generationStatus !== GenerationStatus.PENDING ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50" : "border-2 bg-gray-800 text-gray-300"} ${error && selectedComponent === "custom" && !detail.trim() ? "border-red-500" : "border-gray-700"} rounded focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-gray-700 resize-y`}
        aria-describedby={
          error && selectedComponent === "custom" && !detail.trim()
            ? "generationError"
            : undefined
        }
        rows={4}
        style={{ overflowY: "auto" }}
        required={selectedComponent === "custom"}
        disabled={generationStatus !== GenerationStatus.PENDING}
        aria-disabled={generationStatus !== GenerationStatus.PENDING}
      />
    </>
    
  );
};

DetailInputField.propTypes = {
  generationStatus: PropTypes.oneOf(Object.values(GenerationStatus)).isRequired,
  selectedComponent: PropTypes.string.isRequired,
  detailInputRef: PropTypes.object.isRequired,
  detail: PropTypes.string.isRequired,
  handleDetailChange: PropTypes.func.isRequired,
  error: PropTypes.bool.isRequired,
};

export default DetailInputField;