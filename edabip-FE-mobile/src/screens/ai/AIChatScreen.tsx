import { ModulePlaceholder } from '@/screens/components/ModulePlaceholder';

/**
 * EDABIP AI assistant.
 *
 * Only the placement is reserved for now. When the conversation UI is built,
 * add `components/` (message bubbles, suggestion chips, composer) and `hooks/`
 * (`useConversation`) alongside this file, and keep every network call behind
 * `services/api/aiApi.ts` so the mock and real engines stay interchangeable.
 */
export function AIChatScreen() {
  return (
    <ModulePlaceholder
      title="EDABIP AI"
      icon="sparkles-outline"
      description="Ask questions about your data in natural language. The assistant is not connected yet."
      showBack
    />
  );
}
