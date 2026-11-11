export const DEFAULT_SUGGESTIONS = [
  'Summarize this dashboard',
  'What are the key insights?',
  "Show today's performance",
  'Compare this week with last week',
  'Which metric needs attention?',
];

export const PAGE_SUGGESTIONS = {
  landing: [
    'What is EDABIP?',
    'What can this platform do?',
    'How do I request a demo?',
    'How do I get started?',
  ],
  dashboard: [
    'Summarize this dashboard',
    'What are the key insights?',
    "Show today's performance",
    'Compare this week with last week',
    'Which metric needs attention?',
  ],
  'power-bi': [
    'Summarize Power BI reports',
    'What are the key insights?',
    'Show sales analytics',
    'Which report needs attention?',
    'Help with Power BI',
  ],
  tableau: [
    'Summarize Tableau views',
    'What are the key insights?',
    "Show today's performance",
    'Which metric needs attention?',
    'Help with Tableau',
  ],
  analytics: [
    'Summarize analytics',
    'What are the key insights?',
    "Show today's performance",
    'Compare this week with last week',
    'Which metric needs attention?',
  ],
  report: [
    'Summarize reports',
    'What are the key insights?',
    "Show today's performance",
    'Which report needs attention?',
    'Help with reports',
  ],
  billing: [
    'Summarize billing',
    'What are the key insights?',
    "Show today's performance",
    'Help with billing',
  ],
  users: [
    'Summarize user activity',
    'What are the key insights?',
    'Help with users',
  ],
  settings: [
    'Help with settings',
    'What can you do?',
  ],
};

export const MOCK_RESPONSES = [
  {
    keywords: ['summary', 'summarize', 'overview'],
    response:
      'Overall performance looks stable. Sales and customer activity remain healthy, while a few operational metrics may need closer attention.',
  },
  {
    keywords: ['sales', 'revenue'],
    response:
      'Sales performance is trending positively in the current mock dataset. Revenue is up compared with the previous reporting period.',
  },
  {
    keywords: ['customer', 'customers'],
    response:
      'Customer activity remains steady, with engagement showing a positive trend across the available mock metrics.',
  },
  {
    keywords: ['performance', 'insight', 'insights', 'metric', 'attention'],
    response:
      'The dashboard indicates generally healthy performance across sales, finance, and customer analytics.',
  },
  {
    keywords: ['power bi', 'powerbi', 'report'],
    response:
      'Power BI reports are available for deeper analysis of your connected business metrics.',
  },
  {
    keywords: ['compare', 'week', 'last week'],
    response:
      'In this mock view, this week is tracking slightly ahead of last week on sales and engagement, with operations holding steady.',
  },
  {
    keywords: ['today', "today's"],
    response:
      "Today's mock performance looks healthy overall, with no major alerts across the primary dashboard metrics.",
  },
  {
    keywords: ['help', 'what can you', 'what do you'],
    response:
      'I can help with mock answers about sales, revenue, customers, performance, Power BI reports, and dashboard summaries. Try one of the suggested prompts above.',
  },
];

export const FALLBACK_RESPONSE =
  "I'm currently running with mock dashboard data, but you can ask me about sales, revenue, customers, performance, reports, or dashboard summaries.";

export const PAGE_GREETINGS = {
  landing: "Hi! I'm the EDABIP assistant. Ask me anything about the platform.",
  dashboard: 'Hi! How can I help you understand your dashboard today?',
  'power-bi': 'Hi! Ask me anything about your Power BI reports and metrics.',
  tableau: 'Hi! How can I help you with Tableau insights today?',
  analytics: 'Hi! How can I help you explore your analytics today?',
  report: 'Hi! How can I help you with your reports today?',
  billing: 'Hi! How can I help with billing and usage today?',
  users: 'Hi! How can I help with user management today?',
  settings: 'Hi! How can I help with settings today?',
  default: 'Hi! How can I help you understand your dashboard today?',
};
