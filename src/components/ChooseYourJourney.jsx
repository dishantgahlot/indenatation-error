import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { fetchStreakData } from '../api/client';

export default function ChooseYourJourney({
  onScrollToHome,
  onScrollToJournal,
  onScrollToInsights,
  mouseParallax = { x: 0, y: 0 }
}) {
  const { user, openCharacterModal } = useUser();
  const [selectedPath, setSelectedPath] = useState(
    typeof window !== 'undefined' && window.location.search.includes('simulate') ? 'improved' : null
  ); // 'unimproved' | 'improved'
  const [timelinePeriod, setTimelinePeriod] = useState('1y'); // '6m' | '1y' | '3y' | '5y'
  const [hoveredCard, setHoveredCard] = useState(null); // 'unimproved' | 'improved'
  const [hoveredHabit, setHoveredHabit] = useState(null);
  const [streakData, setStreakData] = useState(null);

  // Fetch streak data on mount
  useEffect(() => {
    fetchStreakData().then(data => {
      if (data) {
        setStreakData(data);
      }
    });
  }, []);

  // Read actual recorded habits from user-scoped localStorage
  const recordedMetrics = (() => {
    try {
      const storageKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { sleep: 5.2, study: 2.1, screen: 7.8, exercise: 0.3, spending: 280 };
  })();

  const userName = user?.name || 'Explorer';

  // Future simulation projections based on user metrics
  const simulationData = {
    unimproved: {
      title: "The Path of Inaction",
      badge: "If You Don't Improve",
      themeColor: "#8e2b20",
      accentBg: "bg-[#722118]",
      tagline: "Small daily compromises compound into silent stagnation.",
      periods: {
        '6m': {
          label: "6 Months Later",
          narrative: `After six months of 5.2h average sleep and high screen time, your circadian rhythm is disrupted. Afternoon cognitive crashes require 3+ cups of coffee, while focused study remains fragmented under constant notifications.`,
          metrics: [
            { label: "Daily Energy", value: "48%", change: "-22%", status: "negative" },
            { label: "Screen Time", value: "8.4h/day", change: "+0.6h", status: "negative" },
            { label: "Accumulated Sleep Debt", value: "180 hours", change: "+180h", status: "negative" },
            { label: "Study Consistency", value: "32%", change: "-15%", status: "negative" },
          ],
          quote: "The danger isn't a sudden fall, but the slow habituation to mediocrity."
        },
        '1y': {
          label: "1 Year Later",
          narrative: `One full year on autopilot. High screen time has become your default coping mechanism for stress. Key goals set at the beginning of the year were abandoned by month four. Physical stamina has noticeably dropped.`,
          metrics: [
            { label: "Daily Energy", value: "38%", change: "-35%", status: "negative" },
            { label: "Screen Time", value: "8.9h/day", change: "+1.1h", status: "negative" },
            { label: "Accumulated Sleep Debt", value: "420 hours", change: "+420h", status: "negative" },
            { label: "Goal Completion Rate", value: "18%", change: "-40%", status: "negative" },
          ],
          quote: "You didn't decide to fail; you just never decided to improve."
        },
        '3y': {
          label: "3 Years Later",
          narrative: `Three years of compounding delay. Peers who stayed disciplined have advanced significantly in their careers and personal vitality. You find yourself constantly feeling behind, battling chronic mental fatigue and burnout.`,
          metrics: [
            { label: "Daily Energy", value: "30%", change: "-55%", status: "negative" },
            { label: "Screen Time", value: "9.2h/day", change: "+1.4h", status: "negative" },
            { label: "Career Acceleration", value: "Low", change: "Stagnant", status: "negative" },
            { label: "Overall Life Satisfaction", value: "42/100", change: "-30pts", status: "negative" },
          ],
          quote: "The heaviest weight you will ever carry is the regret of unused potential."
        },
        '5y': {
          label: "5 Years Later",
          narrative: `Half a decade has slipped by. The habits that once felt temporary have become your permanent identity. Your health, focus capacity, and financial freedom reflect five years of postponed commitment.`,
          metrics: [
            { label: "Daily Energy", value: "24%", change: "-65%", status: "negative" },
            { label: "Cognitive Stamina", value: "Weak", change: "-50%", status: "negative" },
            { label: "Financial Cushion", value: "Vulnerable", change: "-$18,400", status: "negative" },
            { label: "Life Autonomy", value: "28/100", change: "Dependent", status: "negative" },
          ],
          quote: "Tomorrow was yesterday's favorite excuse."
        }
      }
    },
    improved: {
      title: "The Path of Compounding Growth",
      badge: "If You Improve",
      themeColor: "#3c6e39",
      accentBg: "bg-[#2d562b]",
      tagline: "Consistent 1% gains compound into extraordinary mastery.",
      periods: {
        '6m': {
          label: "6 Months Later",
          narrative: `With regular 7.5h sleep and 3h focused study, waking up at 6:30 AM feels natural and energizing. Morning brain fog has completely disappeared. You have already completed two high-priority projects and feel calm under pressure.`,
          metrics: [
            { label: "Daily Energy", value: "85%", change: "+35%", status: "positive" },
            { label: "Screen Time", value: "3.2h/day", change: "-4.6h", status: "positive" },
            { label: "Deep Work Hours", value: "3.5h/day", change: "+1.4h", status: "positive" },
            { label: "Physical Vitality", value: "High", change: "+40%", status: "positive" },
          ],
          quote: "Every morning is a quiet victory before the world wakes up."
        },
        '1y': {
          label: "1 Year Later",
          narrative: `One full year of consistency. You have achieved peak physical conditioning, running 5km easily. Academic and career performance have put you in the top tier of your group. You have saved over $6,500 through mindful spending.`,
          metrics: [
            { label: "Daily Energy", value: "92%", change: "+50%", status: "positive" },
            { label: "Screen Time", value: "2.8h/day", change: "-5.0h", status: "positive" },
            { label: "Savings Compound", value: "$6,500+", change: "+$6.5k", status: "positive" },
            { label: "Goal Completion Rate", value: "88%", change: "+60%", status: "positive" },
          ],
          quote: "Success is not an event. It is the natural residue of your daily habits."
        },
        '3y': {
          label: "3 Years Later",
          narrative: `Three years of relentless progress. You have mastered your core craft, earning recognition and autonomy. Your mental resilience is unbreakable, and your network seeks you out for leadership and advice.`,
          metrics: [
            { label: "Daily Energy", value: "95%", change: "+60%", status: "positive" },
            { label: "Career Acceleration", value: "Top Tier", change: "Promoted / Leader", status: "positive" },
            { label: "Savings Compound", value: "$24,000+", change: "+$24k", status: "positive" },
            { label: "Overall Life Satisfaction", value: "92/100", change: "+45pts", status: "positive" },
          ],
          quote: "When discipline becomes second nature, the impossible becomes routine."
        },
        '5y': {
          label: "5 Years Later",
          narrative: `You have arrived at the future you once dreamed of at the tram station. Complete financial freedom, peak vitality, deep personal relationships, and total mastery of your craft. You look back at today with profound gratitude.`,
          metrics: [
            { label: "Daily Energy", value: "98%", change: "Peak Flow", status: "positive" },
            { label: "Financial Freedom", value: "Robust", change: "+$65,000+", status: "positive" },
            { label: "Life Autonomy", value: "96/100", change: "Total Freedom", status: "positive" },
            { label: "Health & Vitality", value: "Flourishing", change: "Top 5%", status: "positive" },
          ],
          quote: "A small change today led to this very different tomorrow."
        }
      }
    }
  };

  // 10 drifting sakura petals for atmospheric Ghibli feel
  const sakuraPetals = [
    { id: 1, left: '6%', delay: '0s', duration: '9s', size: 14 },
    { id: 2, left: '15%', delay: '2.5s', duration: '11s', size: 18 },
    { id: 3, left: '25%', delay: '1s', duration: '8.5s', size: 12 },
    { id: 4, left: '35%', delay: '4s', duration: '12s', size: 16 },
    { id: 5, left: '48%', delay: '1.8s', duration: '10s', size: 13 },
    { id: 6, left: '58%', delay: '3.2s', duration: '9.5s', size: 15 },
    { id: 7, left: '68%', delay: '0.8s', duration: '11.5s', size: 17 },
    { id: 8, left: '78%', delay: '3.8s', duration: '10.5s', size: 14 },
    { id: 9, left: '88%', delay: '2s', duration: '8s', size: 13 },
    { id: 10, left: '94%', delay: '4.5s', duration: '13s', size: 15 },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#130b08] select-none flex items-center justify-center font-caacupe">
      
      {/* ============================================================== */}
      {/* 1. STAGE WRAPPER — 16:9 Canvas matching Mockup                */}
      {/* ============================================================== */}
      <div 
        className="relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-[1024/562] overflow-hidden shadow-2xl flex items-center justify-center"
        style={{
          transform: 'translate3d(calc(var(--mouse-x, 0) * 3px), calc(var(--mouse-y, 0) * 2px), 0)',
        }}
      >
        
        {/* Full Ghibli Sunset Railway Station Artwork Backdrop */}
        <img 
          src="/assets/page4/journey_bg_full.jpg" 
          alt="Choose Your Journey Scenic Station"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Ambient Warm Golden Sunlight Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

        {/* ============================================================== */}
        {/* 2. FLOATING SAKURA PETALS (Studio Ghibli atmosphere)          */}
        {/* ============================================================== */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {sakuraPetals.map((petal) => (
            <div
              key={petal.id}
              className="absolute -top-6 text-pink-300/80 animate-sakura-drift"
              style={{
                left: petal.left,
                animationDelay: petal.delay,
                animationDuration: petal.duration,
                width: `${petal.size}px`,
                height: `${petal.size}px`
              }}
            >
              <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                <path 
                  d="M15 2 C11 8, 4 14, 5 21 C6 26, 13 28, 15 28 C17 28, 24 26, 25 21 C26 14, 19 8, 15 2 Z" 
                  fill="#ffc1cc" 
                  fillOpacity="0.88" 
                />
              </svg>
            </div>
          ))}
        </div>

        {/* ============================================================== */}
        {/* 3. TOP NAVIGATION HOTSPOTS (Zero double text, 100% precision) */}
        {/* ============================================================== */}
        <div className="absolute top-0 left-0 right-0 h-[8%] z-40 select-none pointer-events-auto">
          
          {/* Brand Logo: Tram + 'Future You' Hotspot (left ~4% to ~19%) */}
          <div 
            onClick={onScrollToHome}
            className="absolute left-[3.5%] top-[14%] w-[15.5%] h-[72%] cursor-pointer rounded-lg hover:bg-white/10 transition-colors group flex items-center"
            title="Return to Cover Page"
          />

          {/* Nav Item: 'Home' (left ~34% to ~39%) */}
          <button
            type="button"
            onClick={onScrollToHome}
            className="absolute left-[34%] top-[18%] w-[5.5%] h-[64%] cursor-pointer rounded-lg hover:bg-white/15 transition-all text-transparent"
            title="Go to Home (Desk Scene)"
          >
            Home
          </button>

          {/* Nav Item: 'Journal' (left ~40.5% to ~46.5%) */}
          <button
            type="button"
            onClick={onScrollToJournal}
            className="absolute left-[40.5%] top-[18%] w-[6.5%] h-[64%] cursor-pointer rounded-lg hover:bg-white/15 transition-all text-transparent"
            title="Go to Digital Twin Journal (Page 2)"
          >
            Journal
          </button>

          {/* Nav Item: 'Journey' (Active, left ~47.5% to ~54%) */}
          <div
            className="absolute left-[47.5%] top-[18%] w-[6.8%] h-[64%] cursor-default rounded-lg"
            title="Current Page: Choose Your Journey"
          />

          {/* Nav Item: 'About' (left ~55% to ~61%) */}
          <button
            type="button"
            onClick={onScrollToInsights}
            className="absolute left-[55%] top-[18%] w-[6.2%] h-[64%] cursor-pointer rounded-lg hover:bg-white/15 transition-all text-transparent"
            title="Go to Insights & About (Page 3)"
          >
            About
          </button>

          {/* Pill Button: '↗ My Dashboard' (left ~81% to ~93%) */}
          <button
            type="button"
            onClick={onScrollToInsights}
            className="absolute left-[81%] top-[14%] w-[12%] h-[72%] rounded-full cursor-pointer hover:ring-2 hover:ring-amber-200/80 hover:shadow-[0_0_15px_rgba(255,230,190,0.6)] transition-all text-transparent"
            title="Open My Dashboard (Page 3 Insights)"
          >
            My Dashboard
          </button>

          {/* Character Avatar Switcher Pill (top right corner) */}
          <div className="absolute right-[1.2%] top-[18%] h-[64%] flex items-center">
            <button
              onClick={openCharacterModal}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 hover:bg-black/75 border border-[#eedab4]/40 text-[#fdf3dc] text-xs font-sans transition-all cursor-pointer shadow-sm group"
              title="Click to customize your Character Avatar"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-[#eedab4] bg-[#e8dcce] shrink-0">
                <img 
                  src={user.avatarThumb || '/assets/avatar_explorer_thumb.jpg'} 
                  alt={userName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="font-semibold text-xs text-[#fdf3dc] group-hover:text-[#f8d789] transition-colors max-w-[65px] truncate hidden md:inline">
                {userName}
              </span>
            </button>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 4. TOP PARCHMENT BANNER: "Choose Your Journey"               */}
        {/* ============================================================== */}
        <div 
          className="absolute left-[23%] right-[23%] top-[8.5%] h-[16.5%] z-30 pointer-events-auto flex items-center justify-center"
        >
          {/* Clickable antique pocket watch on right */}
          <button
            type="button"
            onClick={() => setSelectedPath(selectedPath === 'improved' ? 'unimproved' : 'improved')}
            className="absolute right-[4.5%] top-[8%] w-[9%] h-[82%] rounded-full cursor-pointer hover:ring-2 hover:ring-amber-400/80 hover:shadow-[0_0_18px_rgba(250,210,120,0.7)] transition-all"
            title="Click the antique pocket watch to simulate your future!"
          >
            <span className="sr-only">Pocket Watch Timeline Simulator</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 5. CENTER SIGNPOST HOTSPOTS ("Two Choices", "Two Futures")   */}
        {/* ============================================================== */}
        <div className="absolute left-[44.8%] top-[34%] w-[10.4%] h-[30%] z-30 select-none flex flex-col justify-center items-center pointer-events-auto">
          {/* Arrow 1: 'Two Choices' (Points Left) */}
          <button
            type="button"
            onClick={() => setSelectedPath('unimproved')}
            onMouseEnter={() => setHoveredCard('unimproved')}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full h-[40%] rounded-md cursor-pointer transition-all duration-200 hover:bg-amber-900/20 hover:ring-1 hover:ring-amber-400/50 flex items-center justify-center group"
            title="Explore the path of inaction (Two Choices)"
          >
            <span className="sr-only">Two Choices (If You Don't Improve)</span>
          </button>

          {/* Spacer for wooden post */}
          <div className="h-[12%]" />

          {/* Arrow 2: 'Two Futures' (Points Right) */}
          <button
            type="button"
            onClick={() => setSelectedPath('improved')}
            onMouseEnter={() => setHoveredCard('improved')}
            onMouseLeave={() => setHoveredCard(null)}
            className="w-full h-[40%] rounded-md cursor-pointer transition-all duration-200 hover:bg-emerald-900/20 hover:ring-1 hover:ring-emerald-400/50 flex items-center justify-center group"
            title="Explore the path of growth (Two Futures)"
          >
            <span className="sr-only">Two Futures (If You Improve)</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 6. LEFT CARD: "If You Don't Improve" (Interactive Layer)     */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setHoveredCard('unimproved')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`absolute left-[16.8%] top-[20.3%] w-[25.8%] h-[76.6%] z-30 rounded-[18px] transition-all duration-300 pointer-events-auto select-none ${
            hoveredCard === 'unimproved'
              ? '-translate-y-2.5 scale-[1.015] shadow-[0_22px_50px_rgba(0,0,0,0.88)] ring-2 ring-[#a84232]/60'
              : 'hover:-translate-y-1'
          }`}
        >
          {/* Subtle warm amber/dark-mood vignette overlay on card hover */}
          <div className={`absolute inset-0 rounded-[18px] transition-opacity duration-300 pointer-events-none ${
            hoveredCard === 'unimproved' ? 'opacity-100 bg-red-950/10' : 'opacity-0'
          }`} />

          {/* Interactive Bullet Row Hotspots with Custom Tooltips */}
          <div className="absolute left-[8%] right-[8%] top-[55%] h-[24%] flex flex-col justify-between">
            {/* Habit 1: Irregular Sleep */}
            <div 
              onMouseEnter={() => setHoveredHabit('sleep_bad')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('unimproved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-red-900/15 transition-colors group"
              title="Click to simulate: Irregular Sleep"
            >
              {hoveredHabit === 'sleep_bad' && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-[#25110a] text-[#f5dfc6] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#8b382c] whitespace-nowrap">
                  <span className="font-bold text-red-300">Logged: {recordedMetrics.sleep || 5.2}h</span> • High sleep debt accumulation
                </div>
              )}
            </div>

            {/* Habit 2: High Screen Time */}
            <div 
              onMouseEnter={() => setHoveredHabit('screen_bad')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('unimproved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-red-900/15 transition-colors group"
              title="Click to simulate: High Screen Time"
            >
              {hoveredHabit === 'screen_bad' && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-[#25110a] text-[#f5dfc6] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#8b382c] whitespace-nowrap">
                  <span className="font-bold text-red-300">Logged: {recordedMetrics.screen || 7.8}h</span> • Causes attention fragmentation
                </div>
              )}
            </div>

            {/* Habit 3: Inconsistent Study */}
            <div 
              onMouseEnter={() => setHoveredHabit('study_bad')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('unimproved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-red-900/15 transition-colors group"
              title="Click to simulate: Inconsistent Study"
            >
              {hoveredHabit === 'study_bad' && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-[#25110a] text-[#f5dfc6] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#8b382c] whitespace-nowrap">
                  <span className="font-bold text-red-300">Logged: {recordedMetrics.study || 2.1}h</span> • Incomplete focus blocks
                </div>
              )}
            </div>

            {/* Habit 4: Low Physical Activity */}
            <div 
              onMouseEnter={() => setHoveredHabit('exercise_bad')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('unimproved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-red-900/15 transition-colors group"
              title="Click to simulate: Low Physical Activity"
            >
              {hoveredHabit === 'exercise_bad' && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 bg-[#25110a] text-[#f5dfc6] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#8b382c] whitespace-nowrap">
                  <span className="font-bold text-red-300">Logged: {recordedMetrics.exercise || 0.3}h</span> • Reduced energy & VO2 max
                </div>
              )}
            </div>
          </div>

          {/* Interactive Burgundy Button Overlay: "See the consequences of your choices →" */}
          <button
            type="button"
            onClick={() => setSelectedPath('unimproved')}
            className="absolute left-[18%] right-[18%] top-[75.2%] h-[9.6%] rounded-full cursor-pointer hover:ring-2 hover:ring-amber-200/90 hover:shadow-[0_0_20px_rgba(255,80,60,0.7)] transition-all hover:scale-105 active:scale-95 text-transparent"
            title="Click to See the consequences of your choices"
          >
            See the consequences of your choices
          </button>

        </div>

        {/* ============================================================== */}
        {/* 7. RIGHT CARD: "If You Improve" (Interactive Layer)          */}
        {/* ============================================================== */}
        <div
          onMouseEnter={() => setHoveredCard('improved')}
          onMouseLeave={() => setHoveredCard(null)}
          className={`absolute left-[57.8%] top-[20.3%] w-[25.8%] h-[76.6%] z-30 rounded-[18px] transition-all duration-300 pointer-events-auto select-none ${
            hoveredCard === 'improved'
              ? '-translate-y-2.5 scale-[1.015] shadow-[0_22px_50px_rgba(0,0,0,0.88)] ring-2 ring-[#4d7d49]/70'
              : 'hover:-translate-y-1'
          }`}
        >
          {/* Subtle golden sunrise glow overlay on card hover */}
          <div className={`absolute inset-0 rounded-[18px] transition-opacity duration-300 pointer-events-none ${
            hoveredCard === 'improved' ? 'opacity-100 bg-emerald-950/10' : 'opacity-0'
          }`} />

          {/* Interactive Bullet Row Hotspots with Custom Tooltips */}
          <div className="absolute left-[8%] right-[8%] top-[55%] h-[24%] flex flex-col justify-between">
            {/* Habit 1: Consistent Sleep */}
            <div 
              onMouseEnter={() => setHoveredHabit('sleep_good')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('improved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-emerald-900/15 transition-colors group"
              title="Click to simulate: Consistent Sleep"
            >
              {hoveredHabit === 'sleep_good' && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 bg-[#102413] text-[#e3f4e5] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#3e7243] whitespace-nowrap">
                  <span className="font-bold text-emerald-300">Target: 8.0h</span> • 100% cognitive restoration & peak energy
                </div>
              )}
            </div>

            {/* Habit 2: Focused Study */}
            <div 
              onMouseEnter={() => setHoveredHabit('study_good')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('improved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-emerald-900/15 transition-colors group"
              title="Click to simulate: Focused Study"
            >
              {hoveredHabit === 'study_good' && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 bg-[#102413] text-[#e3f4e5] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#3e7243] whitespace-nowrap">
                  <span className="font-bold text-emerald-300">Target: 4.0h</span> • Deep flow state blocks daily
                </div>
              )}
            </div>

            {/* Habit 3: Regular Exercise */}
            <div 
              onMouseEnter={() => setHoveredHabit('exercise_good')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('improved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-emerald-900/15 transition-colors group"
              title="Click to simulate: Regular Exercise"
            >
              {hoveredHabit === 'exercise_good' && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 bg-[#102413] text-[#e3f4e5] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#3e7243] whitespace-nowrap">
                  <span className="font-bold text-emerald-300">Target: 45 min</span> • Increased neurogenesis & stamina
                </div>
              )}
            </div>

            {/* Habit 4: Better Financial Habits */}
            <div 
              onMouseEnter={() => setHoveredHabit('money_good')}
              onMouseLeave={() => setHoveredHabit(null)}
              onClick={() => setSelectedPath('improved')}
              className="relative w-full h-[22%] rounded px-2 flex items-center cursor-pointer hover:bg-emerald-900/15 transition-colors group"
              title="Click to simulate: Better Financial Habits"
            >
              {hoveredHabit === 'money_good' && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50 bg-[#102413] text-[#e3f4e5] text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-[#3e7243] whitespace-nowrap">
                  <span className="font-bold text-emerald-300">Target: $1,200/mo saved</span> • Freedom & compounding wealth
                </div>
              )}
            </div>
          </div>

          {/* Interactive Forest Green Button Overlay: "See the consequences of your choices →" */}
          <button
            type="button"
            onClick={() => setSelectedPath('improved')}
            className="absolute left-[18%] right-[18%] top-[75.2%] h-[9.6%] rounded-full cursor-pointer hover:ring-2 hover:ring-emerald-200/90 hover:shadow-[0_0_20px_rgba(80,255,100,0.7)] transition-all hover:scale-105 active:scale-95 text-transparent"
            title="Click to See the consequences of your choices"
          >
            See the consequences of your choices
          </button>

        </div>

      </div>

      {/* ============================================================== */}
      {/* 8. SLEEK FLOATING RETURN & NAVIGATION CONTROLS                */}
      {/* ============================================================== */}
      <div className="fixed right-3.5 bottom-2.5 z-40 flex items-center gap-1.5 select-none bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xl">
        <button
          type="button"
          onClick={onScrollToInsights}
          className="px-2.5 py-0.5 rounded-full text-[#f2e6cf] hover:text-[#f8d789] hover:bg-white/10 text-xs font-sans font-medium transition-all cursor-pointer"
          title="Scroll back to Page 3 (Insights & What's Holding You Back)"
        >
          <span>↑ Insights</span>
        </button>

        <span className="text-white/30 text-xs">•</span>

        <button
          type="button"
          onClick={onScrollToJournal}
          className="px-2.5 py-0.5 rounded-full text-[#f2e6cf] hover:text-[#f8d789] hover:bg-white/10 text-xs font-sans font-medium transition-all cursor-pointer"
          title="Scroll back to Page 2 (Journal Dial)"
        >
          <span>↑ Journal</span>
        </button>

        <span className="text-white/30 text-xs">•</span>

        <button
          type="button"
          onClick={onScrollToHome}
          className="px-2.5 py-0.5 rounded-full text-[#f2e6cf] hover:text-[#f8d789] hover:bg-white/10 text-xs font-sans font-medium transition-all cursor-pointer"
          title="Scroll back to Cover Page"
        >
          <span>Top ↑</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 9. FUTURE TRAJECTORY SIMULATION MODAL (Studio Ghibli Theme)   */}
      {/* ============================================================== */}
      {selectedPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div 
            className="relative w-full max-w-2xl bg-[#f7efdc] text-[#281a13] rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.9)] border-4 border-[#cda77a] overflow-hidden max-h-[90vh] flex flex-col font-sans"
            style={{
              backgroundImage: 'radial-gradient(#ebd9bd 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Top Washi Tape Decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-[#edd5aa]/90 shadow-xs border-b border-[#c8a97e]/60" />

            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedPath(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#3c2518] hover:bg-[#5b3823] text-[#f7efdc] flex items-center justify-center font-bold text-base transition-all shadow-md cursor-pointer"
              title="Close Simulation"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="pb-3 border-b border-[#caa476]/40 shrink-0">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white ${
                  selectedPath === 'improved' ? 'bg-[#436e3f]' : 'bg-[#9c3629]'
                }`}>
                  {simulationData[selectedPath].badge}
                </span>
                <span className="text-xs text-[#836247] font-medium">
                  Future Simulation for {userName}
                </span>
              </div>
              <h2 className="font-caacupe text-2xl sm:text-3xl text-[#2a170d] mt-2 font-bold leading-tight">
                {simulationData[selectedPath].title}
              </h2>
              <p className="text-xs sm:text-sm text-[#75553b] italic mt-1 font-serif">
                "{simulationData[selectedPath].tagline}"
              </p>
            </div>

            {/* Streak Display - Current Consistency Tracker */}
            {streakData && (
              <div className="mb-4 p-3 rounded-xl bg-[#f5ebd9]/90 border border-[#cfb696]/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      streakData.streakStatus === 'active' ? 'bg-emerald-800/30' : streakData.streakStatus === 'broken' ? 'bg-red-800/30' : 'bg-amber-800/30'
                    }`}>
                      <span className="text-sm">{streakData.streakStatus === 'active' ? '🔥' : streakData.streakStatus === 'broken' ? '⚡' : '🌱'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans font-black uppercase tracking-wider text-[#8e6e53] block">Your Consistency</span>
                      <span className="font-mono text-lg font-black text-[#2c180c] leading-none">
                        {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} current streak
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-[#7c583b]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5568ba' }} />
                      Best: {streakData.longestStreak} days
                    </span>
                    <span className="flex items-center gap-1 text-[#7c583b]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f2a738' }} />
                      Total: {streakData.totalDaysLogged} days logged
                    </span>
                    {streakData.todayLogged && (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Today: ✓ Logged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Timeline Tabs (6 Months, 1 Year, 3 Years, 5 Years) */}
            <div className="flex items-center justify-between gap-2 my-4 p-1.5 bg-[#ecd9be] rounded-2xl border border-[#caa476]/50 shrink-0">
              {['6m', '1y', '3y', '5y'].map((key) => {
                const isActive = timelinePeriod === key;
                const labels = { '6m': '6 Months', '1y': '1 Year', '3y': '3 Years', '5y': '5 Years' };
                return (
                  <button
                    key={key}
                    onClick={() => setTimelinePeriod(key)}
                    className={`flex-1 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? selectedPath === 'improved'
                          ? 'bg-[#436e3f] text-white shadow-md'
                          : 'bg-[#9c3629] text-white shadow-md'
                        : 'text-[#5f412c] hover:bg-black/10'
                    }`}
                  >
                    {labels[key]}
                  </button>
                );
              })}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Story Narrative Box */}
              <div className="p-4 rounded-2xl bg-white/70 border border-[#caa476]/40 shadow-xs">
                <h4 className="text-xs font-bold text-[#836247] uppercase tracking-wider mb-1">
                  Projected Daily Life ({simulationData[selectedPath].periods[timelinePeriod].label})
                </h4>
                <p className="text-sm sm:text-base text-[#2e1d13] leading-relaxed font-sans">
                  {simulationData[selectedPath].periods[timelinePeriod].narrative}
                </p>
              </div>

              {/* Projections Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {simulationData[selectedPath].periods[timelinePeriod].metrics.map((m, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-white/60 border border-[#caa476]/30 flex flex-col justify-between"
                  >
                    <span className="text-xs text-[#70523a] font-medium">{m.label}</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-lg sm:text-xl font-bold font-caacupe text-[#22130b]">{m.value}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        m.status === 'positive' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {m.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inspiring Wisdom Note */}
              <div className="p-3.5 rounded-xl bg-[#ebdabb]/80 border-l-4 border-[#b48858] text-xs sm:text-sm text-[#472f1f] italic font-serif">
                "{simulationData[selectedPath].periods[timelinePeriod].quote}"
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 mt-2 border-t border-[#caa476]/40 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setSelectedPath(selectedPath === 'improved' ? 'unimproved' : 'improved')}
                className="px-4 py-2 rounded-full border border-[#9b7550] text-[#4f3422] text-xs sm:text-sm font-semibold hover:bg-black/5 transition-all cursor-pointer"
              >
                Switch to {selectedPath === 'improved' ? "If You Don't Improve" : "If You Improve"}
              </button>

              <button
                onClick={() => {
                  setSelectedPath(null);
                  onScrollToJournal();
                }}
                className={`px-5 py-2 rounded-full text-white text-xs sm:text-sm font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                  selectedPath === 'improved'
                    ? 'bg-[#436e3f] hover:bg-[#52834c]'
                    : 'bg-[#9c3629] hover:bg-[#b84333]'
                }`}
              >
                {selectedPath === 'improved' ? "Commit to This Future in Journal →" : "Break the Habit in Journal →"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
