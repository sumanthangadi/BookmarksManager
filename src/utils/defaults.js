import { generateId } from './constants';

export const DEFAULT_SECTIONS = [
  {
    id: 'sec_work',
    name: 'Work',
    icon: 'Briefcase',
    order: 0,
  },
  {
    id: 'sec_study',
    name: 'Study',
    icon: 'GraduationCap',
    order: 1,
  },
  {
    id: 'sec_ai',
    name: 'AI Tools',
    icon: 'Brain',
    order: 2,
  },
  {
    id: 'sec_social',
    name: 'Social',
    icon: 'Users',
    order: 3,
  },
  {
    id: 'sec_entertainment',
    name: 'Entertainment',
    icon: 'Gamepad2',
    order: 4,
  },
  {
    id: 'sec_news',
    name: 'News',
    icon: 'Newspaper',
    order: 5,
  },
];

export const DEFAULT_BOOKMARKS = [
  // Work
  { id: generateId(), title: 'Gmail', url: 'https://mail.google.com', sectionId: 'sec_work' },
  { id: generateId(), title: 'Google Drive', url: 'https://drive.google.com', sectionId: 'sec_work' },
  { id: generateId(), title: 'Notion', url: 'https://notion.so', sectionId: 'sec_work' },
  { id: generateId(), title: 'Slack', url: 'https://slack.com', sectionId: 'sec_work' },

  // Study
  { id: generateId(), title: 'Google Scholar', url: 'https://scholar.google.com', sectionId: 'sec_study' },
  { id: generateId(), title: 'Wikipedia', url: 'https://wikipedia.org', sectionId: 'sec_study' },
  { id: generateId(), title: 'Coursera', url: 'https://coursera.org', sectionId: 'sec_study' },
  { id: generateId(), title: 'Khan Academy', url: 'https://khanacademy.org', sectionId: 'sec_study' },

  // AI Tools
  { id: generateId(), title: 'ChatGPT', url: 'https://chat.openai.com', sectionId: 'sec_ai' },
  { id: generateId(), title: 'Claude', url: 'https://claude.ai', sectionId: 'sec_ai' },
  { id: generateId(), title: 'Gemini', url: 'https://gemini.google.com', sectionId: 'sec_ai' },
  { id: generateId(), title: 'Midjourney', url: 'https://midjourney.com', sectionId: 'sec_ai' },

  // Social
  { id: generateId(), title: 'Twitter / X', url: 'https://x.com', sectionId: 'sec_social' },
  { id: generateId(), title: 'Reddit', url: 'https://reddit.com', sectionId: 'sec_social' },
  { id: generateId(), title: 'LinkedIn', url: 'https://linkedin.com', sectionId: 'sec_social' },
  { id: generateId(), title: 'Instagram', url: 'https://instagram.com', sectionId: 'sec_social' },

  // Entertainment
  { id: generateId(), title: 'YouTube', url: 'https://youtube.com', sectionId: 'sec_entertainment' },
  { id: generateId(), title: 'Netflix', url: 'https://netflix.com', sectionId: 'sec_entertainment' },
  { id: generateId(), title: 'Spotify', url: 'https://open.spotify.com', sectionId: 'sec_entertainment' },
  { id: generateId(), title: 'Twitch', url: 'https://twitch.tv', sectionId: 'sec_entertainment' },

  // News
  { id: generateId(), title: 'Hacker News', url: 'https://news.ycombinator.com', sectionId: 'sec_news' },
  { id: generateId(), title: 'TechCrunch', url: 'https://techcrunch.com', sectionId: 'sec_news' },
  { id: generateId(), title: 'The Verge', url: 'https://theverge.com', sectionId: 'sec_news' },
  { id: generateId(), title: 'BBC News', url: 'https://bbc.com/news', sectionId: 'sec_news' },
];

export const DEFAULT_SETTINGS = {
  clockFormat: '12h',
  searchEngine: 'google',
  wallpaperId: 'default',
  customWallpaper: null,
  showSeconds: true,
  showGreeting: true,
  showNotes: true,
  userName: '',
};

export const DEFAULT_NOTES = '';

export const getDefaultState = () => ({
  sections: DEFAULT_SECTIONS,
  bookmarks: DEFAULT_BOOKMARKS,
  notes: DEFAULT_NOTES,
  settings: DEFAULT_SETTINGS,
});
