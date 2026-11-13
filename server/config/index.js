import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(rootDir, '.env') });

export const config = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'future_you_jwt_secret_key_compounding_2031',
  JWT_EXPIRES_IN: '7d',
  MONGODB_URI: process.env.MONGODB_URI || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  // Groq LLM Configuration (new provider)
  GROQ_API_KEY: process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  
  // Expanded 16 Avatar Character Presets across 4 Distinct Archetypes
  CHARACTER_PRESETS: [
    // --- 1. Adventurers & Explorers ---
    {
      id: 'explorer',
      name: 'Dishant',
      category: 'explorer',
      title: 'The Mountain Explorer',
      quote: 'The summit belongs to those who climb daily.',
      avatarThumb: '/assets/avatar_explorer_thumb.jpg',
      avatarFull: '/assets/avatar_explorer_full.jpg',
      themeColor: '#b86f50',
      description: 'Adventurous wanderer scaling alpine peaks to discover their future self through daily habit tracking.'
    },
    {
      id: 'stargazer',
      name: 'Aura',
      category: 'cosmic',
      title: 'The Sunset Stargazer',
      quote: 'Look to the stars, but walk with steady ground.',
      avatarThumb: '/assets/avatar_stargazer_thumb.jpg',
      avatarFull: '/assets/avatar_stargazer_full.jpg',
      themeColor: '#7a5a8c',
      description: 'Observant traveler journeying through golden twilight clouds, mapping life goals with cosmic clarity.'
    },
    {
      id: 'horizon_wanderer',
      name: 'Aria',
      category: 'explorer',
      title: 'The Horizon Nomad',
      quote: 'Every sunrise offers a new horizon to conquer.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=ffd5dc,ffdfbf',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=ffd5dc,ffdfbf',
      themeColor: '#c27838',
      description: 'Wayfarer charting uncharted territories, turning long-term vision into disciplined daily steps.'
    },
    {
      id: 'forest_ranger',
      name: 'Kaelen',
      category: 'explorer',
      title: 'The Emerald Ranger',
      quote: 'Patience in the woods; persistence in the heart.',
      avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kaelen&backgroundColor=b6e3f4,c0aede',
      avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kaelen&backgroundColor=b6e3f4,c0aede',
      themeColor: '#15803d',
      description: 'Wilderness tracker navigating complex life seasons with patience, endurance, and fortitude.'
    },

    // --- 2. Scholars, Academics & Tech Innovators ---
    {
      id: 'scholar',
      name: 'Ren',
      category: 'scholar',
      title: 'The Field Scholar',
      quote: 'Knowledge compounds faster than interest.',
      avatarThumb: '/assets/avatar_scholar_thumb.jpg',
      avatarFull: '/assets/avatar_scholar_full.jpg',
      themeColor: '#4f785a',
      description: 'Reflective researcher documenting personal growth, study routines, and mindfulness in the meadows.'
    },
    {
      id: 'cyber_architect',
      name: 'Neo',
      category: 'tech',
      title: 'The Cyberpunk Architect',
      quote: 'Write clean code; build unbroken habits.',
      avatarThumb: 'https://api.dicebear.com/7.x/bottts/svg?seed=Neo&backgroundColor=d1d4f9',
      avatarFull: 'https://api.dicebear.com/7.x/bottts/svg?seed=Neo&backgroundColor=d1d4f9',
      themeColor: '#06b6d4',
      description: 'Futuristic systems architect engineering deep focus blocks and high-impact digital workflows.'
    },
    {
      id: 'quantum_analyst',
      name: 'Maya',
      category: 'tech',
      title: 'The Quantum Synthesizer',
      quote: 'In small data points lies infinite potential.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=c0aede',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=c0aede',
      themeColor: '#8b5cf6',
      description: 'Analytical thinker turning behavioral data and habit tracking into predictive self-optimization.'
    },
    {
      id: 'clockwork_inventor',
      name: 'Ezekiel',
      category: 'scholar',
      title: 'The Arcane Mechanist',
      quote: 'Time is the greatest raw material we possess.',
      avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ezekiel&backgroundColor=ffd5dc',
      avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ezekiel&backgroundColor=ffd5dc',
      themeColor: '#d97706',
      description: 'Precision craftsman balancing clockwork time management with deep intellectual curiosity.'
    },

    // --- 3. Cosmic, Zen & Mindfulness ---
    {
      id: 'zen_monk',
      name: 'Sora',
      category: 'cosmic',
      title: 'The Blossom Ascetic',
      quote: 'Quiet the mind, and the path unfolds effortlessly.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sora&backgroundColor=ffdfbf',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sora&backgroundColor=ffdfbf',
      themeColor: '#ec4899',
      description: 'Practitioner of mindful awareness, morning stillness, and conscious screen-time reduction.'
    },
    {
      id: 'solarpunk_botanist',
      name: 'Lyra',
      category: 'cosmic',
      title: 'The Solarpunk Botanist',
      quote: 'Nurture your daily roots to touch the sky.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Lyra&backgroundColor=b6e3f4',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Lyra&backgroundColor=b6e3f4',
      themeColor: '#10b981',
      description: 'Living harmony advocate prioritizing clean hydration, deep restorative sleep, and natural energy.'
    },
    {
      id: 'lunar_dreamer',
      name: 'Selene',
      category: 'cosmic',
      title: 'The Lunar Dreamweaver',
      quote: 'The quiet hours reveal who you are becoming.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Selene&backgroundColor=c0aede',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Selene&backgroundColor=c0aede',
      themeColor: '#6366f1',
      description: 'Night-sky strategist cultivating restorative circadian rhythms and creative contemplation.'
    },
    {
      id: 'mystic_oracle',
      name: 'Seraphina',
      category: 'cosmic',
      title: 'The Celestial Oracle',
      quote: 'The future is not guessed; it is carved today.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Seraphina&backgroundColor=d1d4f9',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Seraphina&backgroundColor=d1d4f9',
      themeColor: '#a855f7',
      description: 'Intuitive visionary reading behavioral patterns to foresee 5-year future compound outcomes.'
    },

    // --- 4. Champions, Athletic & Willpower ---
    {
      id: 'iron_champion',
      name: 'Ares',
      category: 'athletic',
      title: 'The Iron Titan',
      quote: 'Strength is forged in the repetitions no one sees.',
      avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ares&backgroundColor=ffb8b8',
      avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ares&backgroundColor=ffb8b8',
      themeColor: '#dc2626',
      description: 'Relentless physical enthusiast forging discipline through unbroken daily workouts and resilience.'
    },
    {
      id: 'swift_striker',
      name: 'Valerie',
      category: 'athletic',
      title: 'The Windblade Striker',
      quote: 'Speed of action eliminates doubt.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Valerie&backgroundColor=ffe0b2',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Valerie&backgroundColor=ffe0b2',
      themeColor: '#f59e0b',
      description: 'High-agility competitor with lightning speed, rigorous cardiovascular endurance, and daily grit.'
    },
    {
      id: 'ronin_grit',
      name: 'Jin',
      category: 'athletic',
      title: 'The Ronin of Discipline',
      quote: 'Master yourself, and nothing can sway you.',
      avatarThumb: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jin&backgroundColor=cfd8dc',
      avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jin&backgroundColor=cfd8dc',
      themeColor: '#475569',
      description: 'Solitary master of unwavering willpower, zero excuses, and compound habit mastery.'
    },
    {
      id: 'dawn_valkyrie',
      name: 'Freya',
      category: 'athletic',
      title: 'The Dawn Vanguard',
      quote: 'Win the morning, command the future.',
      avatarThumb: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Freya&backgroundColor=ffcdd2',
      avatarFull: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Freya&backgroundColor=ffcdd2',
      themeColor: '#e11d48',
      description: 'First to wake, greets the morning with unwavering intent, disciplined spending, and focus.'
    }
  ],

  // Standard Habit Benchmarks
  HABIT_BENCHMARKS: {
    sleep: { label: 'Sleep', target: 8.0, unit: 'h', color: '#527ea9' },
    study: { label: 'Study', target: 4.0, unit: 'h', color: '#c55f46' },
    screen: { label: 'Screen', target: 5.0, unit: 'h', color: '#b33e37' },
    exercise: { label: 'Exercise', target: 1.0, unit: 'h', color: '#d67f56' },
    spending: { label: 'Spending', target: 600, unit: '₹/day', color: '#d49b32' },
    hydration: { label: 'Hydration', target: 3.0, unit: 'L', color: '#38bdf8' }
  }
};
