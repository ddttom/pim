/**
 * Configuration for Natural Language Parser
 */
module.exports = {
  patterns: {
    action: /^(?<action>call|email|meet|review|text)/i,
    contact: /\b[A-Z][a-z]+\b/,
    timeExpression: /(?<modifier>next|this|last|end of|beginning of)\s+(?<unit>monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month|quarter|year|weekend)|(the\s+weekend)|(\w+)\s+of\s+the\s+(?<timeframe>month|year|quarter)/i,
    time: /\b(?<hours>\d{1,2})(?::(?<minutes>\d{2}))?\s*(?<meridian>am|pm)?\b/i,
    preposition: /\b(at|in|on|for|about)\b/i,
  },
  categories: {
    calls: /\b(call|phone|dial|text)\b/i,
    email: /\b(email|send|forward)\b/i,
    meetings: /\b(meet|meeting|appointment)\b/i,
    reviews: /\b(review|check|analyze)\b/i,
    shopping: /\b(buy|purchase|order)\b/i,
    finance: /\b(pay|bill|invoice)\b/i,
  },
  days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  dateModifiers: {
    next: 'next',
    last: 'last',
    endOf: 'end of',
    beginningOf: 'beginning of',
  },
  timeOfDay: {
    morning: { period: 'morning', start: 9, end: 12, hour: 9, minute: 0 },
    afternoon: { period: 'afternoon', start: 12, end: 17, hour: 14, minute: 0 },
    evening: { period: 'evening', start: 17, end: 21, hour: 17, minute: 0 },
    night: { period: 'night', start: 21, end: 24, hour: 21, minute: 0 },
  },
  defaultTimes: {
    meeting: 9,
    call: 10,
    review: 14,
    text: 10,
  },
  durationPatterns: {
    minutes: /(?<amount>\d+)\s*(?<unit>min|minute|minutes)/i,
    hours: /(?<amount>\d+)\s*(?<unit>h|hr|hour|hours)/i,
    duration: /(?:for|lasting|duration)\s+(?<amount>\d+)\s*(?<unit>min|minute|minutes|h|hr|hour|hours)/i,
  },
  recurringPatterns: {
    daily: /every\s+day/i,
    weekly: /every\s+(?<day>monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    monthly: /every\s+month/i,
    yearly: /every\s+year/i,
  },
  priorityPatterns: {
    high: /\b(urgent|asap|important)\b/i,
    medium: /\b(normal|moderate|regular)\b/i,
    low: /\b(whenever|low priority|not urgent)\b/i,
  },
  locationPatterns: {
    office: /\b(?:in\s+the\s+)?(?:office|workplace|building|floor)\s*(?:room\s+(?<room>[A-Z0-9-]+))?\b/i,
    online: /\b(?<platform>zoom|teams|meet|online|virtual|remote)\b(?:\s+(?:at|on|via)\s+)?(?<link>https?:\/\/[^\s,]+)?/i,
    travel: /\b(?:in|at|from)\s+(?<location>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Office|Building)\s+(?:Room\s+)?(?<room>[A-Z0-9-]+)/i,
    city: /\b(?:in|at|from)\s+(?<location>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/i,
  },
  subjectPatterns: {
    about: /(?:about|regarding|re:|subject:)\s+(?<subject>[^,\.#]+?)(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i,
    afterContact: /(?:with|to)\s+[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+)?\s+(?:about|regarding)\s+(?<subject>[^,\.#]+?)(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i,
    hashtag: /#(?<tag>\w+)/g,
  },
  reminderPatterns: {
    alert: /(?:remind|alert|notify)\s+(?:me)?\s+(?<time>\d+)\s*(?<unit>min|minute|minutes|hour|hours|day|days)\s+(?:before|prior)/gi,
    reminder: /(?:with|set)\s+(?<type>reminder|notification|alert)/i,
    multiple: /(?:remind|alert|notify)\s+(?:me)?\s+(?<time1>\d+)\s*(?<unit1>min|minute|minutes|hour|hours|day|days)\s+(?:before|prior)(?:\s+and\s+(?<time2>\d+)\s*(?<unit2>min|minute|minutes|hour|hours|day|days)\s+(?:before|prior))?/i,
  },
  defaultReminders: {
    meeting: 15,  // minutes before
    call: 5,      // minutes before
    review: 30,   // minutes before
    text: 5,      // minutes before
  },
  statusPatterns: {
    progress: /(?<progress>\d{1,3})%\s+(?:complete|done|finished)/i,
    status: /status:\s*(?<status>pending|in progress|completed|blocked|waiting)/i,
    blocked: /(?:blocked|waiting)\s+(?:by|on|for)\s+(?<blockers>(?:[^,\.]+(?:\s+and\s+|,\s*)?)+)/i,
    multipleBlockers: /(?:blocked|waiting)\s+(?:by|on|for)\s+(?<blocker1>[^,\.]+?)(?:\s+and\s+(?<blocker2>[^,\.]+?))?(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i,
  },
  attendeePatterns: {
    with: /(?:with|and)\s+(?<names>(?:[A-Z][a-z]+(?:\s*,\s*|\s+and\s+)?)+)/i,
    invite: /(?:invite|include)\s+(?<names>(?:[A-Z][a-z]+(?:\s*,\s*|\s+and\s+)?)+)/i,
  },
  teamPatterns: {
    team: /(?:team|group|department)\s+(?<team>[A-Za-z]+)/i,
  },
  projectPatterns: {
    project: /(?:project|for)\s+(?<project>[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    context: /\$(?<context>\w+)/g,
  },
  dependencyPatterns: {
    after: /(?:after|following|once)\s+(?<dependency>[^,\.]+)/i,
    before: /(?:before|prior to)\s+(?<dependency>[^,\.]+)/i,
    followup: /(?:follow(?:\s+up)?|check(?:\s+back)?)\s+(?:in|after)\s+(?<time>\d+)\s*(?<unit>day|week|month)s?/i,
  },
  priorityEmojis: {
    high: ['🔥', '⚡', '❗'],
    medium: ['⚠️', '⭐'],
    low: ['💤', '🌱'],
  },
  categoryEmojis: {
    calls: '📞',
    email: '📧',
    meetings: '👥',
    reviews: '👀',
    shopping: '🛒',
    finance: '💰',
  },
  statusEmojis: {
    pending: '⏳',
    'in progress': '🚀',
    completed: '✅',
    blocked: '🚫',
    waiting: '⌛',
  },
  urgencyPatterns: {
    immediate: /\b(?:now|immediately|asap|right\s+away)\b/i,
    today: /\b(?:today|by\s+end\s+of\s+day|eod)\b/i,
    soon: /\b(?:soon|shortly|this\s+week)\b/i,
  },
  urgencyEmojis: {
    immediate: '⚡',
    today: '🔥',
    soon: '⏰',
  },
  complexityPatterns: {
    high: /\b(?:complex|complicated|difficult)\b/i,
    medium: /\b(?:moderate|standard|normal)\b/i,
    low: /\b(?:simple|easy|quick)\b/i,
  },
  complexityEmojis: {
    high: '🧩',
    medium: '⚙️',
    low: '🎯',
  },
}; 