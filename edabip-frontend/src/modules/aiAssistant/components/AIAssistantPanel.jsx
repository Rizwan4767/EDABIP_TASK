import { useEffect, useRef } from 'react';
import { useAIAssistant } from '../context/AIAssistantContext.jsx';
import {
  getGreetingForPage,
  getSuggestionsForPage,
} from '../utils/getMockAIResponse.js';
import AIMessage from './AIMessage.jsx';
import AISuggestions from './AISuggestions.jsx';
import AITypingIndicator from './AITypingIndicator.jsx';
import AiChatbot from '../../../assets/dashboard/Sidebar/ai-chatbot.svg';

function AIAssistantPanel() {
  const {
    isOpen,
    isTyping,
    messages,
    inputValue,
    setInputValue,
    pageContext,
    shouldFocusInput,
    closeAssistant,
    clearConversation,
    sendMessage,
    consumeFocusRequest,
  } = useAIAssistant();

  const panelRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const greeting = getGreetingForPage(pageContext);
  const suggestions = getSuggestionsForPage(pageContext);
  const canSend = Boolean(inputValue.trim()) && !isTyping;

  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAssistant();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeAssistant]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen && shouldFocusInput && inputRef.current) {
      inputRef.current.focus();
      consumeFocusRequest();
    }
  }, [isOpen, shouldFocusInput, consumeFocusRequest]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;
    sendMessage(inputValue);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) sendMessage(inputValue);
    }
  };

  if (!isOpen) return null;

  return (
    <section
      id="ai-assistant-panel"
      ref={panelRef}
      className="ai-panel"
      role="dialog"
      aria-modal="false"
      aria-label="AI Assistant"
    >
      <header className="ai-panel__header">
        <div className="ai-panel__brand">
          <img src={AiChatbot} alt="" className="ai-panel__logo" width="40" height="36" />
          <div className="ai-panel__titles">
            <h2 className="ai-panel__title">AI Assistant</h2>
            <p className="ai-panel__subtitle">Ask about your dashboard</p>
          </div>
        </div>

        <div className="ai-panel__actions">
          <button
            type="button"
            className="ai-panel__action"
            onClick={clearConversation}
            aria-label="Start a new chat"
            title="New chat"
          >
            New chat
          </button>
          <button
            type="button"
            className="ai-panel__close"
            onClick={closeAssistant}
            aria-label="Close AI Assistant"
          >
            ×
          </button>
        </div>
      </header>

      <div className="ai-panel__body" ref={listRef} role="log" aria-live="polite">
        <div className="ai-panel__greeting">
          <p>{greeting}</p>
        </div>

        {messages.length === 0 ? (
          <AISuggestions
            suggestions={suggestions}
            onSelect={sendMessage}
            disabled={isTyping}
          />
        ) : null}

        <div className="ai-panel__messages" role="list">
          {messages.map((message) => (
            <AIMessage key={message.id} message={message} />
          ))}
          {isTyping ? <AITypingIndicator /> : null}
        </div>

        {messages.length > 0 ? (
          <AISuggestions
            suggestions={suggestions.slice(0, 3)}
            onSelect={sendMessage}
            disabled={isTyping}
          />
        ) : null}
      </div>

      <form className="ai-panel__composer" onSubmit={handleSubmit}>
        <label className="ai-sr-only" htmlFor="ai-assistant-input">
          Ask the AI assistant
        </label>
        <textarea
          id="ai-assistant-input"
          ref={inputRef}
          className="ai-panel__input"
          rows={1}
          placeholder="Ask anything about your dashboard..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="ai-panel__send"
          disabled={!canSend}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3.4 20.4L21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8z"
              fill="currentColor"
            />
          </svg>
        </button>
      </form>
    </section>
  );
}

export default AIAssistantPanel;
