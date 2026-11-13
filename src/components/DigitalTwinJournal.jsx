import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useUser } from '../context/UserContext';
import DailyLogModal from './DailyLogModal';
import { fetchCurrentHabits, saveDailyHabits } from '../api/client';
import { getCharacterMedia } from '../utils/characterMedia';

// Default lifestyle metric data schema ready for real dynamic data injection
export const DEFAULT_LIFESTYLE_METRICS = [
  {
    id: 'sleep',
    label: 'Sleep',
    value: '5.2 h',
    current: 5.2,
    target: 8.0,
    unit: 'h',
    targetLabel: 'Target: 8.0h',
    progress: 0.65, // 5.2h / 8.0h (~65%)
    color: '#527ea9', // Slate blue
    trackColor: '#ebdccf',
    iconColor: '#25496f',
    bgColor: '#edf4fa',
    tooltip: 'Optimal: 8.0h (-2.8h deficit)',
    icon: (
      // Minimalist bed icon
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6">
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8v4" />
      </svg>
    )
  },
  {
    id: 'study',
    label: 'Study',
    value: '2.1 h',
    current: 2.1,
    target: 4.0,
    unit: 'h',
    targetLabel: 'Target: 4.0h',
    progress: 0.35, // 2.1h / 4.0h (~35%)
    color: '#c55f46', // Warm terracotta coral
    trackColor: '#ebdccf',
    iconColor: '#963923',
    bgColor: '#faeeea',
    tooltip: 'Target: 4.0h daily focus',
    icon: (
      // Open book icon
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    )
  },
  {
    id: 'screen',
    label: 'Screen',
    value: '7.8 h',
    current: 7.8,
    target: 5.0,
    unit: 'h',
    targetLabel: 'Limit: 5.0h',
    progress: 0.78, // 7.8h / 10.0h (~78%)
    color: '#b33e37', // Crimson red
    trackColor: '#ebdccf',
    iconColor: '#7e241e',
    bgColor: '#faebea',
    tooltip: 'High usage alert (limit 5.0h)',
    icon: (
      // Smartphone icon
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
      </svg>
    )
  },
  {
    id: 'exercise',
    label: 'Exercise',
    value: '0.3 h',
    current: 0.3,
    target: 1.0,
    unit: 'h',
    targetLabel: 'Goal: 1.0h',
    progress: 0.30, // 0.3h / 1.0h (~30%)
    color: '#d67f56', // Warm apricot
    trackColor: '#ebdccf',
    iconColor: '#9c4923',
    bgColor: '#faeee7',
    tooltip: 'Goal: 45 min moderate workout',
    icon: (
      // Dumbbell icon
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6">
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <path d="M6 20v-5" />
        <path d="M18 20v-5" />
        <path d="M6 9V4" />
        <path d="M18 9V4" />
        <path d="M2 14v-4" />
        <path d="M22 14v-4" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    )
  },
  {
    id: 'spending',
    label: 'Spending',
    value: '₹280/day',
    current: 280,
    target: 600,
    unit: '₹/day',
    targetLabel: 'Limit: ₹600/day',
    progress: 0.46, // ₹280 / ₹600 (~46%)
    color: '#d49b32', // Golden amber
    trackColor: '#ebdccf',
    iconColor: '#966617',
    bgColor: '#fcf6e8',
    tooltip: 'Budget: ₹600/day (Saving ₹320)',
    icon: (
      // Stack of coins icon
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
        <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </svg>
    )
  },
  {
    id: 'hydration',
    label: 'Hydration',
    value: '1.5 L',
    current: 1.5,
    target: 3.0,
    unit: 'L',
    targetLabel: 'Goal: 3.0L',
    progress: 0.50, // 1.5L / 3.0L (~50%)
    color: '#4383b7', // Cerulean blue
    trackColor: '#ebdccf',
    iconColor: '#205681',
    bgColor: '#edf5fb',
    tooltip: 'Daily Goal: 3.0 Liters',
    icon: (
      // Water droplet icon
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    )
  }
];

export default function DigitalTwinJournal({ 
  onScrollToTop, 
  onScrollToNext,
  mouseParallax,
  metricsData, 
  lifestyleScore = 42,
  userProfile 
}) {
  const [animatedProgress, setAnimatedProgress] = useState(true);
  const [hoveredDial, setHoveredDial] = useState(null);
  const [isDailyLogOpen, setIsDailyLogOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.search.includes('log=open');
    }
    return false;
  });
  const [selectedLogMetric, setSelectedLogMetric] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('metric') || null;
    }
    return null;
  });

  // Consume dynamic user context or fallback gracefully
  let userCtx = null;
  try {
    userCtx = useUser();
  } catch (e) {
    // Rendered outside provider
  }

  const activeUser = userProfile || (userCtx ? userCtx.user : null) || {
    name: 'Explorer',
    title: 'Mountain Explorer',
    avatarFull: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4'
  };

  const characterMedia = getCharacterMedia(activeUser);
  const displayName = activeUser.name || 'Explorer';
  const openCharacterModal = userCtx ? userCtx.openCharacterModal : null;

  // Initialize metrics scoped to active user
  const [currentMetrics, setCurrentMetrics] = useState(() => {
    if (metricsData) return metricsData;
    const userId = activeUser?.id;
    try {
      const storageKey = userId ? `future_you_${userId}_daily_metrics` : 'future_you_daily_metrics';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return DEFAULT_LIFESTYLE_METRICS.map(m => {
          if (parsed[m.id] !== undefined) {
            const val = parsed[m.id];
            let formattedVal = `${val} ${m.unit}`;
            if (m.id === 'spending') {
              formattedVal = `₹${Math.round(val)}/day`;
            }
            const progress = m.target ? Math.min(1, Math.max(0, val / m.target)) : 0.5;
            return {
              ...m,
              current: val,
              value: formattedVal,
              progress: progress
            };
          }
          return m;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LIFESTYLE_METRICS;
  });

  // Initialize score scoped to active user
  const [currentScore, setCurrentScore] = useState(() => {
    const userId = activeUser?.id;
    try {
      const scoreKey = userId ? `future_you_${userId}_lifestyle_score` : 'future_you_lifestyle_score';
      const savedScore = localStorage.getItem(scoreKey);
      if (savedScore !== null) {
        return Number(savedScore);
      }
    } catch (e) {
      console.error(e);
    }
    return lifestyleScore || 42;
  });

  const [mobileTab, setMobileTab] = useState('habits'); // 'habits' | 'profile'

  // Sync if props update externally
  useEffect(() => {
    if (metricsData) {
      setCurrentMetrics(metricsData);
    }
  }, [metricsData]);

  // GSAP Entrance Transition when Journal renders / scrolls into view
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.journal-left-page',
        { opacity: 0, x: -40, rotateY: -6 },
        { opacity: 1, x: 0, rotateY: 0, duration: 0.85, ease: 'power3.out' }
      );
      gsap.fromTo('.journal-right-page',
        { opacity: 0, x: 40, rotateY: 6 },
        { opacity: 1, x: 0, rotateY: 0, duration: 0.85, delay: 0.08, ease: 'power3.out' }
      );
      gsap.fromTo('.group\\/dial',
        { opacity: 0, scale: 0.82, y: 15 },
        { opacity: 1, scale: 1, y: 0, stagger: 0.05, duration: 0.55, delay: 0.2, ease: 'back.out(1.4)' }
      );
    });
    return () => ctx.revert();
  }, []);

  // Load real user habits and score from backend whenever active user changes
  useEffect(() => {
    const userId = activeUser?.id;
    fetchCurrentHabits().then(data => {
      if (data && data.metrics) {
        const hasLogs = data.metrics.some(m => Number(m.current) > 0);
        setCurrentMetrics(prev => prev.map(m => {
          const remote = data.metrics.find(rm => rm.id === m.id);
          if (remote) {
            return {
              ...m,
              current: remote.current,
              value: remote.value,
              progress: remote.progress,
              tooltip: remote.tooltip
            };
          }
          return m;
        }));
        if (data.productivity_score !== undefined) {
          setCurrentScore(hasLogs ? data.productivity_score : 0);
        }
      }
    });
  }, [activeUser?.id]);

  useEffect(() => {
    const handleHabitsUpdated = (e) => {
      const newValues = e.detail?.metrics;
      const newScore = e.detail?.score;
      const isReset = e.detail?.isReset || e.detail?.isLogout;

      if (isReset) {
        // Reset metrics for brand new user / sign out
        fetchCurrentHabits().then(data => {
          if (data && data.metrics) {
            const hasLogs = data.metrics.some(m => Number(m.current) > 0);
            setCurrentMetrics(prev => prev.map(m => {
              const remote = data.metrics.find(rm => rm.id === m.id);
              if (remote) {
                return {
                  ...m,
                  current: remote.current,
                  value: remote.value,
                  progress: remote.progress,
                  tooltip: remote.tooltip
                };
              }
              return m;
            }));
            setCurrentScore(hasLogs ? (data.productivity_score || 0) : 0);
          }
        });
        return;
      }

      if (newValues) {
        setCurrentMetrics(prev => prev.map(m => {
          if (newValues[m.id] !== undefined) {
            const val = newValues[m.id];
            let formattedVal = `${val} ${m.unit}`;
            if (m.id === 'spending') formattedVal = `₹${Math.round(val)}/day`;
            const progress = m.target ? Math.min(1, Math.max(0, val / m.target)) : 0.5;
            return { ...m, current: val, value: formattedVal, progress };
          }
          return m;
        }));
      }
      if (newScore !== undefined) {
        setCurrentScore(newScore);
      }
    };

    window.addEventListener('future-you-habits-updated', handleHabitsUpdated);
    return () => window.removeEventListener('future-you-habits-updated', handleHabitsUpdated);
  }, [activeUser?.id]);

  // Handle opening log modal
  const openDailyLog = (metricId = null) => {
    setSelectedLogMetric(metricId);
    setIsDailyLogOpen(true);
  };

  // Handle saving new logged data
  const handleSaveDailyLog = (newValues, newScore) => {
    const userId = activeUser?.id;

    const completedFactorsCount = [
      Number(newValues.sleep) > 0,
      Number(newValues.study) > 0,
      Number(newValues.screen) > 0,
      Number(newValues.exercise) > 0,
      Number(newValues.spending) > 0,
      Number(newValues.hydration) > 0
    ].filter(Boolean).length;
    const isDay1Complete = Boolean(newValues.is_complete) || completedFactorsCount === 6;

    setCurrentMetrics(prev => prev.map(m => {
      if (newValues[m.id] !== undefined) {
        const val = newValues[m.id];
        let formattedVal = `${val} ${m.unit}`;
        if (m.id === 'spending') {
          formattedVal = `₹${Math.round(val)}/day`;
        }
        const progress = m.target ? Math.min(1, Math.max(0, val / m.target)) : 0.5;
        return {
          ...m,
          current: val,
          value: formattedVal,
          progress: progress
        };
      }
      return m;
    }));

    setCurrentScore(newScore);

    // Save to Node.js backend
    saveDailyHabits({ ...newValues, is_complete: isDay1Complete }).then(res => {
      if (res && res.productivity_score !== undefined) {
        setCurrentScore(res.productivity_score);
      }
    });

    // Save to user-scoped localStorage
    try {
      const metricsKey = userId ? `future_you_${userId}_daily_metrics` : 'future_you_daily_metrics';
      const scoreKey = userId ? `future_you_${userId}_lifestyle_score` : 'future_you_lifestyle_score';
      localStorage.setItem(metricsKey, JSON.stringify(newValues));
      localStorage.setItem(scoreKey, JSON.stringify(newScore));
    } catch (e) {
      console.error('Failed to save metrics to localStorage', e);
    }

    // Broadcast event so Page 3 and Page 4 update instantly
    window.dispatchEvent(new CustomEvent('future-you-habits-updated', {
      detail: { userId, metrics: newValues, score: newScore }
    }));

    // Trigger sleek, real-world toast notification
    if (userCtx?.showNotification) {
      if (isDay1Complete) {
        userCtx.showNotification(
          "Day 1 logged · 1 day streak active",
          "",
          "success"
        );
      } else {
        userCtx.showNotification(
          `Habits saved (${completedFactorsCount}/6 complete)`,
          "",
          "info"
        );
      }
    }
  };

  const activeMetrics = currentMetrics;
  const completedCount = currentMetrics.filter(m => Number(m.current) > 0).length;
  const isDay1Complete = completedCount === 6;

  const CIRCLE_RADIUS = 35;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~219.91

  return (
    <div className="relative w-full h-full min-h-[640px] flex items-center justify-center p-0 m-0 overflow-hidden select-none font-caacupe">
      
      {/* 1. Wood Desk Background with Ambient Sunlight Shadows */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 transition-transform duration-700 ease-out"
        style={{
          transform: 'scale(1.15) translate3d(calc(var(--mouse-x, 0) * -2.5px), calc(var(--mouse-y, 0) * -1.8px), 0)',
        }}
      >
        <img 
          src="/assets/table-bg-clean.jpg" 
          alt="Desk surface" 
          className="w-full h-full object-cover"
        />

        {/* Dynamic Window Shadow Bars overlay */}
        <div 
          className="absolute left-0 top-0 w-[55%] h-[78%] pointer-events-none overflow-hidden select-none"
          style={{
            filter: 'url(#window-shadow-drift)',
            maskImage: 'radial-gradient(ellipse 90% 90% at 0% 0%, black 50%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 90% at 0% 0%, black 50%, transparent 95%)',
          }}
        >
          <img 
            src="/assets/table-bg-clean.jpg" 
            alt="Dynamic window shadow bars" 
            className="w-full h-full object-cover origin-top-left pointer-events-none select-none"
            style={{
              width: '181.8%',
              height: '128.2%',
              maxWidth: 'none',
            }}
          />
        </div>

        {/* Dynamic Sunlight Panes breathing warm light */}
        <div 
          className="absolute left-0 top-0 w-[52%] max-w-[680px] aspect-[520/450] pointer-events-none mix-blend-screen select-none animate-window-sun-breathe"
          style={{
            maskImage: 'radial-gradient(ellipse 85% 85% at 0% 0%, black 45%, transparent 92%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 85% at 0% 0%, black 45%, transparent 92%)',
          }}
        >
          <img 
            src="/assets/window_sunlight_panes.png" 
            alt="Warm breathing sunlight panes" 
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Atmospheric warm sunlight vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/20 pointer-events-none z-[1]" />

      {/* 3. LUSH VIEWPORT FOLIAGE: Framing the whole screen around the book */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-30 overflow-hidden transition-transform duration-700 ease-out"
        style={{
          transform: 'translate3d(calc(var(--mouse-x, 0) * -3.5px), calc(var(--mouse-y, 0) * -2.5px), 0)',
        }}
      >
        {/* Top-Left Hanging Leaf Canopy (Framing desk corner, lifted so it NEVER overlaps "Hello, Dishant!") */}
        <div className="absolute -top-12 sm:-top-18 md:-top-22 -left-8 sm:-left-12 w-[40%] max-w-[580px] pointer-events-none select-none">
          <img 
            src="/assets/wind_leaves.png" 
            alt="Sunlit leaves canopy" 
            className="w-full h-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)] rotate-[-3deg]"
          />
        </div>

        {/* Top-Right Hanging Leaf Canopy (Framing desk corner, lifted so it NEVER overlaps "Your Current Lifestyle") */}
        <div className="absolute -top-12 sm:-top-18 md:-top-22 -right-8 sm:-right-12 w-[40%] max-w-[580px] pointer-events-none select-none">
          <img 
            src="/assets/wind_leaves.png" 
            alt="Sunlit leaves canopy" 
            className="w-full h-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)] scale-x-[-1] rotate-[4deg]"
          />
        </div>

        {/* Left Viewport Border Botanical Branch */}
        <div className="absolute -left-6 sm:-left-8 top-[18%] w-32 sm:w-44 md:w-56 pointer-events-none select-none">
          <img 
            src="/assets/foliage_left_natural.png" 
            alt="Left botanical foliage" 
            className="w-full h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] opacity-90"
          />
        </div>

        {/* Right Viewport Border Botanical Branch */}
        <div className="absolute -right-6 sm:-right-8 top-[16%] w-32 sm:w-44 md:w-56 pointer-events-none select-none">
          <img 
            src="/assets/foliage_right_natural.png" 
            alt="Right botanical foliage" 
            className="w-full h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] opacity-90"
          />
        </div>

        {/* Bottom-Right Corner Foliage Sprigs */}
        <div className="absolute -right-4 sm:-right-6 -bottom-6 sm:-bottom-8 w-44 sm:w-56 md:w-68 pointer-events-none select-none">
          <img 
            src="/assets/foliage_corner_br_natural.png" 
            alt="Bottom right foliage" 
            className="w-full h-auto object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.6)] opacity-85"
          />
        </div>

        {/* Bottom-Left Corner Foliage Sprigs */}
        <div className="absolute -left-4 sm:-left-6 -bottom-6 sm:-bottom-8 w-44 sm:w-56 md:w-68 pointer-events-none select-none">
          <img 
            src="/assets/foliage_corner_bl_natural.png" 
            alt="Bottom left foliage" 
            className="w-full h-auto object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.6)] opacity-85"
          />
        </div>
      </div>

      {/* 2. THE BIG OPEN JOURNAL (Desktop Spread >= lg) */}
      <div 
        className="hidden lg:flex relative z-10 w-[96vw] max-w-[1850px] aspect-[1.84/1] max-h-[94vh] items-center justify-center transition-transform duration-500 ease-out"
        style={{
          transform: 'translate3d(calc(var(--mouse-x, 0) * 3px), calc(var(--mouse-y, 0) * 2px), 0)',
        }}
      >
        {/* Wide Unfolded Open Book Graphic matching Reference Proportions */}
        <img 
          src="/assets/open_book_wide.png" 
          alt="Open Journal" 
          className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_28px_60px_rgba(0,0,0,0.88)]"
        />

        {/* Subtle center binding crease shadow */}
        <div className="absolute left-1/2 top-[6%] -translate-x-1/2 w-[2.2%] h-[88%] bg-gradient-to-r from-black/10 via-black/20 to-black/10 blur-[1px] pointer-events-none z-20" />

        {/* ============================================================== */}
        {/* LEFT PAGE SPREAD: Bounded strictly inside parchment (7.5%-47.5%) */}
        {/* ============================================================== */}
        <div className="journal-left-page absolute left-[7.5%] top-[8%] w-[40%] h-[84%] flex flex-col justify-center items-center px-2 sm:px-4 py-2 sm:py-4 z-10 overflow-hidden">
          
          {/* Main Title Block: Bigger text with clear, breathable vertical gaps */}
          <div className="relative select-none flex flex-col items-center text-center w-full">

            {/* Main Greeting: "Hello, {displayName}!" BIGGER with slight hand tilt */}
            <div className="relative inline-block rotate-[-1.5deg] text-center">
              <h1 className="font-handwriting text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] xl:text-[4.6rem] font-bold text-[#24130a] tracking-normal leading-none inline-flex items-baseline gap-2.5 justify-center">
                <span>Hello,</span>
                <span className="relative inline-block">
                  <span>{displayName}!</span>
                  {/* Double red brush/pencil underline strictly under user's name! */}
                  <span className="absolute -bottom-2 sm:-bottom-3 left-[-4%] w-[110%] h-4 sm:h-6 pointer-events-none -rotate-1">
                    <svg viewBox="0 0 160 16" fill="none" className="w-full h-full overflow-visible">
                      <path 
                        d="M 4 7 C 35 11, 85 10, 130 5 C 145 3, 155 6, 158 7" 
                        stroke="#c53d28" 
                        strokeWidth="3.8" 
                        strokeLinecap="round" 
                      />
                      <path 
                        d="M 12 12 C 45 15, 95 13, 142 9" 
                        stroke="#c53d28" 
                        strokeWidth="2.4" 
                        strokeLinecap="round" 
                        opacity="0.85" 
                      />
                    </svg>
                  </span>
                </span>
              </h1>
            </div>

            {/* GAP IN THE TEXT: Spacious breathing room before the subheading */}
            <div className="relative mt-4 sm:mt-5 md:mt-6.5 rotate-[-0.8deg] text-center">
              <div className="font-handwriting text-2xl sm:text-3xl md:text-4xl lg:text-[2.7rem] xl:text-[3.1rem] font-bold text-[#2d180d] tracking-normal leading-tight flex flex-col items-center">
                <div>Let's build your</div>
                <div className="inline-flex items-center gap-2.5 mt-1 sm:mt-1.5 text-2xl sm:text-3xl md:text-4xl lg:text-[2.8rem] xl:text-[3.2rem]">
                  <span>Digital Twin</span>
                  {/* 3 Hand-drawn ink radiance burst rays pointing outwards to right */}
                  <span className="w-6 sm:w-8 h-6 sm:h-8 text-[#54341e] inline-block -rotate-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" className="w-full h-full">
                      <line x1="2" y1="12" x2="16" y2="12" />
                      <line x1="3" y1="7" x2="15" y2="4" />
                      <line x1="3" y1="17" x2="15" y2="20" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* LOWER PORTION: EXPANSIVE ANIME ARTWORK PLATE (Takes significant portion of the book, NOT another div container) */}
          <div className="relative mt-2 sm:mt-3 md:mt-4 w-full max-w-[520px] flex flex-col items-center mx-auto flex-1 justify-center">
            
            {/* The Big Artwork Plate — Direct on Parchment with authentic masking tape */}
            <div 
              onClick={openCharacterModal}
              className="group/artwork relative w-full aspect-[16/9.5] max-h-[270px] sm:max-h-[300px] md:max-h-[320px] rounded-2xl overflow-hidden border-2 border-[#8c6b4f]/35 shadow-[0_12px_32px_rgba(30,15,5,0.22)] hover:shadow-[0_16px_40px_rgba(30,15,5,0.32)] hover:border-[#8c6b4f]/65 transition-all duration-300 cursor-pointer select-none bg-[#e8dcce] -rotate-0.5 hover:rotate-0"
              title="Click to customize avatar and view account details"
            >
              {/* Authentic Translucent Masking Tape on Top-Left Corner */}
              <div className="absolute -top-3 -left-3.5 w-20 sm:w-24 h-6 sm:h-7 bg-[#eedab4]/85 border-y border-[#d4c19c]/60 shadow-xs -rotate-12 pointer-events-none z-20 backdrop-blur-[1px]" />
              
              {/* Authentic Translucent Masking Tape on Top-Right Corner */}
              <div className="absolute -top-3 -right-3.5 w-20 sm:w-24 h-6 sm:h-7 bg-[#eedab4]/85 border-y border-[#d4c19c]/60 shadow-xs rotate-12 pointer-events-none z-20 backdrop-blur-[1px]" />

              {/* High-Resolution Library Avatar */}
              <img 
                src={
                  (activeUser.isCustom && activeUser.customAvatarUrl)
                    ? activeUser.customAvatarUrl
                    : (activeUser.avatarFull || activeUser.avatarThumb || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4')
                } 
                alt={displayName} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/artwork:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4';
                }}
              />

              {/* Day 1 Completed Wax Seal Badge on Poster */}
              {isDay1Complete && (
                <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-[#2c180c]/90 border border-[#deb15c] text-[#fce8ba] text-[10px] font-sans font-black tracking-wider uppercase shadow-md flex items-center gap-1 backdrop-blur-xs">
                  <span>★</span>
                  <span>Day 1 Logged • 1 Day Streak 🔥</span>
                </div>
              )}

              {/* Integrated Artwork Gradient & Subtle Lower Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-8 pb-3 px-3 sm:px-4.5 flex items-end justify-between pointer-events-none z-10">
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm font-sans font-bold text-[#fce8ba] tracking-wider uppercase drop-shadow-md">
                    {activeUser.title || characterMedia.title || 'The Mountain Explorer'}
                  </span>
                  <span className="font-handwriting text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-lg leading-tight">
                    {displayName}
                  </span>
                </div>
                
                <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-[#24130a] text-xs sm:text-sm font-extrabold font-sans tracking-wide shadow-md flex items-center gap-1.5 group-hover/artwork:bg-white group-hover/artwork:scale-105 transition-all">
                  <span>✏️</span>
                  <span>Edit Profile</span>
                </span>
              </div>
            </div>

            {/* Direct Handwritten Caption below the Artwork on the Parchment */}
            <p className="font-handwriting text-sm sm:text-base md:text-lg lg:text-xl font-bold text-[#351b0a] text-center mt-2.5 sm:mt-3 leading-snug tracking-normal px-2 max-w-[480px]">
              {isDay1Complete 
                ? "✨ Day 1 trajectory calibrated! All 6 core lifestyle habits active and synchronized."
                : "Track all 6 daily habits to complete Day 1, explore your future self, and start your streak."}
            </p>
          </div>

        </div>

        {/* ============================================================== */}
        {/* RIGHT PAGE SPREAD: Clean Natural Parchment (BORDER REMOVED)    */}
        {/* ============================================================== */}
        <div className="journal-right-page absolute left-[52%] top-[8%] w-[40%] h-[84%] flex flex-col justify-around items-center px-4 py-3 sm:py-5 z-10 overflow-hidden">
          
          {/* Section Header: "Your Current Lifestyle" written in ink (clean, leaf-free) */}
          <div className="text-center select-none rotate-[-0.5deg] relative z-10 w-full shrink-0">
            <h2 className="font-handwriting text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-[2.3rem] 2xl:text-[2.8rem] font-bold text-[#24130a] tracking-normal leading-tight whitespace-nowrap">
              Your Current Lifestyle
            </h2>

            {/* Subtle pencil stroke flourish */}
            <div className="w-24 sm:w-32 md:w-40 h-[2px] bg-gradient-to-r from-transparent via-[#8e6e53]/50 to-transparent mx-auto mt-0.5 sm:mt-1 rounded-full" />
          </div>

          {/* MASTER LOG STATION: Transparent Glassy Bar on Parchment (No Blinking Dot) */}
          <div className="w-full max-w-[460px] sm:max-w-[520px] md:max-w-[560px] mx-auto my-1 sm:my-1.5 select-none relative z-10 shrink-0">
            <div 
              onClick={() => openDailyLog(null)}
              className={`group/logstation relative w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl transition-all duration-300 flex items-center justify-between cursor-pointer active:scale-[0.99] border ${
                isDay1Complete
                  ? 'bg-transparent hover:bg-emerald-800/[0.08] border-emerald-800/40 hover:border-emerald-800/65'
                  : 'bg-transparent hover:bg-[#8e6e53]/[0.08] border-[#8e6e53]/30 hover:border-[#8e6e53]/55'
              }`}
              title="Click to open the Daily Habit Logger"
            >
              {/* Left Side: Wax Seal / Ink Pen Icon + Title */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm sm:text-base shrink-0 shadow-inner group-hover/logstation:scale-105 transition-transform border ${
                  isDay1Complete 
                    ? 'bg-emerald-800/15 border-emerald-800/40 text-emerald-900' 
                    : 'bg-[#24130a]/[0.07] border-[#8e6e53]/30'
                }`}>
                  {isDay1Complete ? '✓' : '🖋️'}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-xs sm:text-sm font-black text-[#24130a] tracking-wider uppercase">
                      {isDay1Complete ? 'Day 1 Field Log Complete' : 'Daily Field Log'}
                    </span>
                    {isDay1Complete && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-sans font-black bg-emerald-800/20 text-emerald-900 border border-emerald-800/30">
                        1 Day Streak
                      </span>
                    )}
                  </div>
                  <span className="font-sans text-[10px] sm:text-[11px] text-[#7d5e45] font-medium leading-none mt-0.5">
                    {isDay1Complete
                      ? 'All 6 habits recorded • Streak active'
                      : `${completedCount} of 6 habits recorded • Complete all 6 for Day 1`}
                  </span>
                </div>
              </div>

              {/* Right Side: Sleek Action Button */}
              <div className={`flex items-center gap-1 px-3 sm:px-3.5 py-1 rounded-full font-sans font-bold text-[10px] sm:text-xs shadow-xs hover:shadow-sm tracking-wide group-hover/logstation:scale-105 transition-all shrink-0 ${
                isDay1Complete
                  ? 'bg-emerald-900 hover:bg-emerald-950 text-[#fce8ba]'
                  : 'bg-[#24130a] hover:bg-[#3d2415] text-[#f7eed6]'
              }`}>
                <span>{isDay1Complete ? '✓ Day 1 Complete' : '✎ Log Today'}</span>
              </div>
            </div>
          </div>

          {/* 6 Precision Lifestyle Gauge Charts (Rearranged, Zero Overlap, Data-Driven) */}
          <div className="grid grid-cols-3 gap-x-2.5 sm:gap-x-4 md:gap-x-5 gap-y-1 sm:gap-y-2 md:gap-y-2.5 px-1 sm:px-2 w-full max-w-[460px] sm:max-w-[520px] md:max-w-[560px] mx-auto select-none relative z-10 justify-items-center items-stretch my-auto">
            {activeMetrics.map((metric) => {
              // Calculate progress dynamically (0.0 to 1.0)
              const progress = typeof metric.progress === 'number' 
                ? metric.progress 
                : (metric.current !== undefined && metric.target) 
                  ? Math.min(1, Math.max(0, metric.current / metric.target)) 
                  : 0.5;
              const percentage = Math.round(progress * 100);
              const currentOffset = CIRCUMFERENCE * (1 - progress);

              // Calculate tip bead polar coordinates
              const tipAngle = (progress * 360 - 90) * (Math.PI / 180);
              const tipX = 50 + CIRCLE_RADIUS * Math.cos(tipAngle);
              const tipY = 50 + CIRCLE_RADIUS * Math.sin(tipAngle);

              return (
                <div 
                  key={metric.id}
                  onClick={() => openDailyLog(metric.id)}
                  onMouseEnter={() => setHoveredDial(metric.id)}
                  onMouseLeave={() => setHoveredDial(null)}
                  className="group/dial relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-xl bg-transparent hover:-translate-y-0.5 transition-all duration-300 w-full cursor-pointer"
                  title={`Click to change only ${metric.label}`}
                >
                  {/* Gauge Chart Element (Dedicated graphic space, no text collision) */}
                  <div className="relative w-13 h-13 sm:w-15 sm:h-15 md:w-18 md:h-18 lg:w-[76px] lg:h-[76px] aspect-square flex items-center justify-center shrink-0">
                    
                    {/* SVG Radial Gauge Chart */}
                    <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                      {/* Outer Precision Gauge Tick Marks */}
                      {[...Array(12)].map((_, i) => {
                        const angle = (i * 30 - 90) * (Math.PI / 180);
                        const r1 = 41.5;
                        const r2 = 46;
                        return (
                          <line
                            key={i}
                            x1={50 + r1 * Math.cos(angle)}
                            y1={50 + r1 * Math.sin(angle)}
                            x2={50 + r2 * Math.cos(angle)}
                            y2={50 + r2 * Math.sin(angle)}
                            stroke="#8c6b4f"
                            strokeWidth={i % 3 === 0 ? "1.8" : "1.0"}
                            opacity={i % 3 === 0 ? "0.45" : "0.22"}
                            strokeLinecap="round"
                          />
                        );
                      })}

                      {/* Soft Watercolor Inner Well */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="25" 
                        fill={metric.bgColor || '#f7ede2'} 
                        fillOpacity="0.85" 
                      />

                      {/* Background Track Circle */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r={CIRCLE_RADIUS} 
                        stroke={metric.trackColor || '#ebdccf'} 
                        strokeWidth="5.5" 
                        fill="none" 
                        className="opacity-80"
                      />

                      {/* Animated Colored Progress Arc */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r={CIRCLE_RADIUS} 
                        stroke={metric.color} 
                        strokeWidth="6.5" 
                        fill="none" 
                        strokeDasharray={CIRCUMFERENCE} 
                        strokeDashoffset={currentOffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{
                          filter: hoveredDial === metric.id ? `drop-shadow(0 0 8px ${metric.color}aa)` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))'
                        }}
                      />

                      {/* Luminous Active Tip Bead */}
                      {progress > 0.04 && (
                        <circle
                          cx={tipX}
                          cy={tipY}
                          r="3"
                          fill="#ffffff"
                          stroke={metric.color}
                          strokeWidth="2.2"
                          className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                        />
                      )}
                    </svg>

                    {/* Centered Category Icon inside the Chart Well */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div 
                        className="transition-transform duration-300 group-hover/dial:scale-115 scale-85 sm:scale-95 md:scale-100"
                        style={{ color: metric.iconColor }}
                      >
                        {metric.icon}
                      </div>
                    </div>
                  </div>

                  {/* Clean Separated Typography: Metric Label, Value, and Target (ZERO OVERLAP) */}
                  <div className="flex flex-col items-center text-center mt-0.5 sm:mt-1 w-full px-0.5">
                    {/* Metric Label in handwritten ink */}
                    <span className="font-handwriting text-sm sm:text-base md:text-lg font-bold text-[#24130a] leading-tight tracking-normal">
                      {metric.label}
                    </span>
                    {/* Metric Value in clean bold ink */}
                    <span className="font-sans text-xs sm:text-sm md:text-base font-black text-[#120803] tracking-tight leading-none mt-0.5">
                      {metric.value}
                    </span>
                    {/* Progress percentage & goal badge */}
                    <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-sans font-semibold text-[#664b36]">
                      <span className="font-bold text-[#2a170c]">{percentage}%</span>
                      <span className="text-[#8c6b4f]/60">•</span>
                      <span className="truncate max-w-[55px] sm:max-w-none">{metric.targetLabel || (metric.target ? `Goal: ${metric.target}${metric.unit || ''}` : '')}</span>
                    </div>

                    {/* In-Card Aspect Button (Changes ONLY this aspect!) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDailyLog(metric.id);
                      }}
                      className="mt-1 px-2.5 py-0.5 sm:px-3 sm:py-0.5 rounded-full bg-transparent hover:bg-[#24130a] hover:text-[#f8d789] border border-[#8e6e53]/35 hover:border-[#deb15c] text-[#3a2212] text-[9px] sm:text-[10px] font-sans font-bold tracking-wide active:scale-95 transition-all duration-200 flex items-center gap-1 group/btn cursor-pointer"
                      title={`Click to change only ${metric.label}`}
                    >
                      <span className="text-[#a0522d] group-hover/btn:text-[#deb15c] text-[9px]">✎</span>
                      <span>Change {metric.label}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Lifestyle Score & Progress Bar */}
          <div className="text-center pt-0.5 pb-0.5 select-none rotate-[-0.5deg] relative z-10 w-full max-w-[320px] mx-auto mt-1 sm:mt-2 shrink-0">
            {/* Title in handwritten script */}
            <h3 className="font-handwriting text-xl sm:text-2xl md:text-[1.9rem] font-bold text-[#24130a] leading-tight">
              Lifestyle Score
            </h3>

            {/* Score Number Display */}
            <div className="flex items-baseline justify-center gap-1.5 my-0.5">
              <span className="font-sans text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-black text-[#120803] tracking-tight">
                {currentScore}
              </span>
              <span className="font-sans text-sm sm:text-base md:text-lg font-bold text-[#725944]">
                / 100
              </span>
            </div>

            {/* Rounded Horizontal Progress Bar */}
            <div className="w-[85%] max-w-[260px] h-3 sm:h-3.5 bg-[#decbb6] rounded-full mx-auto p-0.5 shadow-inner border border-[#cebca8]/80 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#b34863] via-[#c65572] to-[#d86683] shadow-xs transition-all duration-1200 ease-out"
                style={{
                  width: animatedProgress ? `${currentScore}%` : '0%'
                }}
              />
            </div>
          </div>

        </div>

        {/* Bottom Center Scroll Pill matching Reference Image */}
        <div 
          onClick={onScrollToNext}
          className="absolute -bottom-1.5 sm:bottom-0.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center cursor-pointer select-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] opacity-95 group/scroll"
          title="Click to flip to Page 3 (Current You Insights)"
        >
          <div className="px-3.5 py-0.5 sm:py-1 rounded-full bg-black/60 group-hover/scroll:bg-black/85 backdrop-blur-[2px] border border-white/20 group-hover/scroll:border-[#deb15c] text-xs sm:text-sm font-medium tracking-wide flex items-center gap-1.5 shadow-md transition-all group-hover/scroll:scale-105">
            <span className="group-hover/scroll:text-[#deb15c]">Scroll</span>
            <span className="text-sm font-bold group-hover/scroll:text-[#deb15c] group-hover/scroll:translate-y-0.5 transition-transform">↓</span>
          </div>
          <span className="text-[10px] sm:text-xs text-[#f2e6cf] group-hover/scroll:text-[#deb15c] opacity-85 mt-0.5 tracking-wider font-light transition-colors">
            (page flip)
          </span>
        </div>

      </div>

      {/* MOBILE JOURNAL VIEW (< lg) */}
      <div className="lg:hidden relative z-20 w-[94vw] max-w-[430px] sm:max-w-[500px] h-[86dvh] max-h-[740px] bg-[#f7eedc] border-2 border-[#8c6b4f]/70 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between p-3 sm:p-4 overflow-y-auto parchment-scroll">
        
        {/* Mobile Header Tabs */}
        <div className="flex items-center justify-center p-1 rounded-full bg-[#ebd8c0]/90 border border-[#8e6e53]/40 mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('habits')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
              mobileTab === 'habits'
                ? 'bg-[#2b180d] text-[#faedd4] shadow-xs'
                : 'text-[#5c3a22] hover:text-[#2b180d]'
            }`}
          >
            📝 Daily Habits ({completedCount}/6)
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('profile')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
              mobileTab === 'profile'
                ? 'bg-[#2b180d] text-[#faedd4] shadow-xs'
                : 'text-[#5c3a22] hover:text-[#2b180d]'
            }`}
          >
            📖 Explorer Profile
          </button>
        </div>

        {/* Tab 1: Profile & Avatar */}
        {mobileTab === 'profile' ? (
          <div className="flex-1 flex flex-col justify-between items-center text-center py-1">
            <div className="w-full">
              <h1 className="font-handwriting text-2xl font-bold text-[#24130a] leading-tight">
                Hello, {displayName}!
              </h1>
              <div className="font-handwriting text-base font-bold text-[#2d180d] mt-0.5">
                Your Digital Twin Character
              </div>
            </div>

            {/* Avatar Card (Proportional, Elegantly framed) */}
            <div 
              onClick={openCharacterModal}
              className="relative w-full aspect-[16/9.5] max-h-[190px] rounded-xl overflow-hidden border-2 border-[#8c6b4f]/40 shadow-md my-2 cursor-pointer bg-[#e8dcce] group"
              title="Tap to change avatar"
            >
              <img 
                src={
                  (activeUser.isCustom && activeUser.customAvatarUrl)
                    ? activeUser.customAvatarUrl
                    : (activeUser.avatarFull || activeUser.avatarThumb || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4')
                } 
                alt={displayName} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 flex items-end justify-between">
                <div className="text-left">
                  <span className="text-[10px] font-sans font-bold text-[#fce8ba] uppercase block">
                    {activeUser.title || characterMedia.title || 'The Mountain Explorer'}
                  </span>
                  <span className="font-handwriting text-base font-black text-white leading-none">
                    {displayName}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-black font-sans shadow-xs flex items-center gap-1">
                  <span>🎨</span>
                  <span>Change</span>
                </span>
              </div>
            </div>

            <p className="font-handwriting text-xs sm:text-sm font-bold text-[#351b0a] leading-snug px-2">
              {isDay1Complete 
                ? "✨ Day 1 trajectory calibrated! All 6 core lifestyle habits active and synchronized."
                : "Track all 6 daily habits to complete Day 1, explore your future self, and start your streak."}
            </p>

            <button
              type="button"
              onClick={() => setMobileTab('habits')}
              className="w-full py-2.5 mt-2 rounded-full bg-[#24130a] hover:bg-[#3d2415] text-[#f7eed6] text-xs font-serif font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>View & Log Habits</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          /* Tab 2: Daily Lifestyle Habits */
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* Top Compact Identity & Streak Banner */}
            <div className="p-2 rounded-xl bg-[#ebd8c0]/70 border border-[#8e6e53]/40 flex items-center justify-between gap-2 mb-1.5 shadow-2xs">
              <div 
                onClick={openCharacterModal}
                className="flex items-center gap-2.5 cursor-pointer group min-w-0"
                title="Tap to change avatar"
              >
                <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#8c6b4f] bg-[#e8dcce] shadow-xs shrink-0">
                  <img 
                    src={
                      (activeUser.isCustom && activeUser.customAvatarUrl)
                        ? activeUser.customAvatarUrl
                        : (activeUser.avatarThumb || activeUser.avatarFull || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4')
                    } 
                    alt={displayName} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                </div>
                <div className="text-left min-w-0">
                  <span className="font-serif font-black text-xs text-[#24130a] block truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-sans font-bold text-[#7d5e45] block truncate">
                    {activeUser.title || characterMedia.title || 'Mountain Explorer'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 rounded-full bg-[#24130a] text-[#fce8ba] text-[10px] font-sans font-black tracking-wider uppercase">
                  {isDay1Complete ? '🔥 1d Streak' : '⭐ Day 1'}
                </span>
                <button
                  type="button"
                  onClick={openCharacterModal}
                  className="p-1 text-[#5c3a22] hover:text-[#24130a] text-xs font-bold"
                  title="Change Avatar"
                >
                  🎨
                </button>
              </div>
            </div>

            <div className="text-center">
              {/* Daily Field Log Station */}
              <div 
                onClick={() => openDailyLog(null)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#8e6e53]/35 bg-[#ebd8c0]/50 hover:bg-[#ebd8c0]/80 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2 text-left">
                  <span className="text-sm">{isDay1Complete ? '✓' : '🖋️'}</span>
                  <div>
                    <span className="font-sans text-[11px] font-black text-[#24130a] uppercase block">
                      {isDay1Complete ? 'Day 1 Complete' : 'Daily Field Log'}
                    </span>
                    <span className="font-sans text-[9px] text-[#7d5e45]">
                      {completedCount} of 6 habits recorded
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#24130a] text-[#f7eed6] text-[10px] font-sans font-bold shadow-2xs">
                  {isDay1Complete ? 'Edit' : 'Log Today'}
                </span>
              </div>
            </div>

            {/* 6 Habit Gauge Grid */}
            <div className="grid grid-cols-3 gap-2 my-1.5">
              {activeMetrics.map((metric) => {
                const progress = typeof metric.progress === 'number' 
                  ? metric.progress 
                  : (metric.current !== undefined && metric.target) 
                    ? Math.min(1, Math.max(0, metric.current / metric.target)) 
                    : 0.5;
                const percentage = Math.round(progress * 100);
                const currentOffset = CIRCUMFERENCE * (1 - progress);

                return (
                  <div
                    key={metric.id}
                    onClick={() => openDailyLog(metric.id)}
                    className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-black/5 cursor-pointer"
                  >
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r={CIRCLE_RADIUS} fill="none" stroke="#e8dcce" strokeWidth="8" />
                        <circle 
                          cx="50" 
                          cy="50" 
                          r={CIRCLE_RADIUS} 
                          fill="none" 
                          stroke={metric.color} 
                          strokeWidth="8"
                          strokeDasharray={CIRCUMFERENCE}
                          strokeDashoffset={currentOffset}
                          strokeLinecap="round" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-mono font-black text-[#24130a]">
                          {metric.current}{metric.unit === 'h' ? 'h' : ''}
                        </span>
                      </div>
                    </div>
                    <span className="font-handwriting text-xs font-bold text-[#24130a] mt-0.5 truncate max-w-[65px]">
                      {metric.label}
                    </span>
                    <span className="font-sans text-[9px] font-bold text-[#8c6b4f]">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Score & Proceed */}
            <div className="text-center pt-1 border-t border-[#8e6e53]/20">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="font-handwriting text-lg font-bold text-[#24130a]">Score:</span>
                <span className="font-mono text-xl font-black text-[#120803]">{currentScore}/100</span>
              </div>
              <button
                type="button"
                onClick={onScrollToNext}
                className="w-full py-2.5 rounded-full bg-[#24130a] hover:bg-[#3d2415] text-[#f7eed6] text-xs font-serif font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Proceed to Insights (Page 3)</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Quick Return Pill */}
        <div className="flex items-center justify-between pt-1.5 border-t border-[#8e6e53]/20 text-[11px] font-serif font-bold text-[#5c3a22]">
          <button 
            type="button" 
            onClick={onScrollToTop}
            className="hover:text-[#24130a] flex items-center gap-1 cursor-pointer"
          >
            <span>↑</span>
            <span>Desk</span>
          </button>
          <button 
            type="button" 
            onClick={onScrollToNext}
            className="hover:text-[#24130a] flex items-center gap-1 cursor-pointer"
          >
            <span>Page 3 (Insights)</span>
            <span>↓</span>
          </button>
        </div>

      </div>

      {/* Floating Return Button to smoothly scroll back up to Desk Scene */}
      <div 
        onClick={onScrollToTop}
        className="hidden lg:block absolute right-3 md:right-5 bottom-2 md:bottom-3 z-30 text-right select-none cursor-pointer group text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] scale-85 sm:scale-90 md:scale-95 origin-bottom-right"
        title="Scroll or click to return to desk"
      >
        <div className="text-2xl md:text-3xl lg:text-4xl leading-none font-medium flex items-center justify-end gap-2 group-hover:text-[#f8d789] transition-colors duration-200">
          <span>Top</span>
          <span className="inline-block transition-transform duration-300 group-hover:-translate-y-1">↑</span>
        </div>
        <div className="text-sm md:text-base lg:text-lg opacity-85 mt-1 tracking-wider group-hover:opacity-100 transition-opacity">
          (desk scene)
        </div>
        <div className="w-14 md:w-16 h-6 md:h-8 ml-auto mt-0.5 transition-transform duration-300 group-hover:-translate-y-1">
          <svg viewBox="0 0 100 50" fill="none" className="w-full h-full stroke-white group-hover:stroke-[#f8d789] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-colors duration-200">
            <path d="M 15 42 C 45 46, 75 36, 88 14" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 72 15 L 89 13 L 85 27" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Daily Data Log Modal */}
      <DailyLogModal
        isOpen={isDailyLogOpen}
        onClose={() => setIsDailyLogOpen(false)}
        metrics={currentMetrics}
        onSave={handleSaveDailyLog}
        initialMetricId={selectedLogMetric}
      />

    </div>
  );
}
