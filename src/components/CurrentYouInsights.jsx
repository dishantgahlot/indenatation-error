import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { fetchWeeklyCycle, fetchStreakData, batchUploadDataset, saveDailyHabits, fetchFutureLetter } from '../api/client';
import LiveDatasetAdjusterModal from './LiveDatasetAdjusterModal';
import demoScenariosData from '../data/demoScenarios.json';

// Helper to compute mathematically precise SVG donut path arcs
function getDonutSlicePath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep <= 0.8) return '';
  const rad = Math.PI / 180;
  const gap = Math.min(0.5, sweep * 0.05);
  const sAngle = startAngle + gap;
  const eAngle = endAngle - gap;

  if (sweep >= 359) {
    const midAngle = startAngle + 180;
    const p1 = getDonutSlicePath(cx, cy, innerRadius, outerRadius, startAngle, midAngle);
    const p2 = getDonutSlicePath(cx, cy, innerRadius, outerRadius, midAngle, endAngle);
    return `${p1} ${p2}`;
  }

  const x1 = cx + outerRadius * Math.cos(sAngle * rad);
  const y1 = cy + outerRadius * Math.sin(sAngle * rad);
  const x2 = cx + outerRadius * Math.cos(eAngle * rad);
  const y2 = cy + outerRadius * Math.sin(eAngle * rad);

  const x3 = cx + innerRadius * Math.cos(eAngle * rad);
  const y3 = cy + innerRadius * Math.sin(eAngle * rad);
  const x4 = cx + innerRadius * Math.cos(sAngle * rad);
  const y4 = cy + innerRadius * Math.sin(sAngle * rad);

  const largeArc = (eAngle - sAngle) > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}

export default function CurrentYouInsights({ onScrollToPage2, onScrollToHome, mouseParallax, onScrollToNext }) {
  const { user, openCharacterModal } = useUser();
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState(null);
  const [activeSeriesFilter, setActiveSeriesFilter] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('habit') || null;
    }
    return null;
  });

  const activeAvatar = user?.avatarFull || user?.avatarThumb || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4';
  const userName = user?.name || 'Explorer';

  // Read actual recorded habits from user-scoped localStorage - null means no data logged yet
  const [recordedMetrics, setRecordedMetrics] = useState(() => {
    try {
      const storageKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return null; // No data logged yet - graphs should be empty
  });

  const [backendCycleData, setBackendCycleData] = useState(null);
  const [streakData, setStreakData] = useState(() => ({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysLogged: 0,
    streakStatus: 'none',
    todayLogged: false,
    completedFactorsCount: 0
  }));
  const [isDatasetAdjusterOpen, setIsDatasetAdjusterOpen] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('scenario_1_baseline');
  const [isSwitchingScenario, setIsSwitchingScenario] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [mobileTab, setMobileTab] = useState('cycle'); // 'cycle' | 'breakdown'
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const handleHabitDelta = (habitId, delta) => {
    setRecordedMetrics(prev => {
      const current = prev || { sleep: 7.0, study: 3.5, screen: 3.0, exercise: 1.0, spending: 280, hydration: 2.0 };
      const currentVal = Number(current[habitId] ?? (habitId === 'sleep' ? 7.0 : habitId === 'study' ? 3.5 : habitId === 'screen' ? 3.0 : 1.0));
      let newVal = Math.round((currentVal + delta) * 10) / 10;
      
      if (habitId === 'sleep') newVal = Math.min(14, Math.max(0, newVal));
      else if (habitId === 'study') newVal = Math.min(14, Math.max(0, newVal));
      else if (habitId === 'screen') newVal = Math.min(14, Math.max(0, newVal));
      else if (habitId === 'exercise') newVal = Math.min(6, Math.max(0, newVal));
      else newVal = Math.max(0, newVal);

      const updated = {
        ...current,
        [habitId]: newVal
      };

      const sleepScore = Math.min(100, (updated.sleep / 8) * 100);
      const studyScore = Math.min(100, (updated.study / 4) * 100);
      const screenScore = Math.max(10, 100 - Math.max(0, updated.screen - 5) * 20);
      const newScore = Math.round(sleepScore * 0.3 + studyScore * 0.4 + screenScore * 0.3);

      try {
        const metricsKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
        const scoreKey = user?.id ? `future_you_${user.id}_lifestyle_score` : 'future_you_lifestyle_score';
        localStorage.setItem(metricsKey, JSON.stringify(updated));
        localStorage.setItem(scoreKey, JSON.stringify(newScore));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('future-you-habits-updated', {
        detail: { userId: user?.id, metrics: updated, score: newScore }
      }));

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        saveDailyHabits(updated).catch(e => console.warn('Could not sync adjusted habits:', e));
      }, 1000);

      return updated;
    });
  };

  const handleQuickScenario = async (sc) => {
    setIsSwitchingScenario(true);
    setActiveScenarioId(sc.id);
    try {
      // 1. Batch upload the full 7-day logs to backend database
      await batchUploadDataset(sc.weekly_logs);

      // 2. Save Sunday (latest) habit metrics
      const latestDay = sc.weekly_logs[sc.weekly_logs.length - 1];
      await saveDailyHabits(latestDay);

      // 3. Persist to user-scoped localStorage
      const metricsKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
      const scoreKey = user?.id ? `future_you_${user.id}_lifestyle_score` : 'future_you_lifestyle_score';
      localStorage.setItem(metricsKey, JSON.stringify(latestDay));
      localStorage.setItem(scoreKey, JSON.stringify(sc.projected_score));

      // 4. Update local metrics
      setRecordedMetrics(latestDay);

      // 5. Reload weekly cycle directly from backend
      const refreshed = await fetchWeeklyCycle();
      if (refreshed) {
        setBackendCycleData(refreshed);
      }

      // 6. Reload streak data
      const streakRefreshed = await fetchStreakData();
      if (streakRefreshed) {
        setStreakData(streakRefreshed);
      }

      // 7. Broadcast event so Page 4 and simulation timeline re-render with new data & fresh LLM letter
      window.dispatchEvent(new CustomEvent('future-you-habits-updated', {
        detail: { metrics: latestDay, score: sc.projected_score }
      }));
    } catch (err) {
      console.error('Failed to switch scenario:', err);
    } finally {
      setIsSwitchingScenario(false);
    }
  };

  const loadWeeklyData = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchWeeklyCycle();
      const storageKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
      if (data) {
        setBackendCycleData(data);
        if (data.latest_metrics && data.total_logs > 0) {
          setRecordedMetrics(data.latest_metrics);
          try {
            localStorage.setItem(storageKey, JSON.stringify(data.latest_metrics));
          } catch (e) {}
        } else if (data.total_logs === 0) {
          setRecordedMetrics(null);
          try {
            localStorage.removeItem(storageKey);
          } catch (e) {}
        }
      }

      const streakRefreshed = await fetchStreakData();
      if (streakRefreshed) {
        setStreakData(streakRefreshed);
      } else if (!data || data.total_logs === 0) {
        setStreakData({ currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, streakStatus: 'none', todayLogged: false });
      }

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    } catch (err) {
      console.warn('Could not sync weekly cycle from backend:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadWeeklyData();
  }, [user?.id]);

  useEffect(() => {
    loadWeeklyData();

    // Listen to real-time habit adjustments across the application
    const handleHabitsUpdated = (e) => {
      if (e.detail?.isReset || e.detail?.isLogout) {
        setRecordedMetrics(null);
        setStreakData({ currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, streakStatus: 'none', todayLogged: false });
      } else if (e.detail?.metrics) {
        setRecordedMetrics(e.detail.metrics);
      }
      loadWeeklyData();
    };

    const handleWindowFocus = () => {
      loadWeeklyData();
    };

    window.addEventListener('future-you-habits-updated', handleHabitsUpdated);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('future-you-habits-updated', handleHabitsUpdated);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user?.id]);

  // Calculate Productivity Score (0 - 100) - Now uses historical Lifestyle Score from backend
  const computedScore = (() => {
    try {
      const scoreKey = user?.id ? `future_you_${user.id}_lifestyle_score` : 'future_you_lifestyle_score';
      const savedScore = localStorage.getItem(scoreKey);
      if (savedScore) return Number(savedScore);
    } catch (e) {}
    // No data logged yet - score is 0
    if (!recordedMetrics) return 0;
    const sleep = recordedMetrics.sleep || 0;
    const study = recordedMetrics.study || 0;
    const screen = recordedMetrics.screen || 0;
    const sleepScore = Math.min(100, (sleep / 8) * 100);
    const studyScore = Math.min(100, (study / 4) * 100);
    const screenScore = Math.max(10, 100 - Math.max(0, screen - 5) * 20);
    return Math.round(sleepScore * 0.3 + studyScore * 0.4 + screenScore * 0.3);
  })();

  // Use backend's historical Lifestyle Score as primary, fall back to computed local score
  const productivityScore = backendCycleData?.lifestyle_score ?? backendCycleData?.productivity_score ?? computedScore;

  // 1. Five Habit Indicators matching the 5 habits in Habit Breakdown
  const habitIndicators = [
    { id: 'sleep', label: 'Sleep', value: recordedMetrics ? `${(recordedMetrics.sleep ?? 0).toFixed(1)}h` : '0.0h', color: '#5568ba' },
    { id: 'study', label: 'Study', value: recordedMetrics ? `${(recordedMetrics.study ?? 0).toFixed(1)}h` : '0.0h', color: '#f2a738' },
    { id: 'screen', label: 'Screen', value: recordedMetrics ? `${(recordedMetrics.screen ?? 0).toFixed(1)}h` : '0.0h', color: '#cf5579' },
    { id: 'exercise', label: 'Exercise', value: recordedMetrics ? `${(recordedMetrics.exercise ?? 0).toFixed(1)}h` : '0.0h', color: '#b0572d' },
    { id: 'others', label: 'Others', value: recordedMetrics ? '4.3h' : '0.0h', color: '#478c66' },
  ];

  // Dynamic "What's Holding You Back?" insights derived from user's actual recorded habits
  const holdingBackInsights = (() => {
    const list = [];
    // No data logged yet - show placeholder insights encouraging first log
    if (!recordedMetrics) {
      return [
        {
          id: 'getting-started',
          text: 'Start tracking your habits to see personalized insights.',
          detail: 'No data logged yet',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )
        },
        {
          id: 'log-habits',
          text: 'Log your first day to unlock your digital twin.',
          detail: 'Tap "Adjust" to begin',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          )
        },
        {
          id: 'see-future',
          text: 'See your future self letter after logging habits.',
          detail: 'Requires habit data',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M22 7H2" />
              <path d="M22 17H2" />
            </svg>
          )
        },
        {
          id: 'build-streak',
          text: 'Build a daily streak by logging every day.',
          detail: '0 day streak',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        },
      ];
    }

    const sleep = recordedMetrics.sleep !== undefined ? recordedMetrics.sleep : 0;
    const screen = recordedMetrics.screen !== undefined ? recordedMetrics.screen : 0;
    const study = recordedMetrics.study !== undefined ? recordedMetrics.study : 0;
    const exercise = recordedMetrics.exercise !== undefined ? recordedMetrics.exercise : 0;
    const hydration = recordedMetrics.hydration !== undefined ? recordedMetrics.hydration : 0;

    // 1. Sleep consistency
    if (sleep < 7.0) {
      list.push({
        id: 'sleep',
        text: 'Your sleep consistency could improve.',
        detail: `${sleep}h logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )
      });
    }

    // 2. Screen time
    if (screen > 5.0) {
      list.push({
        id: 'screen',
        text: 'Screen time is higher than your target.',
        detail: `${screen}h logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#5a4231" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
          </svg>
        )
      });
    }

    // 3. Study routine
    if (study < 3.5) {
      list.push({
        id: 'study',
        text: 'Your study routine is inconsistent.',
        detail: `${study}h logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#5a4231" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        )
      });
    }

    // 4. Physical activity
    if (exercise < 0.8) {
      list.push({
        id: 'exercise',
        text: 'Physical activity needs attention.',
        detail: `${Math.round(exercise * 60)}m logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            <polyline points="9.5 12 11 10.5 12.5 13.5 14.5 12" />
          </svg>
        )
      });
    }

    // Fallback if needed
    if (list.length < 4 && hydration < 2.5) {
      list.push({
        id: 'hydration',
        text: 'Daily hydration is below target.',
        detail: `${hydration}L logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#205681" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        )
      });
    }

    // Default fallbacks to guarantee 4 insights matching user's requested examples
    if (list.length < 4 && !list.find(i => i.id === 'sleep')) {
      list.push({
        id: 'sleep-def',
        text: 'Your sleep consistency could improve.',
        detail: `${sleep}h logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )
      });
    }
    if (list.length < 4 && !list.find(i => i.id === 'screen')) {
      list.push({
        id: 'screen-def',
        text: 'Screen time is higher than your target.',
        detail: `${screen}h logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#5a4231" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
          </svg>
        )
      });
    }
    if (list.length < 4 && !list.find(i => i.id === 'study')) {
      list.push({
        id: 'study-def',
        text: 'Your study routine is inconsistent.',
        detail: `${study}h logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#5a4231" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        )
      });
    }
    if (list.length < 4 && !list.find(i => i.id === 'exercise')) {
      list.push({
        id: 'exercise-def',
        text: 'Physical activity needs attention.',
        detail: `${Math.round(exercise * 60)}m logged`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="#8b4a2e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            <polyline points="9.5 12 11 10.5 12.5 13.5 14.5 12" />
          </svg>
        )
      });
    }

    return list.slice(0, 4);
  })();

  // 2. Habit Breakdown Donut Data dynamically computed from live recorded metrics or cycle breakdown
  const donutData = (() => {
    // 1. Prioritize live recorded metrics so adjustments sync immediately in real-time with the line chart
    if (recordedMetrics) {
      const sleep = Number(recordedMetrics.sleep) || 0;
      const study = Number(recordedMetrics.study) || 0;
      const screen = Number(recordedMetrics.screen) || 0;
      const exercise = Number(recordedMetrics.exercise) || 0;
      const others = Math.max(0, 24 - (sleep + study + screen + exercise));
      const total = sleep + study + screen + exercise + others;

      if (total > 0) {
        let currentAngle = 0;
        const slices = [
          { id: 'sleep', label: 'Sleep', val: sleep, color: '#5568ba' },
          { id: 'study', label: 'Study', val: study, color: '#f2a738' },
          { id: 'screen', label: 'Screen Time', val: screen, color: '#cf5579' },
          { id: 'exercise', label: 'Exercise', val: exercise, color: '#b0572d' },
          { id: 'others', label: 'Others', val: others, color: '#478c66' },
        ];

        return slices.map((s) => {
          const percent = Math.round((s.val / total) * 100);
          const sliceAngle = (s.val / total) * 360;
          const start = currentAngle;
          const end = currentAngle + sliceAngle;
          currentAngle = end;
          return {
            id: s.id,
            label: s.label,
            percent,
            hours: `${s.val.toFixed(1)}h`,
            color: s.color,
            range: [start, end]
          };
        });
      }
    }

    // 2. Fallback to backend breakdown list if available
    if (backendCycleData?.breakdown_list && backendCycleData.breakdown_list.length > 0) {
      const totalPercent = backendCycleData.breakdown_list.reduce((sum, b) => sum + (Number(b.percentage) || 0), 0);
      if (totalPercent > 0) {
        let currentAngle = 0;
        return backendCycleData.breakdown_list.map((b) => {
          const pct = Number(b.percentage) || 0;
          const sliceAngle = (pct / totalPercent) * 360;
          const start = currentAngle;
          const end = currentAngle + sliceAngle;
          currentAngle = end;
          const id = b.label.toLowerCase().includes('screen') ? 'screen' : b.label.toLowerCase();
          return {
            id,
            label: b.label,
            percent: pct,
            hours: `${b.hours}h`,
            color: b.color || '#5568ba',
            range: [start, end]
          };
        });
      }
    }

    // No data logged yet - return empty/zero state
    return [
      { id: 'sleep', label: 'Sleep', percent: 0, hours: '0.0h', color: '#5568ba', range: [0, 0] },
      { id: 'study', label: 'Study', percent: 0, hours: '0.0h', color: '#f2a738', range: [0, 0] },
      { id: 'screen', label: 'Screen Time', percent: 0, hours: '0.0h', color: '#cf5579', range: [0, 0] },
      { id: 'exercise', label: 'Exercise', percent: 0, hours: '0.0h', color: '#b0572d', range: [0, 0] },
      { id: 'others', label: 'Others', percent: 0, hours: '0.0h', color: '#478c66', range: [0, 0] },
    ];
  })();

  // 2. Weekly Trend Multi-Line Data - Dynamic 7-Day Cycle from Backend
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const habitsList = useMemo(() => {
    // Generate realistic, organic 7-day variation based on active metric value
    const generateWeeklyData = (baseValue, variation = 0.25) => {
      return days.map((day, idx) => {
        const sineVariation = Math.sin((idx / 6) * Math.PI * 2) * variation * 0.5;
        const deterministicRandom = ((idx * 7 + 3) % 11) / 10 - 0.5;
        const randomVariation = deterministicRandom * variation * 0.3;
        const variationFactor = 1 + sineVariation + randomVariation;
        const val = Math.max(0, Math.round(baseValue * variationFactor * 10) / 10);
        return { day, val };
      });
    };

    // No data logged yet - return flat zero lines
    if (!recordedMetrics) {
      const zeroData = days.map(day => ({ day, val: 0 }));
      return [
        { id: 'sleep', label: 'Sleep', color: '#5568ba', gradId: 'sleepGrad', data: zeroData },
        { id: 'study', label: 'Study', color: '#f2a738', gradId: 'studyGrad', data: zeroData },
        { id: 'screen', label: 'Screen Time', shortLabel: 'Screen', color: '#cf5579', gradId: 'screenGrad', data: zeroData },
        { id: 'exercise', label: 'Exercise', color: '#b0572d', gradId: 'exerciseGrad', data: zeroData },
        { id: 'others', label: 'Others', color: '#478c66', gradId: 'othersGrad', data: zeroData },
      ];
    }

    const sleep = Number(recordedMetrics.sleep ?? 0);
    const study = Number(recordedMetrics.study ?? 0);
    const screen = Number(recordedMetrics.screen ?? 0);
    const exercise = Number(recordedMetrics.exercise ?? 0);
    const others = Math.max(0, 24 - (sleep + study + screen + exercise));

    return [
      {
        id: 'sleep',
        label: 'Sleep',
        color: '#5568ba',
        gradId: 'sleepGrad',
        data: generateWeeklyData(sleep, 0.2),
      },
      {
        id: 'study',
        label: 'Study',
        color: '#f2a738',
        gradId: 'studyGrad',
        data: generateWeeklyData(study, 0.35),
      },
      {
        id: 'screen',
        label: 'Screen Time',
        shortLabel: 'Screen',
        color: '#cf5579',
        gradId: 'screenGrad',
        data: generateWeeklyData(screen, 0.15),
      },
      {
        id: 'exercise',
        label: 'Exercise',
        color: '#b0572d',
        gradId: 'exerciseGrad',
        data: generateWeeklyData(exercise, 0.45),
      },
      {
        id: 'others',
        label: 'Others',
        color: '#478c66',
        gradId: 'othersGrad',
        data: generateWeeklyData(others, 0.1),
      },
    ];
  }, [recordedMetrics]);

  // Map for fast lookup
  const trendData = habitsList.reduce((acc, h) => {
    acc[h.id] = h.data;
    return acc;
  }, {});

  // Convert values to SVG coordinate points for full-page graph (Viewbox: 0 0 500 310)
  // Scaled with safe headroom up to 12h (y=22 at 12h, y=264 at 0h)
  const getX = (idx) => 62 + (idx / 6) * 398;
  const getY = (val) => 264 - (Math.min(13, Number(val)) / 12) * 242;

  // Catmull-Rom smooth cubic bezier curve generator
  const getSmoothPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    const points = pts.map((p, i) => ({ x: getX(i), y: getY(p.val) }));
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const getSmoothArea = (pts) => {
    const path = getSmoothPath(pts);
    return `${path} L ${getX(pts.length - 1).toFixed(1)} ${getY(0).toFixed(1)} L ${getX(0).toFixed(1)} ${getY(0).toFixed(1)} Z`;
  };

  return (
    <div className="relative w-screen h-screen min-h-[600px] overflow-hidden flex items-center justify-center select-none font-caacupe">
      
      {/* 1. WOOD DESK BACKGROUND WITH AMBIENT SUNLIGHT SHADOWS (Identical to Page 2) */}
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

      {/* 2. LUSH VIEWPORT FOLIAGE: Daisies, Cherry Blossoms, and Canopies (Identical to Page 2) */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-30 overflow-hidden transition-transform duration-700 ease-out"
        style={{
          transform: 'translate3d(calc(var(--mouse-x, 0) * -3.5px), calc(var(--mouse-y, 0) * -2.5px), 0)',
        }}
      >
        {/* Top-Left Hanging Leaf Canopy */}
        <div className="absolute -top-12 sm:-top-18 md:-top-22 -left-8 sm:-left-12 w-[40%] max-w-[580px] pointer-events-none select-none">
          <img 
            src="/assets/wind_leaves.png" 
            alt="Sunlit leaves canopy" 
            className="w-full h-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)] rotate-[-3deg]"
          />
        </div>

        {/* Top-Right Hanging Leaf Canopy */}
        <div className="absolute -top-12 sm:-top-18 md:-top-22 -right-8 sm:-right-12 w-[40%] max-w-[580px] pointer-events-none select-none">
          <img 
            src="/assets/wind_leaves.png" 
            alt="Sunlit leaves canopy" 
            className="w-full h-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.7)] scale-x-[-1] rotate-[4deg]"
          />
        </div>

        {/* Left Viewport Border Botanical Daisies & Branch */}
        <div className="absolute -left-6 sm:-left-8 top-[18%] w-32 sm:w-44 md:w-56 pointer-events-none select-none">
          <img 
            src="/assets/foliage_left_natural.png" 
            alt="Left botanical foliage" 
            className="w-full h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] opacity-90"
          />
        </div>

        {/* Right Viewport Border Botanical Daisies & Branch */}
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

      {/* 3. THE BIG OPEN JOURNAL (Desktop Spread >= lg in Landscape) */}
      <div 
        className="hidden lg:landscape:flex relative z-10 w-[96vw] max-w-[1850px] aspect-[1.84/1] max-h-[94vh] items-center justify-center transition-transform duration-500 ease-out"
        style={{
          transform: 'translate3d(calc(var(--mouse-x, 0) * 3px), calc(var(--mouse-y, 0) * 2px), 0)',
        }}
      >
        {/* Wide Unfolded Open Book Graphic matching Page 2 */}
        <img 
          src="/assets/open_book_wide.png" 
          alt="Open Journal" 
          className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_28px_60px_rgba(0,0,0,0.88)]"
        />

        {/* Subtle center binding crease shadow */}
        <div className="absolute left-1/2 top-[6%] -translate-x-1/2 w-[2.2%] h-[88%] bg-gradient-to-r from-black/10 via-black/20 to-black/10 blur-[1px] pointer-events-none z-20" />

        {/* ============================================================== */}
        {/* LEFT PAGE SPREAD: "Your Potential in Progress"                 */}
        {/* ============================================================== */}
        <div className="absolute left-[8%] sm:left-[8.5%] md:left-[9%] top-[7%] sm:top-[8%] md:top-[8.5%] w-[40%] sm:w-[39%] md:w-[38%] max-w-[480px] h-[84%] sm:h-[82%] flex flex-col justify-start items-center gap-1.5 z-10 select-none overflow-visible pl-1 pr-2 pb-1">
          
          {/* Header Block: Grouped Rows 1 & 2 with enhanced sizing, hero score, and transparent backgrounds */}
          <div className="w-full flex flex-col gap-1 shrink-0">
            {/* Row 1: Journal Title & Symmetrical Potential Score (Zero Overlap with Right Page) */}
            <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 pb-1 border-b border-[#8e6e53]/20 shrink-0 select-none">
              {/* Left: Prominent Journal Heading + Sleek Refresh Sync Icon */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <h2 className="font-handwriting text-xl sm:text-2xl md:text-[27px] font-black text-[#2c180c] leading-none tracking-wide">
                  7-Day Habit Cycle
                </h2>
                {/* Dynamic Compact Sync Backend Icon */}
                <button
                  type="button"
                  onClick={loadWeeklyData}
                  disabled={isSyncing}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border text-[10px] sm:text-[11px] font-serif font-black transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs hover:scale-105 active:scale-95 ${
                    syncSuccess
                      ? 'bg-emerald-800/15 text-emerald-900 border-emerald-800/60'
                      : isSyncing
                      ? 'bg-[#8e6e53]/25 text-[#2c180c] border-[#8e6e53]/60 cursor-wait'
                      : 'bg-transparent hover:bg-[#8e6e53]/15 border-[#8e6e53]/45 text-[#2c180c]'
                  }`}
                  title={syncSuccess ? 'Backend synchronized!' : isSyncing ? 'Syncing...' : 'Click to retrieve & sync data from backend'}
                >
                  <span className={isSyncing ? 'animate-spin inline-block' : ''}>
                    {syncSuccess ? '✓' : '↻'}
                  </span>
                </button>
              </div>

              {/* Right: Enlarged Potential Score, Clean Stamped Badge & Action */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Hero Potential Score */}
                <div className="flex items-baseline gap-0.5 shrink-0">
                  <span className="font-serif text-[10px] sm:text-[11px] font-black text-[#6d4b24] uppercase tracking-wider">
                    Score:
                  </span>
                  <span className="font-mono text-xl sm:text-2xl md:text-3xl font-black text-[#1e3a8a] leading-none drop-shadow-2xs">
                    {productivityScore}
                  </span>
                  <span className="text-[10px] sm:text-xs font-serif font-bold text-[#7c583b]">
                    /100
                  </span>
                </div>

                {/* Transparent Status Stamp */}
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-serif font-black tracking-wide border shadow-2xs whitespace-nowrap shrink-0 ${
                  productivityScore >= 75
                    ? 'bg-transparent text-[#243d26] border-emerald-800/40'
                    : productivityScore >= 50
                    ? 'bg-transparent text-[#6d4b24] border-amber-800/40'
                    : 'bg-transparent text-[#8b3d24] border-red-800/40'
                }`}>
                  {productivityScore >= 75 ? '✦ Optimal' : productivityScore >= 50 ? '✦ Balanced' : '⚠ Drift'}
                </span>

                {/* Subtle Streak Badge in Header */}
                {streakData && streakData.currentStreak > 0 && (
                  <span className="text-[9.5px] sm:text-[11px] font-serif font-black text-[#8b3d24] flex items-center gap-0.5 shrink-0 px-1.5 sm:px-2 py-0.5 rounded-full border border-[#8e6e53]/35" title={`${streakData.currentStreak} day current streak`}>
                    <span>🔥</span>
                    <span>{streakData.currentStreak}d</span>
                  </span>
                )}

                {/* Transparent Adjust Action Button */}
                <button
                  type="button"
                  onClick={() => setIsDatasetAdjusterOpen(true)}
                  className="px-1.5 sm:px-2 py-0.5 rounded-full bg-transparent hover:bg-[#8e6e53]/15 border border-[#8e6e53]/45 text-[9.5px] sm:text-[11px] font-serif font-black text-[#2c180c] transition-all cursor-pointer flex items-center gap-0.5 shadow-2xs hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap"
                  title="Click to fine-tune habit numbers"
                >
                  <span>⚡</span>
                  <span>Adjust</span>
                </button>
              </div>
            </div>

            {/* Row 2: Interactive Scenarios Switcher (Clean, Transparent & Perfectly Spaced) */}
            <div className="w-full flex items-center justify-start py-1 border-b border-[#8e6e53]/25 shrink-0 select-none">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs sm:text-[12px] font-serif font-black uppercase tracking-wider text-[#6d4b24] whitespace-nowrap">
                  Scenarios:
                </span>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {demoScenariosData.scenarios.map((sc) => {
                    const isSelected = activeScenarioId === sc.id;
                    const icon = sc.id.includes('burnout') ? '⚠' : sc.id.includes('achiever') ? '✦' : sc.id.includes('exam') ? '📚' : '⚖';
                    const label = sc.id.includes('burnout') ? 'Burnout' : sc.id.includes('achiever') ? 'Achiever' : sc.id.includes('exam') ? 'Exam Sprint' : 'Baseline';
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        disabled={isSwitchingScenario}
                        onClick={() => handleQuickScenario(sc)}
                        className={`px-2.5 py-0.5 rounded-full text-xs sm:text-[12px] font-sans transition-all cursor-pointer flex items-center gap-1 border whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#2c180c] text-[#fce8ba] border-[#2c180c] shadow-2xs scale-102 font-black ring-1 ring-[#2c180c]/30'
                            : 'bg-transparent hover:bg-[#8e6e53]/15 text-[#3a2010] border-[#8e6e53]/40 font-bold'
                        }`}
                        title={`${sc.name}: ${sc.tagline}`}
                      >
                        <span className="text-xs">{icon}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Full-Page SVG Line Chart Viewport - Snug beneath header */}
          <div className="relative w-full flex-1 flex flex-col items-center justify-start pt-1 pb-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 310" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5568ba" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#5568ba" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f2a738" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f2a738" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cf5579" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#cf5579" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="exerciseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b0572d" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#b0572d" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="othersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#478c66" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#478c66" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Dashed Gridlines & Deep Prussian Navy Y-Axis Labels */}
              {[12, 10, 8, 6, 4, 2, 0].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <text x="48" y={y + 4.5} textAnchor="end" className="text-[12px] sm:text-[12.5px] font-sans font-black fill-[#1e3a8a]">
                      {val}h
                    </text>
                    <line 
                      x1="62" 
                      y1={y} 
                      x2="466" 
                      y2={y} 
                      stroke={val === 0 ? "#1e3a8a" : "#7c583b"} 
                      strokeWidth={val === 0 ? "2" : "1"} 
                      strokeDasharray={val === 0 ? "none" : "5,5"} 
                      opacity={val === 0 ? 0.95 : 0.28} 
                    />
                  </g>
                );
              })}

              {/* Vertical Y-axis line on left */}
              <line x1="62" y1={getY(12)} x2="62" y2={getY(0)} stroke="#1e3a8a" strokeWidth="2" opacity="0.95" />

              {/* Transparent Wash Area Fills - Only when series is explicitly active */}
              {habitsList.map((h) => {
                const isSelected = activeSeriesFilter === h.id;
                if (!isSelected) return null;
                return (
                  <path
                    key={`area-${h.id}`}
                    d={getSmoothArea(h.data)}
                    fill={`url(#${h.gradId})`}
                    opacity={0.35}
                    className="transition-opacity duration-300"
                  />
                );
              })}

              {/* Vertical Day Guide Line when a day is hovered */}
              {hoveredDayIdx !== null && (
                <line 
                  x1={getX(hoveredDayIdx)} 
                  y1={getY(12)} 
                  x2={getX(hoveredDayIdx)} 
                  y2={getY(0)} 
                  stroke="#1e3a8a" 
                  strokeWidth="1.8" 
                  strokeDasharray="3,3" 
                  opacity="0.65" 
                />
              )}

              {/* Data Lines & Points for all habits with Smooth Curves */}
              {habitsList.map((h) => {
                const isSelected = activeSeriesFilter === h.id;
                const isDimmed = activeSeriesFilter && !isSelected;
                const strokeWidth = isSelected ? 4.8 : isDimmed ? 1.8 : 3.4;
                const opacity = isDimmed ? 0.2 : 1;
                const smoothPath = getSmoothPath(h.data);

                return (
                  <g key={`series-${h.id}`} className="transition-opacity duration-300" opacity={opacity}>
                    <path
                      d={smoothPath}
                      fill="none"
                      stroke={h.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {h.data.map((pt, i) => {
                      const isHoveredDay = hoveredDayIdx === i;
                      const isHoveredPoint = hoveredTrendPoint?.series === h.id && hoveredTrendPoint?.index === i;
                      const r = isHoveredPoint ? 8.5 : isHoveredDay ? 7 : 5;

                      return (
                        <g key={`pt-${h.id}-${i}`}>
                          {(isHoveredDay || isHoveredPoint) && (
                            <circle
                              cx={getX(i)}
                              cy={getY(pt.val)}
                              r={r + 5}
                              fill="none"
                              stroke={h.color}
                              strokeWidth="2"
                              opacity="0.4"
                            />
                          )}
                          <circle
                            cx={getX(i)}
                            cy={getY(pt.val)}
                            r={r}
                            fill="#fbf7ef"
                            stroke={h.color}
                            strokeWidth={isSelected || isHoveredPoint ? "3.2" : "2.6"}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => {
                              setHoveredDayIdx(i);
                              setHoveredTrendPoint({ series: h.id, label: h.label, color: h.color, val: pt.val, day: pt.day, index: i });
                            }}
                            onMouseLeave={() => setHoveredTrendPoint(null)}
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* X-Axis Vertical Day Ticks and Deep Prussian Navy Day Labels */}
              {days.map((day, idx) => {
                const x = getX(idx);
                const isDayHovered = hoveredDayIdx === idx;
                return (
                  <g 
                    key={day}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                  >
                    <line x1={x} y1={getY(0)} x2={x} y2={getY(0) + 6} stroke="#1e3a8a" strokeWidth={isDayHovered ? "2.5" : "2"} opacity={isDayHovered ? 1 : 0.9} />
                    {isDayHovered && (
                      <rect 
                        x={x - 18} 
                        y={getY(0) + 12} 
                        width="36" 
                        height="18" 
                        rx="4" 
                        fill="#1e3a8a" 
                        opacity="0.18" 
                      />
                    )}
                    <text 
                      x={x} 
                      y={getY(0) + 24} 
                      textAnchor="middle" 
                      className={`font-sans ${isDayHovered ? 'text-[14px] font-black fill-[#1e3a8a]' : 'text-[13px] font-extrabold fill-[#1e3a8a]'}`}
                    >
                      {day}
                    </text>
                  </g>
                );
              })}

              {/* Transparent full-column hover triggers across each day */}
              {days.map((day, idx) => {
                const x = getX(idx);
                const colWidth = 398 / 6;
                return (
                  <rect
                    key={`trigger-${day}`}
                    data-day={day}
                    x={x - colWidth / 2}
                    y="25"
                    width={colWidth}
                    height="240"
                    fill="rgba(0,0,0,0.001)"
                    pointerEvents="all"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredDayIdx(idx)}
                    onMouseLeave={() => setHoveredDayIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Direct Point Tooltip (Micro Badge over hovered node - Zero Background Tint) */}
            {hoveredTrendPoint && (
              <div 
                className="absolute pointer-events-none z-50 px-2.5 py-1 rounded-full border bg-transparent transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(getX(hoveredTrendPoint.index) / 500) * 100}%`,
                  top: `${Math.max(6, (getY(hoveredTrendPoint.val) / 310) * 100 - 5)}%`,
                  borderColor: hoveredTrendPoint.color,
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: hoveredTrendPoint.color }} />
                <span className="font-handwriting text-sm font-bold text-[#2c180c]">
                  {hoveredTrendPoint.label}:
                </span>
                <span className="font-mono text-xs font-black" style={{ color: hoveredTrendPoint.color }}>
                  {hoveredTrendPoint.val.toFixed(1)}h
                </span>
                <span className="text-[10px] text-[#7c583b] font-sans font-bold">
                  ({hoveredTrendPoint.day})
                </span>
              </div>
            )}

            {/* Floating Day Inspection Note ("hover in the page") — Transparent Natural Ink on Parchment */}
            {hoveredDayIdx !== null && (
              <div 
                className={`absolute pointer-events-none top-6 sm:top-8 px-3 py-2 rounded-lg border border-[#8e6e53]/35 bg-transparent z-30 transition-all duration-200 animate-in fade-in zoom-in-95 ${
                  hoveredDayIdx <= 1 ? '-translate-x-[15%]' : hoveredDayIdx >= 5 ? '-translate-x-[85%]' : '-translate-x-1/2'
                }`}
                style={{
                  left: `${(getX(hoveredDayIdx) / 500) * 100}%`,
                }}
              >
                {/* Card Header */}
                <div className="flex items-baseline justify-between gap-3 border-b border-[#8e6e53]/25 pb-1 mb-1 min-w-[135px]">
                  <span className="font-handwriting text-xl font-black text-[#2c180c] leading-none">
                    {days[hoveredDayIdx]}
                  </span>
                  <span className="text-[10px] font-sans font-bold text-[#7c583b]">
                    Total: {habitsList.reduce((sum, h) => sum + h.data[hoveredDayIdx].val, 0).toFixed(1)}h
                  </span>
                </div>

                {/* Metrics Breakdown for all 5 habits */}
                <div className="flex flex-col gap-1 text-[11px] font-sans font-bold">
                  {habitsList.map((h) => (
                    <div key={`hover-${h.id}`} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-[#3a2010]">
                        <span className="w-2 h-2 rounded-full shadow-xs" style={{ backgroundColor: h.color }} />
                        {h.label}:
                      </span>
                      <span className="font-mono text-[#2c180c]">{h.data[hoveredDayIdx].val.toFixed(1)}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ============================================================== */}
        {/* RIGHT PAGE SPREAD: Centered, intimate gap, increased size     */}
        {/* Holds: "Your Habit Breakdown" & "Key Insights"                 */}
        {/* ============================================================== */}
        <div className="absolute left-[52.5%] sm:left-[53%] md:left-[53.5%] top-[6.5%] sm:top-[7.5%] md:top-[8%] w-[42%] sm:w-[40%] md:w-[38%] max-w-[490px] h-[86%] sm:h-[84%] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 z-10 select-none overflow-visible py-1">
          
          {/* Top Section: "Your Habit Breakdown" (Enlarged Donut Chart, Snug Spacing, Responsive) */}
          <div className="w-full max-w-[460px] md:max-w-[490px] mx-auto flex flex-col gap-1.5 sm:gap-2 select-none px-1">
            
            {/* Title with underline */}
            <div className="pb-1 border-b border-[#8e6e53]/25 shrink-0">
              <h2 className="font-handwriting text-2xl sm:text-[27px] md:text-3xl font-bold text-[#2c180c] leading-tight">
                Your Habit Breakdown
              </h2>
            </div>

            {/* Donut Chart & Legend Row - Enlarged, Snug Gap, Fully Responsive */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5 py-1">
              
              {/* Prominent, Substantially Enlarged Pie / Donut Chart */}
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 160 160">
                  {/* Rotated Slices or Empty Placeholder */}
                  {(!recordedMetrics || donutData.every(d => d.percent === 0)) ? (
                    <g className="pointer-events-none select-none">
                      <circle
                        cx="80"
                        cy="80"
                        r="63"
                        fill="none"
                        stroke="#8e6e53"
                        strokeWidth="28"
                        strokeDasharray="4 4"
                        opacity="0.3"
                      />
                      <text x="80" y="74" textAnchor="middle" className="font-handwriting text-[16px] font-bold fill-[#5c3a22]">
                        No Data
                      </text>
                      <text x="80" y="91" textAnchor="middle" className="font-sans text-[11px] font-bold fill-[#8e6e53]">
                        Log Day 1
                      </text>
                    </g>
                  ) : (
                    <>
                      <g transform="rotate(-90 80 80)">
                        {donutData.map((slice) => {
                          if (slice.range[1] - slice.range[0] < 1) return null;
                          const isHighlighted = hoveredSlice === slice.id || (!hoveredSlice && activeSeriesFilter === slice.id);
                          const path = getDonutSlicePath(80, 80, 48, isHighlighted ? 81 : 78, slice.range[0], slice.range[1]);
                          if (!path) return null;
                          return (
                            <path
                              key={slice.id}
                              d={path}
                              fill={slice.color}
                              className="cursor-pointer transition-all duration-200"
                              onMouseEnter={() => setHoveredSlice(slice.id)}
                              onMouseLeave={() => setHoveredSlice(null)}
                              onClick={() => setActiveSeriesFilter(activeSeriesFilter === slice.id ? null : slice.id)}
                            />
                          );
                        })}
                      </g>

                      {/* Center Hole Text - 100% Enclosed within inner circle, zero overlap with slices */}
                      {(hoveredSlice || activeSeriesFilter) ? (
                        (() => {
                          const activeId = hoveredSlice || activeSeriesFilter;
                          const item = donutData.find(d => d.id === activeId);
                          return (
                            <g className="pointer-events-none select-none">
                              <text x="80" y="65" textAnchor="middle" className="font-sans text-[9px] font-black fill-[#7c5638]">
                                {item?.label?.toUpperCase()}
                              </text>
                              <text x="80" y="86" textAnchor="middle" className="font-sans text-[22px] font-black fill-[#2c180c]">
                                {item?.percent}%
                              </text>
                              <text x="80" y="101" textAnchor="middle" className="font-sans text-[10px] font-bold fill-[#5c3a22]">
                                {item?.hours}
                              </text>
                            </g>
                          );
                        })()
                      ) : (
                        <g className="pointer-events-none select-none">
                          <text x="80" y="73" textAnchor="middle" className="font-handwriting text-[20px] font-bold fill-[#2c180c]">
                            Daily
                          </text>
                          <text x="80" y="94" textAnchor="middle" className="font-handwriting text-[20px] font-bold fill-[#2c180c]">
                            Routine
                          </text>
                        </g>
                      )}
                    </>
                  )}
                </svg>
              </div>

              {/* Data Legend - Enlarged Typography, Snug to Chart, Fully Responsive */}
              <div className="flex flex-col justify-center space-y-1 sm:space-y-1.5 md:space-y-2 w-auto shrink-0 min-w-0 bg-transparent">
                {donutData.map((item) => {
                  const isItemHighlighted = hoveredSlice === item.id || (!hoveredSlice && activeSeriesFilter === item.id);
                  return (
                    <div 
                      key={item.id}
                      onMouseEnter={() => setHoveredSlice(item.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => setActiveSeriesFilter(activeSeriesFilter === item.id ? null : item.id)}
                      className={`flex items-center justify-between gap-2.5 sm:gap-3 px-1.5 py-0.5 sm:py-1 rounded-md cursor-pointer transition-all bg-transparent ${
                        isItemHighlighted ? 'scale-[1.02] border-b border-[#8c6b4f]/60' : 'hover:bg-[#8e6e53]/10'
                      }`}
                      title={`Click to spotlight ${item.label}`}
                    >
                      <div className="flex items-center gap-2 shrink-0 min-w-0">
                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                        <span className="font-handwriting text-base sm:text-lg md:text-xl font-bold text-[#2c180c] whitespace-nowrap">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1.5 bg-transparent">
                        <span className="font-sans text-xs sm:text-sm md:text-base font-bold text-[#6d4b24]">
                          {item.hours}
                        </span>
                        <span className="font-sans text-xs sm:text-sm md:text-base font-black text-[#2c180c] w-8 sm:w-9 text-right">
                          {item.percent}%
                        </span>

                        {/* Interactive Real-Time Stepper Controls */}
                        {item.id !== 'others' && (
                          <div className="flex items-center gap-0.5 sm:gap-1 ml-0.5 bg-transparent">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHabitDelta(item.id, -0.5);
                              }}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-transparent hover:bg-[#8c6b4f]/20 border border-[#8c6b4f]/50 text-[#2c180c] text-xs font-black flex items-center justify-center transition-all cursor-pointer active:scale-90"
                              title={`Decrease ${item.label} by 0.5h (Line & Pie Chart update immediately)`}
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleHabitDelta(item.id, +0.5);
                              }}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-transparent hover:bg-[#8c6b4f]/20 border border-[#8c6b4f]/50 text-[#2c180c] text-xs font-black flex items-center justify-center transition-all cursor-pointer active:scale-90"
                              title={`Increase ${item.label} by 0.5h (Line & Pie Chart update immediately)`}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Bottom Section: "What's Holding You Back?" (Key Insights - Brought Closer, Enlarged, Responsive) */}
          <div className="w-full max-w-[460px] md:max-w-[490px] mx-auto flex flex-col gap-1.5 sm:gap-2 select-none px-1">
            
            {/* Header: "What's Holding You Back?" with underline matching Habit Breakdown */}
            <div className="pb-1 border-b border-[#8e6e53]/25 shrink-0">
              <h2 className="font-handwriting text-2xl sm:text-[27px] md:text-3xl font-bold text-[#2c180c] leading-tight">
                What's Holding You Back?
              </h2>
            </div>

            {/* Dynamic Insight Rows with Enlarged Typography & Comfortable Spacing */}
            <div className="flex flex-col space-y-1 sm:space-y-1.5 md:space-y-2 py-0.5">
              {holdingBackInsights.map((insight) => {
                const isMatched = activeSeriesFilter && insight.id?.startsWith(activeSeriesFilter);
                return (
                  <div 
                    key={insight.id} 
                    className={`flex items-center justify-between gap-3 min-w-0 px-2 py-1 sm:py-1.5 rounded-md transition-all bg-transparent ${
                      isMatched ? 'scale-[1.01] border-b border-[#8c6b4f]/50' : 'hover:bg-[#8e6e53]/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0 text-base sm:text-lg">
                        {insight.icon}
                      </div>
                      <span className="font-handwriting text-base sm:text-lg md:text-[19px] font-bold text-[#2c180c] leading-snug">
                        {insight.text}
                      </span>
                    </div>
                    {insight.detail && (
                      <span className="font-sans text-xs sm:text-sm md:text-base font-bold text-[#8b4a2e] shrink-0 pl-2">
                        {insight.detail}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* MOBILE JOURNAL VIEW (< lg or Portrait) */}
      <div className="lg:landscape:hidden relative z-20 w-[94vw] max-w-[440px] sm:max-w-[500px] h-[84vh] max-h-[720px] bg-[#f7eedc] border-2 border-[#8c6b4f]/70 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between p-3.5 overflow-y-auto parchment-scroll select-none">
        
        {/* Mobile Header Tabs */}
        <div className="flex items-center justify-center p-1 rounded-full bg-[#ebd8c0]/90 border border-[#8e6e53]/40 mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('cycle')}
            className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
              mobileTab === 'cycle'
                ? 'bg-[#2b180d] text-[#faedd4] shadow-xs'
                : 'text-[#5c3a22] hover:text-[#2b180d]'
            }`}
          >
            📈 7-Day Habit Cycle
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('breakdown')}
            className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
              mobileTab === 'breakdown'
                ? 'bg-[#2b180d] text-[#faedd4] shadow-xs'
                : 'text-[#5c3a22] hover:text-[#2b180d]'
            }`}
          >
            🍩 Habits & Insights
          </button>
        </div>

        {/* Tab 1: 7-Day Cycle */}
        {mobileTab === 'cycle' ? (
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* Header: Title + Score */}
            <div className="flex items-center justify-between pb-1 border-b border-[#8e6e53]/20 shrink-0">
              <h2 className="font-handwriting text-2xl font-bold text-[#2c180c] leading-none">
                7-Day Habit Cycle
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-[11px] font-bold text-[#6d4b24]">Score:</span>
                <span className="font-mono text-xl font-black text-[#1e3a8a]">{productivityScore}</span>
                <span className="text-[10px] font-serif text-[#7c583b]">/100</span>
              </div>
            </div>

            {/* Scenarios Quick Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
              {(demoScenariosData?.scenarios || []).map((sc) => {
                const isActive = activeScenarioId === sc.id;
                const icon = sc.id.includes('burnout') ? '⚠' : sc.id.includes('achiever') ? '✦' : sc.id.includes('exam') ? '📚' : '⚖';
                const label = sc.id.includes('burnout') ? 'Burnout' : sc.id.includes('achiever') ? 'Achiever' : sc.id.includes('exam') ? 'Exam Sprint' : 'Baseline';
                return (
                  <button
                    key={sc.id}
                    type="button"
                    disabled={isSwitchingScenario}
                    onClick={() => handleQuickScenario(sc)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-sans font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                      isActive 
                        ? 'bg-[#24130a] text-[#f8ecd5] border-[#24130a]' 
                        : 'bg-transparent text-[#5c3a22] border-[#8e6e53]/30 hover:border-[#8e6e53]/60'
                    }`}
                  >
                    <span>{icon}</span> {label}
                  </button>
                );
              })}
            </div>

            {/* Interactive Responsive SVG Line Chart */}
            <div className="relative w-full aspect-[490/280] my-auto">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 490 280">
                {/* Horizontal Gridlines & Y-Axis */}
                {[12, 9, 6, 3, 0].map((val) => {
                  const y = getY(val);
                  return (
                    <g key={val}>
                      <text x="36" y={y + 4} textAnchor="end" className="text-[11px] font-sans font-black fill-[#1e3a8a]">
                        {val}h
                      </text>
                      <line x1="44" y1={y} x2="476" y2={y} stroke="#7c583b" strokeWidth="0.8" strokeDasharray="4,4" opacity="0.3" />
                    </g>
                  );
                })}

                {/* Habits Lines & Points */}
                {habitsList.map((h) => {
                  return (
                    <g key={h.id}>
                      <path d={getSmoothPath(h.data)} fill="none" stroke={h.color} strokeWidth="3" strokeLinecap="round" />
                      {h.data.map((pt, i) => (
                        <circle
                          key={i}
                          cx={getX(i)}
                          cy={getY(pt.val)}
                          r="4"
                          fill="#ffffff"
                          stroke={h.color}
                          strokeWidth="2.5"
                          className="cursor-pointer"
                          onClick={() => setHoveredDayIdx(hoveredDayIdx === i ? null : i)}
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Day Labels along bottom */}
                {days.map((day, i) => (
                  <text
                    key={day}
                    x={getX(i)}
                    y="272"
                    textAnchor="middle"
                    className={`text-[12px] font-sans font-black cursor-pointer ${hoveredDayIdx === i ? 'fill-[#1e3a8a] underline font-extrabold' : 'fill-[#6d4b24]'}`}
                    onClick={() => setHoveredDayIdx(hoveredDayIdx === i ? null : i)}
                  >
                    {day}
                  </text>
                ))}
              </svg>
            </div>

            {/* Tap-selected Day Details or Hint */}
            <div className="p-2 rounded-xl bg-[#ebd8c0]/40 border border-[#8e6e53]/30 text-center shrink-0">
              {hoveredDayIdx !== null ? (
                <div className="flex items-center justify-around text-xs font-sans font-bold text-[#2c180c]">
                  <span className="font-serif font-black">{days[hoveredDayIdx]}:</span>
                  {habitsList.map(h => (
                    <span key={h.id} style={{ color: h.color }}>
                      {h.label.slice(0, 3)}: {h.data[hoveredDayIdx]?.val?.toFixed(1) ?? '0.0'}h
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] font-serif text-[#6d4b24] font-medium">
                  Tap any day point to inspect exact hours
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileTab('breakdown')}
              className="w-full py-2.5 mt-2 rounded-full bg-[#24130a] text-[#f7eed6] text-xs font-serif font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>View Breakdown & Insights</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          /* Tab 2: Breakdown & Insights */
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* Top Donut & Legend */}
            <div>
              <h2 className="font-handwriting text-2xl font-bold text-[#2c180c] text-center mb-1">
                Your Habit Breakdown
              </h2>
              <div className="flex items-center justify-center gap-3 py-1">
                {/* Donut Chart */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 160 160">
                    <g transform="rotate(-90 80 80)">
                      {donutData.map((slice) => {
                        if (slice.range[1] - slice.range[0] < 1) return null;
                        const path = getDonutSlicePath(80, 80, 48, 78, slice.range[0], slice.range[1]);
                        if (!path) return null;
                        return (
                          <path
                            key={slice.id}
                            d={path}
                            fill={slice.color}
                            onClick={() => setActiveSeriesFilter(activeSeriesFilter === slice.id ? null : slice.id)}
                          />
                        );
                      })}
                    </g>
                    <g className="pointer-events-none select-none">
                      <text x="80" y="76" textAnchor="middle" className="font-handwriting text-[17px] font-bold fill-[#2c180c]">
                        Daily
                      </text>
                      <text x="80" y="95" textAnchor="middle" className="font-handwriting text-[17px] font-bold fill-[#2c180c]">
                        Routine
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Legend with Stepper Buttons */}
                <div className="flex flex-col space-y-1">
                  {donutData.slice(0, 4).map(item => (
                    <div key={item.id} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-handwriting text-sm font-bold text-[#2c180c] w-16 truncate">{item.label}</span>
                      <span className="font-mono text-[11px] font-bold text-[#6d4b24]">{item.hours}</span>
                      <span className="font-mono text-[11px] font-black text-[#2c180c]">{item.percent}%</span>
                      {item.id !== 'others' && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleHabitDelta(item.id, -0.5)}
                            className="w-4 h-4 rounded bg-[#8c6b4f]/20 text-[#2c180c] text-[10px] font-black flex items-center justify-center cursor-pointer active:scale-90"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() => handleHabitDelta(item.id, +0.5)}
                            className="w-4 h-4 rounded bg-[#8c6b4f]/20 text-[#2c180c] text-[10px] font-black flex items-center justify-center cursor-pointer active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Insights List */}
            <div className="pt-2 border-t border-[#8e6e53]/20">
              <h3 className="font-handwriting text-xl font-bold text-[#2c180c] mb-1">
                What's Holding You Back?
              </h3>
              <div className="flex flex-col space-y-1">
                {holdingBackInsights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm shrink-0">{insight.icon}</span>
                      <span className="font-handwriting text-sm font-bold text-[#2c180c] truncate">{insight.text}</span>
                    </div>
                    {insight.detail && (
                      <span className="font-sans text-[11px] font-bold text-[#8b4a2e] shrink-0 pl-1">{insight.detail}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Proceed to Page 4 */}
            {onScrollToNext && (
              <button
                type="button"
                onClick={onScrollToNext}
                className="w-full py-2.5 mt-2 rounded-full bg-[#24130a] text-[#f7eed6] text-xs font-serif font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Proceed to Future Scenarios (Page 4)</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}

        {/* Mobile Bottom Quick Return Pill */}
        <div className="flex items-center justify-between pt-1.5 border-t border-[#8e6e53]/20 text-[11px] font-serif font-bold text-[#5c3a22]">
          <button 
            type="button" 
            onClick={onScrollToPage2}
            className="hover:text-[#24130a] flex items-center gap-1 cursor-pointer"
          >
            <span>↑</span>
            <span>Journal (Page 2)</span>
          </button>
          {onScrollToNext && (
            <button 
              type="button" 
              onClick={onScrollToNext}
              className="hover:text-[#24130a] flex items-center gap-1 cursor-pointer"
            >
              <span>Future (Page 4)</span>
              <span>↓</span>
            </button>
          )}
        </div>

      </div>

      {/* Floating Return Controls (Bottom Right) - Desktop Landscape Only */}
      <div className="hidden lg:landscape:flex absolute right-3.5 sm:right-5 bottom-3 sm:bottom-4 z-40 items-center gap-2 select-none">
        {onScrollToNext && (
          <button
            type="button"
            onClick={onScrollToNext}
            className="px-3.5 py-1.5 rounded-full bg-[#2a170c]/85 hover:bg-[#3d2414] text-[#faebd7] hover:text-[#ffd977] border border-[#b59976]/70 hover:border-[#deb15c] shadow-[0_4px_14px_rgba(30,15,5,0.35)] backdrop-blur-md font-serif font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer group"
            title="Scroll forward to Page 4 (Consequences & Future Self)"
          >
            <span className="transition-transform group-hover:translate-y-0.5">↓</span>
            <span>Scenarios</span>
          </button>
        )}

        <button
          type="button"
          onClick={onScrollToPage2}
          className="px-3.5 py-1.5 rounded-full bg-[#2a170c]/85 hover:bg-[#3d2414] text-[#faebd7] hover:text-[#ffd977] border border-[#b59976]/70 hover:border-[#deb15c] shadow-[0_4px_14px_rgba(30,15,5,0.35)] backdrop-blur-md font-serif font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer group"
          title="Scroll back to Page 2 (Journal)"
        >
          <span className="transition-transform group-hover:-translate-y-0.5">↑</span>
          <span>Journal</span>
        </button>

        <button
          type="button"
          onClick={onScrollToHome}
          className="px-3.5 py-1.5 rounded-full bg-[#2a170c]/85 hover:bg-[#3d2414] text-[#faebd7] hover:text-[#ffd977] border border-[#b59976]/70 hover:border-[#deb15c] shadow-[0_4px_14px_rgba(30,15,5,0.35)] backdrop-blur-md font-serif font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer group"
          title="Scroll back to Cover (Desk Scene)"
        >
          <span>Top</span>
          <span className="transition-transform group-hover:-translate-y-0.5">↑</span>
        </button>
      </div>

      {/* Live Dataset & Demonstration Adjuster Modal */}
      <LiveDatasetAdjusterModal
        isOpen={isDatasetAdjusterOpen}
        onClose={() => setIsDatasetAdjusterOpen(false)}
        currentMetrics={recordedMetrics}
      />

    </div>
  );
}
