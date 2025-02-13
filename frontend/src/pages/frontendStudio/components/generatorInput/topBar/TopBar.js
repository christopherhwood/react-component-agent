import PropTypes from 'prop-types';
import NewGenerationButton from './NewGenerationButton';
import PauseResumeButton from './PauseResumeButton';
import { GenerationStatus } from '../../../../../redux/slices/userTaskInputSlice';

const TopBar = ({handleNewGeneration, handlePauseResume, generationStatus, pauseResumeButtonEnabled}) => {
  return (
    <div className="flex justify-between w-full items-center">
      <NewGenerationButton handleNewGeneration={handleNewGeneration}/>
      <PauseResumeButton 
        handlePauseResume={handlePauseResume} 
        generationStatus={generationStatus} 
        disabled={!pauseResumeButtonEnabled}
      />
    </div>
  )
}

TopBar.propTypes = {
  handleNewGeneration: PropTypes.func.isRequired,
  handlePauseResume: PropTypes.func.isRequired,
  generationStatus: PropTypes.oneOf(Object.values(GenerationStatus)).isRequired,
  pauseResumeButtonEnabled: PropTypes.bool.isRequired,
}

export default TopBar;