import {
  FALLBACK_RESPONSE,
  MOCK_RESPONSES,
  PAGE_GREETINGS,
  PAGE_SUGGESTIONS,
  DEFAULT_SUGGESTIONS,
} from '../data/mockAIResponses.js';

const ROUTE_CONTEXT_MAP = [
  { match: /^\/(landing-page)?\/?$/, context: 'landing' },
  { match: /^\/dashboard/, context: 'dashboard' },
  { match: /^\/powerbi/, context: 'power-bi' },
  { match: /^\/tableau/, context: 'tableau' },
  { match: /^\/analytics/, context: 'analytics' },
  { match: /^\/report/, context: 'report' },
  { match: /^\/billing/, context: 'billing' },
  { match: /^\/users/, context: 'users' },
  { match: /^\/settings/, context: 'settings' },
];

export function getPageContextFromPath(pathname = '') {
  const found = ROUTE_CONTEXT_MAP.find(({ match }) => match.test(pathname));
  return found?.context || 'dashboard';
}

export function getGreetingForPage(pageContext) {
  return PAGE_GREETINGS[pageContext] || PAGE_GREETINGS.default;
}

export function getSuggestionsForPage(pageContext) {
  return PAGE_SUGGESTIONS[pageContext] || DEFAULT_SUGGESTIONS;
}

/**
 * Returns a mock AI reply for the given user message.
 * Optional pageContext can lightly tailor the fallback.
 */
export function getMockAIResponse(message, pageContext = 'dashboard') {
  const normalized = String(message || '').trim().toLowerCase();

  if (!normalized) {
    return FALLBACK_RESPONSE;
  }

  for (const entry of MOCK_RESPONSES) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.response;
    }
  }

  if (pageContext === 'power-bi') {
    return `${FALLBACK_RESPONSE} You are currently on the Power BI screen.`;
  }

  if (pageContext && pageContext !== 'dashboard') {
    return `${FALLBACK_RESPONSE} You are currently viewing the ${pageContext.replace(/-/g, ' ')} screen.`;
  }

  return FALLBACK_RESPONSE;
}

export function getMockResponseDelay() {
  return 700 + Math.floor(Math.random() * 500);
}
