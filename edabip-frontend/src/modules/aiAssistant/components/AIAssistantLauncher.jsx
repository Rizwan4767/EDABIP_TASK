import { useAIAssistant } from '../context/AIAssistantContext.jsx';
import FabMark from '../../../assets/dashboard/powerbi/fab-mark.svg';

function AIAssistantLauncher() {
  const { isOpen, toggleAssistant } = useAIAssistant();

  return (
    <button
      type="button"
      className={`ai-launcher${isOpen ? ' ai-launcher--active' : ''}`}
      onClick={toggleAssistant}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      aria-expanded={isOpen}
      aria-controls="ai-assistant-panel"
    >
      <img src={FabMark} alt="" width="32" height="32" />
    </button>
  );
}

export default AIAssistantLauncher;
