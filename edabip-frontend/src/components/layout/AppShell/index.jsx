import {
  AIAssistantProvider,
  AIAssistantLauncher,
  AIAssistantPanel,
} from '../../../modules/aiAssistant/index.js';
import '../../../modules/aiAssistant/styles/ai-assistant.css';

/**
 * Shared shell for authenticated screens.
 * Mounts the reusable mock AI Assistant once for all protected routes.
 */
function AppShell({ children }) {
  return (
    <AIAssistantProvider>
      {children}
      <AIAssistantLauncher />
      <AIAssistantPanel />
    </AIAssistantProvider>
  );
}

export default AppShell;
