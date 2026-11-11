import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  getMockAIResponse,
  getMockResponseDelay,
  getPageContextFromPath,
} from '../utils/getMockAIResponse.js';

const AIAssistantContext = createContext(null);

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

export function AIAssistantProvider({ children }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [shouldFocusInput, setShouldFocusInput] = useState(false);
  const responseTimerRef = useRef(null);

  const pageContext = useMemo(
    () => getPageContextFromPath(location.pathname),
    [location.pathname]
  );

  const clearPendingResponse = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPendingResponse(), [clearPendingResponse]);

  const openAssistant = useCallback(() => {
    setIsOpen(true);
    setShouldFocusInput(true);
  }, []);

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setShouldFocusInput(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      setShouldFocusInput(next);
      return next;
    });
  }, []);

  const clearConversation = useCallback(() => {
    clearPendingResponse();
    setMessages([]);
    setIsTyping(false);
    setInputValue('');
  }, [clearPendingResponse]);

  const sendMessage = useCallback(
    (rawText) => {
      const text = String(rawText || '').trim();
      if (!text || isTyping) return;

      const userMessage = createMessage('user', text);
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);
      setIsOpen(true);

      clearPendingResponse();
      const delay = getMockResponseDelay();
      const contextAtSend = pageContext;

      responseTimerRef.current = setTimeout(() => {
        const reply = getMockAIResponse(text, contextAtSend);
        setMessages((prev) => [...prev, createMessage('assistant', reply)]);
        setIsTyping(false);
        responseTimerRef.current = null;
      }, delay);
    },
    [clearPendingResponse, isTyping, pageContext]
  );

  const consumeFocusRequest = useCallback(() => {
    setShouldFocusInput(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      isTyping,
      messages,
      inputValue,
      setInputValue,
      pageContext,
      shouldFocusInput,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      clearConversation,
      sendMessage,
      consumeFocusRequest,
    }),
    [
      isOpen,
      isTyping,
      messages,
      inputValue,
      pageContext,
      shouldFocusInput,
      openAssistant,
      closeAssistant,
      toggleAssistant,
      clearConversation,
      sendMessage,
      consumeFocusRequest,
    ]
  );

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return ctx;
}
