// Add future tools here. Set available: false until the tool is built.
export const TOOLS = [
  {
    id: 'planner',
    name: 'Weekly Planner',
    description: 'Plan and track weekly lessons for Orion and Malachi.',
    icon: 'PL',
    href: '/planner/',
    available: true,
  },
  {
    id: 'reward-tracker',
    name: 'Reward Tracker',
    description: 'Earn and redeem points for good work and character.',
    icon: 'RT',
    href: '/reward-tracker',
    available: true,
  },
  {
    id: 'te-extractor',
    name: 'TE Extractor',
    description: 'Extract questions and vocabulary from BJU Press Teacher Edition PDFs.',
    icon: 'TE',
    href: '/te-extractor/',
    available: true,
  },
  {
    id: 'academic-records',
    name: 'Academic Records',
    description: 'Transcripts, grades, and attendance — coming soon.',
    icon: 'AR',
    href: null,
    available: false,
  },
];
