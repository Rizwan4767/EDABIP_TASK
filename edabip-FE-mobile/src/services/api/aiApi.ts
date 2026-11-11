import { notImplemented } from '@/services/api/notImplemented';

/**
 * EDABIP AI assistant.
 *
 * The web app currently runs the assistant against a mock response engine, and
 * the backend exposes no chat route. Keeping this behind a service boundary
 * means the screen can be swapped onto the real API without UI changes.
 * Gated by `appConfig.features.aiAssistant`.
 */
export const aiApi = {
  sendMessage: () => notImplemented('aiApi.sendMessage'),
  getConversation: () => notImplemented('aiApi.getConversation'),
};
