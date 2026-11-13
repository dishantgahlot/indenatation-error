import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { fetchFutureLetter } from '../api/client';
import { getCharacterMedia } from '../utils/characterMedia';

// ============================================================================
// TIMELINE MILESTONES (Self-Contained 3-Stage Horizontal Slide Journey)
// ============================================================================
function TimelineMilestones({
  path, // 'improved' | 'unimproved'
  userName,
  user = null,
  onBackToChoices,
  reclaimedAnnualHours,
  gainedStudyHours,
  currentAnnualScreen,
  metrics = null,
}) {
  const characterMedia = getCharacterMedia(user);
  const [activeSlide, setActiveSlide] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('slide=2')) return 2;
      if (window.location.search.includes('slide=1')) return 1;
    }
    return 0;
  });

  const isImproved = path === 'improved';
  const isRtl = path === 'unimproved';

  const [dynamicLetter, setDynamicLetter] = useState(null);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [hasRequestedLetter, setHasRequestedLetter] = useState(false);

  const handleGenerateLetter = async () => {
    setHasRequestedLetter(true);
    setLoadingLetter(true);
    try {
      const data = await fetchFutureLetter(path, true, metrics);
      if (data) {
        setDynamicLetter(data);
      }
    } catch (err) {
      console.warn('Could not generate future letter:', err);
    } finally {
      setLoadingLetter(false);
    }
  };

  const scrollToSlide = (index) => {
    setActiveSlide(index);
  };

  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swiped right -> go to previous milestone
        scrollToSlide(Math.max(0, activeSlide - 1));
      } else {
        // Swiped left -> go to next milestone
        scrollToSlide(Math.min(2, activeSlide + 1));
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-1/3 h-full relative flex-shrink-0 flex items-center justify-center overflow-hidden select-none">
      
      {/* Main Full-Size Deckled Parchment Paper Container */}
      <div 
        className="relative w-[96%] max-w-[1720px] h-[92vh] max-h-[920px] flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] z-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.45) 0%, transparent 80%)',
        }}
      >
        {/* Authentic Parchment Texture Background */}
        <img 
          src="/assets/page4/parchment_clean_alpha.png" 
          alt="Parchment Background" 
          className="absolute inset-0 w-full h-full object-fill pointer-events-none -z-10 select-none drop-shadow-[0_12px_30px_rgba(30,15,5,0.5)]"
        />

        {/* Left Floating Slide Navigation Paddle */}
        <button
          type="button"
          onClick={() => {
            if (isRtl) {
              scrollToSlide(Math.min(2, activeSlide + 1));
            } else {
              scrollToSlide(Math.max(0, activeSlide - 1));
            }
          }}
          disabled={isRtl ? activeSlide === 2 : activeSlide === 0}
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ebd8c0]/90 hover:bg-[#faebd7] border-2 border-[#b59976] shadow-[0_6px_16px_rgba(40,20,10,0.35)] flex items-center justify-center text-xl sm:text-2xl font-bold text-[#3d2414] transition-all cursor-pointer active:scale-95 ${
            (isRtl ? activeSlide === 2 : activeSlide === 0) ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'hover:scale-110'
          }`}
          title={isRtl ? "Next milestone (deeper into future)" : "Previous milestone"}
        >
          ‹
        </button>

        {/* Right Floating Slide Navigation Paddle */}
        <button
          type="button"
          onClick={() => {
            if (isRtl) {
              scrollToSlide(Math.max(0, activeSlide - 1));
            } else {
              scrollToSlide(Math.min(2, activeSlide + 1));
            }
          }}
          disabled={isRtl ? activeSlide === 0 : activeSlide === 2}
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ebd8c0]/90 hover:bg-[#faebd7] border-2 border-[#b59976] shadow-[0_6px_16px_rgba(40,20,10,0.35)] flex items-center justify-center text-xl sm:text-2xl font-bold text-[#3d2414] transition-all cursor-pointer active:scale-95 ${
            (isRtl ? activeSlide === 0 : activeSlide === 2) ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'hover:scale-110'
          }`}
          title={isRtl ? "Previous milestone (closer to today)" : "Next milestone"}
        >
          ›
        </button>

        {/* ============================================================== */}
        {/* HORIZONTAL TIMELINE PROCESS NAVBAR (Bidirectional RTL / LTR)   */}
        {/* ============================================================== */}
        <div className="w-full max-w-[1360px] shrink-0 mb-2 sm:mb-3 z-30 select-none px-2 sm:px-4 pt-1">
          <div className="relative w-full py-2 flex items-center justify-between gap-4 border-b-2 border-[#8b5a2b]/25">
            
            {/* Left Edge: In RTL, shows Scenario Badge; In LTR, shows Return to Book */}
            <div className="flex items-center gap-2.5 shrink-0">
              {isRtl ? (
                <span className="px-3.5 py-1.5 rounded-full font-serif font-black text-xs sm:text-sm tracking-wide border-2 select-none bg-[#4a1810]/10 border-[#4a1810]/40 text-[#4a1810]">
                  ⚠ If You Don't Improve
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onBackToChoices}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-transparent hover:bg-[#3d2414] text-[#3d2414] hover:text-[#fce8ba] flex items-center justify-center font-bold text-lg shadow-[0_3px_10px_rgba(40,20,10,0.2)] transition-all shrink-0 cursor-pointer group active:scale-95 border-2 border-[#8b5a2b]"
                    title="Return to Consequences of Your Choice"
                  >
                    <span className="transition-transform group-hover:-translate-x-1">←</span>
                  </button>
                  <button
                    type="button"
                    onClick={onBackToChoices}
                    className="px-3.5 sm:px-4 py-1.5 rounded-full border-2 border-[#8b5a2b] bg-transparent hover:bg-[#3d2414] text-[#3d2414] hover:text-[#fce8ba] font-serif font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-1.5 group shadow-xs active:scale-95"
                    title="Return to Consequences of Your Choice"
                  >
                    <span className="transition-transform group-hover:-translate-x-1">←</span>
                    <span>Return to Consequences</span>
                  </button>
                </>
              )}
            </div>

            {/* Center: The 3 Process Steps with Connecting Arrows (Bidirectional RTL / LTR) */}
            <div className="flex-1 flex items-center justify-center gap-3 sm:gap-7 md:gap-12 overflow-x-auto no-scrollbar py-1">
              {(isRtl
                ? [
                    {
                      id: 2,
                      title: 'Future Message',
                      subtitle: '(Letter from You)',
                      icon: (
                        <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-11 sm:h-11 stroke-[#2c180c] fill-none transition-transform group-hover:scale-110" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="11" width="36" height="26" rx="3" />
                          <path d="M6 13 L24 26 L42 13" />
                          <circle cx="24" cy="27" r="4" className="fill-[#8b5a2b] stroke-[#2c180c]" strokeWidth="1.5" />
                        </svg>
                      ),
                    },
                    {
                      id: 1,
                      title: '5-Year Self',
                      subtitle: '(Compounded Reality)',
                      icon: (
                        <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-11 sm:h-11 stroke-[#2c180c] fill-none transition-transform group-hover:scale-110" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 15 7 24 16 33" />
                          <line x1="27" y1="12" x2="21" y2="36" />
                          <polyline points="32 15 41 24 32 33" />
                        </svg>
                      ),
                    },
                    {
                      id: 0,
                      title: '6-Month Self',
                      subtitle: '(First Milestone)',
                      icon: (
                        <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-11 sm:h-11 stroke-[#2c180c] fill-none transition-transform group-hover:scale-110" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M24 4 C24 15, 33 24, 44 24 C33 24, 24 33, 24 44 C24 33, 15 24, 4 24 C15 24, 24 15, 24 4 Z" />
                        </svg>
                      ),
                    },
                  ]
                : [
                    {
                      id: 0,
                      title: '6-Month Self',
                      subtitle: '(First Milestone)',
                      icon: (
                        <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-11 sm:h-11 stroke-[#2c180c] fill-none transition-transform group-hover:scale-110" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M24 4 C24 15, 33 24, 44 24 C33 24, 24 33, 24 44 C24 33, 15 24, 4 24 C15 24, 24 15, 24 4 Z" />
                        </svg>
                      ),
                    },
                    {
                      id: 1,
                      title: '5-Year Self',
                      subtitle: '(Compounded Reality)',
                      icon: (
                        <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-11 sm:h-11 stroke-[#2c180c] fill-none transition-transform group-hover:scale-110" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 15 7 24 16 33" />
                          <line x1="27" y1="12" x2="21" y2="36" />
                          <polyline points="32 15 41 24 32 33" />
                        </svg>
                      ),
                    },
                    {
                      id: 2,
                      title: 'Future Message',
                      subtitle: '(Letter from You)',
                      icon: (
                        <svg viewBox="0 0 48 48" className="w-10 h-10 sm:w-11 sm:h-11 stroke-[#2c180c] fill-none transition-transform group-hover:scale-110" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="11" width="36" height="26" rx="3" />
                          <path d="M6 13 L24 26 L42 13" />
                          <circle cx="24" cy="27" r="4" className="fill-[#8b5a2b] stroke-[#2c180c]" strokeWidth="1.5" />
                        </svg>
                      ),
                    },
                  ]
              ).map((step, idx) => (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <svg 
                      viewBox="0 0 36 16" 
                      className={`w-8 sm:w-10 h-4 text-[#8b5a2b]/70 shrink-0 select-none ${isRtl ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="3" y1="8" x2="31" y2="8" />
                      <polyline points="24 3 31 8 24 13" />
                    </svg>
                  )}
                  <button
                    type="button"
                    onClick={() => scrollToSlide(step.id)}
                    className={`flex flex-col items-center justify-center px-3 sm:px-5 py-1.5 transition-all cursor-pointer group bg-transparent ${
                      activeSlide === step.id
                        ? 'opacity-100 scale-105'
                        : 'opacity-55 hover:opacity-100 hover:scale-102'
                    }`}
                  >
                    <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 mb-1">
                      {step.icon}
                    </div>
                    <span className="font-serif font-black text-sm sm:text-base text-[#2c180c] tracking-tight leading-none whitespace-nowrap">
                      {step.title}
                    </span>
                    <span className="font-serif text-[11px] sm:text-xs text-[#5c3a21] italic leading-tight whitespace-nowrap mt-1">
                      {step.subtitle}
                    </span>
                    {activeSlide === step.id && (
                      <div className="w-10 h-0.5 bg-[#8b5a2b] mt-1.5 rounded-full shadow-xs" />
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Right Edge: In RTL, shows Return to Book (pointing towards center book); In LTR, shows Scenario Badge */}
            <div className="flex items-center gap-2.5 shrink-0">
              {isRtl ? (
                <>
                  <button
                    type="button"
                    onClick={onBackToChoices}
                    className="px-3.5 sm:px-4 py-1.5 rounded-full border-2 border-[#8b5a2b] bg-transparent hover:bg-[#3d2414] text-[#3d2414] hover:text-[#fce8ba] font-serif font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center gap-1.5 group shadow-xs active:scale-95"
                    title="Return to Consequences of Your Choice"
                  >
                    <span>Return to Consequences</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={onBackToChoices}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-transparent hover:bg-[#3d2414] text-[#3d2414] hover:text-[#fce8ba] flex items-center justify-center font-bold text-lg shadow-[0_3px_10px_rgba(40,20,10,0.2)] transition-all shrink-0 cursor-pointer group active:scale-95 border-2 border-[#8b5a2b]"
                    title="Return to Consequences of Your Choice"
                  >
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full font-serif font-black text-xs sm:text-sm tracking-wide border-2 select-none bg-[#1e3d22]/10 border-[#1e3d22]/40 text-[#1e3d22]">
                  ✦ If You Improve
                </span>
              )}
            </div>

          </div>
        </div>

        {/* ============================================================== */}
        {/* HORIZONTALLY SLIDING CONTAINER (3 FULL-PAGE SLIDES)            */}
        {/* ============================================================== */}
        <div 
          className="flex-1 w-full overflow-hidden relative select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className={`w-[300%] h-full flex transition-transform duration-600 ease-in-out ${isRtl ? 'flex-row-reverse' : ''}`}
            style={{
              transform: isRtl
                ? activeSlide === 0
                  ? 'translateX(-66.666667%)'
                  : activeSlide === 1
                    ? 'translateX(-33.333333%)'
                    : 'translateX(0%)'
                : activeSlide === 0
                  ? 'translateX(0%)'
                  : activeSlide === 1
                    ? 'translateX(-33.333333%)'
                    : 'translateX(-66.666667%)',
            }}
          >

          {/* ------------------------------------------------------------ */}
          {/* SLIDE 1: YOUR FUTURE SELF FROM 6 MONTHS                      */}
          {/* ------------------------------------------------------------ */}
          <div className="w-1/3 h-full overflow-y-auto overflow-x-hidden parchment-scroll flex items-center justify-center px-3 sm:px-8 py-2 shrink-0">
            <div className="w-full max-w-[1360px] min-h-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
              
              {/* Left Column: Illustration Image & Quote */}
              <div className="w-full md:w-[44%] flex flex-col items-center justify-center">
                <div className="w-20 sm:w-24 h-4 sm:h-5 bg-[#eedab4]/95 border-y border-[#d4c19c]/80 shadow-xs -rotate-1 mb-[-8px] z-20 backdrop-blur-[1px]" />
                <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] aspect-[253/156] rounded-2xl overflow-hidden border-3 sm:border-4 border-[#b59976]/70 shadow-[0_14px_34px_rgba(40,20,10,0.38)] relative group">
                  <img 
                    src={isImproved ? characterMedia.improved : characterMedia.unimproved} 
                    alt={`${characterMedia.name} 6 Months Future Self`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = isImproved 
                        ? (characterMedia.improvedStatic || '/assets/characters/explorer_radiant.jpg')
                        : (characterMedia.unimprovedStatic || '/assets/characters/explorer_burnout.jpg');
                    }}
                  />
                </div>

                {/* Character Quote */}
                <div className="mt-2 sm:mt-3 px-2 text-center max-w-[420px]">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-serif font-black uppercase tracking-wider mb-1.5 border-2 ${
                    isImproved ? 'border-[#8b5a2b]/60 text-[#2c180c] bg-[#ebd8c0]/40' : 'border-[#8b3d24]/60 text-[#4a1810] bg-[#ebd8c0]/40'
                  }`}>
                    {isImproved ? characterMedia.improvedMilestone : characterMedia.unimprovedWarning}
                  </span>
                  <p className="font-handwriting text-xl sm:text-2xl text-[#1a0f07] italic font-black leading-snug drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {isImproved ? characterMedia.improvedQuote : characterMedia.unimprovedQuote}
                  </p>
                </div>
              </div>

              {/* Right Column: 6-Month Data Breakdown & Narrative */}
              <div className="w-full md:w-[56%] flex flex-col justify-between min-h-full py-1 sm:py-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-serif font-black uppercase tracking-wider bg-transparent border border-[#8b5a2b] text-[#2c180c]">
                      {isImproved ? 'Consequence: If You Improve' : "Consequence: If You Don't Improve"}
                    </span>
                    <span className="text-xs sm:text-sm font-serif font-bold text-[#6a4224]">
                      {userName}'s 6-Month Horizon
                    </span>
                  </div>

                  <h2 className={`font-handwriting text-2xl sm:text-3xl lg:text-[40px] font-black leading-tight tracking-wide ${
                    isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'
                  }`}>
                    {isImproved
                      ? `${userName}'s 6th-Month Evolution`
                      : `${userName}'s 6th-Month Compounding Drift`}
                  </h2>
                </div>

                {/* 3 Metric Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 my-2 sm:my-2.5 py-2 sm:py-2.5 border-y-2 border-[#8b5a2b]/25">
                  <div className="sm:border-r border-[#8b5a2b]/25 sm:pr-3">
                    <span className="text-[11px] sm:text-xs font-serif font-black text-[#5c3a21] uppercase tracking-wider block mb-0.5">
                      Daily Energy Score
                    </span>
                    <span className={`font-mono text-3xl sm:text-4xl font-black ${isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'}`}>
                      {isImproved ? '86%' : '48%'}
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif text-[#2c180c] mt-1 leading-snug font-bold">
                      {isImproved ? '+38% vitality surge, zero afternoon brain fog.' : 'Persistent sleep debt & caffeine reliance.'}
                    </p>
                  </div>

                  <div className="sm:border-r border-[#8b5a2b]/25 sm:pr-3">
                    <span className="text-[11px] sm:text-xs font-serif font-black text-[#5c3a21] uppercase tracking-wider block mb-0.5">
                      Screen Hours
                    </span>
                    <span className={`font-mono text-3xl sm:text-4xl font-black ${isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'}`}>
                      {isImproved ? `+${Math.round(reclaimedAnnualHours * 0.5)}h` : `-${Math.round(currentAnnualScreen * 0.5)}h`}
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif text-[#2c180c] mt-1 leading-snug font-bold">
                      {isImproved ? 'Hours rescued from doomscrolling.' : 'Hours surrendered to social feeds.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] sm:text-xs font-serif font-black text-[#5c3a21] uppercase tracking-wider block mb-0.5">
                      Deep Study Added
                    </span>
                    <span className={`font-mono text-3xl sm:text-4xl font-black ${isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'}`}>
                      {isImproved ? `+${Math.round(gainedStudyHours * 0.5)}h` : `-${Math.round(gainedStudyHours * 0.5)}h`}
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif text-[#2c180c] mt-1 leading-snug font-bold">
                      {isImproved ? 'Focused flow building discipline.' : 'Delayed study sessions & missed goals.'}
                    </p>
                  </div>
                </div>

                {/* Narrative Story */}
                <div className="py-1.5 text-sm sm:text-base lg:text-[17px] text-[#1a0f07] leading-relaxed font-serif">
                  <h4 className="font-handwriting text-xl sm:text-2xl font-black text-[#1a0f07] mb-1">
                    A Day in the Life of 6-Month {userName}:
                  </h4>
                  {isImproved ? (
                    <p className="font-medium text-[#2c180c] leading-relaxed">
                      <span className="float-left text-3xl sm:text-4xl font-serif font-black text-[#8b5a2b] leading-none pr-2 pt-0.5 select-none">W</span>
                      ith consistent 7.5h sleep, waking at 6:30 AM feels natural and energizing. Morning brain fog has completely disappeared. You have logged over 200 hours of deep work, completing high-priority projects ahead of time while feeling calm under pressure.
                    </p>
                  ) : (
                    <p className="font-medium text-[#2c180c] leading-relaxed">
                      <span className="float-left text-3xl sm:text-4xl font-serif font-black text-[#8b3d24] leading-none pr-2 pt-0.5 select-none">S</span>
                      ix months on autopilot. 5.2h average sleep and high screen time have disrupted your circadian rhythm. Afternoon cognitive crashes require 3+ cups of coffee, while focused study remains fragmented under constant notification alerts.
                    </p>
                  )}
                </div>

                {/* Navigation Row */}
                <div className={`flex items-center justify-between pt-2.5 sm:pt-3 border-t border-[#8b5a2b]/25 shrink-0 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs sm:text-sm font-serif text-[#5a3825] font-black italic">
                    Milestone 1 of 3 — 6-Month Self
                  </span>
                  <button
                    type="button"
                    onClick={() => scrollToSlide(1)}
                    className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-transparent font-serif font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-sm hover:shadow-lg active:scale-95 flex items-center gap-2.5 cursor-pointer group border-2 shrink-0 ${
                      isImproved
                        ? 'border-[#2c180c] hover:bg-[#2c180c] text-[#2c180c] hover:text-[#fce8ba]'
                        : 'border-[#4a1810] hover:bg-[#4a1810] text-[#4a1810] hover:text-[#fce8ba]'
                    }`}
                  >
                    {isRtl ? (
                      <>
                        <span className="text-base sm:text-lg leading-none transition-transform group-hover:-translate-x-1">←</span>
                        <span>Proceed to 5-Year Self</span>
                      </>
                    ) : (
                      <>
                        <span>Proceed to 5-Year Self</span>
                        <span className="text-base sm:text-lg leading-none transition-transform group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* SLIDE 2: YOUR FUTURE SELF FROM 5 YEARS                       */}
          {/* ------------------------------------------------------------ */}
          <div className="w-1/3 h-full overflow-y-auto overflow-x-hidden parchment-scroll flex items-center justify-center px-3 sm:px-8 py-2 shrink-0">
            <div className="w-full max-w-[1360px] min-h-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
              
              {/* Left Column: Illustration Image & Identity Quote */}
              <div className="w-full md:w-[44%] flex flex-col items-center justify-center">
                <div className="w-20 sm:w-24 h-4 sm:h-5 bg-[#eedab4]/95 border-y border-[#d4c19c]/80 shadow-xs rotate-1 mb-[-8px] z-20 backdrop-blur-[1px]" />
                <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] aspect-[253/156] rounded-2xl overflow-hidden border-3 sm:border-4 border-[#b59976]/70 shadow-[0_14px_34px_rgba(40,20,10,0.38)] relative group">
                  <img 
                    src={isImproved ? characterMedia.improved : characterMedia.unimproved} 
                    alt={`${characterMedia.name} 5 Years Future Self`} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = isImproved 
                        ? (characterMedia.improvedStatic || '/assets/characters/explorer_radiant.jpg')
                        : (characterMedia.unimprovedStatic || '/assets/characters/explorer_burnout.jpg');
                    }}
                  />
                </div>

                {/* Identity Quote */}
                <div className="mt-2 sm:mt-3 px-2 text-center max-w-[420px]">
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-serif font-black uppercase tracking-wider mb-1.5 border-2 ${
                    isImproved ? 'border-[#8b5a2b]/60 text-[#2c180c] bg-[#ebd8c0]/40' : 'border-[#8b3d24]/60 text-[#4a1810] bg-[#ebd8c0]/40'
                  }`}>
                    {isImproved ? '✦ Horizon: Transcendent Mastery' : '⚠ Warning: The Stagnation Trap'}
                  </span>
                  <p className="font-handwriting text-xl sm:text-2xl text-[#1a0f07] italic font-black leading-snug drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                    {isImproved ? characterMedia.identityImprovedQuote : characterMedia.identityUnimprovedQuote}
                  </p>
                </div>
              </div>

              {/* Right Column: 5-Year Compounded Reality */}
              <div className="w-full md:w-[56%] flex flex-col justify-between min-h-full py-1 sm:py-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-serif font-black uppercase tracking-wider bg-transparent border border-[#8b5a2b] text-[#2c180c]">
                      {isImproved ? 'Consequence: If You Improve' : "Consequence: If You Don't Improve"}
                    </span>
                    <span className="text-xs sm:text-sm font-serif font-bold text-[#6a4224]">
                      {userName}'s 5-Year Transformed Identity
                    </span>
                  </div>

                  <h2 className={`font-handwriting text-2xl sm:text-3xl lg:text-[40px] font-black leading-tight tracking-wide ${
                    isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'
                  }`}>
                    {isImproved
                      ? `${userName}'s 5th-Year Reality: The Master Self`
                      : `${userName}'s 5th-Year Reality: The Burden of Delay`}
                  </h2>
                </div>

                {/* 3 Metric Columns for 5 Years */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 my-2 sm:my-2.5 py-2 sm:py-2.5 border-y-2 border-[#8b5a2b]/25">
                  <div className="sm:border-r border-[#8b5a2b]/25 sm:pr-3">
                    <span className="text-[11px] sm:text-xs font-serif font-black text-[#5c3a21] uppercase tracking-wider block mb-0.5">
                      Autonomy & Vitality
                    </span>
                    <span className={`font-mono text-3xl sm:text-4xl font-black ${isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'}`}>
                      {isImproved ? '99/100' : '24/100'}
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif text-[#2c180c] mt-1 leading-snug font-bold">
                      {isImproved ? 'Peak cognitive fitness & deep energy.' : 'Chronic burnout & biological fatigue.'}
                    </p>
                  </div>

                  <div className="sm:border-r border-[#8b5a2b]/25 sm:pr-3">
                    <span className="text-[11px] sm:text-xs font-serif font-black text-[#5c3a21] uppercase tracking-wider block mb-0.5">
                      Financial Cushion
                    </span>
                    <span className={`font-mono text-2xl sm:text-3xl font-black tracking-tight block ${isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'}`}>
                      {isImproved ? '+$18,400' : 'Vulnerable'}
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif text-[#2c180c] mt-1 leading-snug font-bold">
                      {isImproved ? 'Compounding savings & investments.' : 'Living paycheck to paycheck under stress.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] sm:text-xs font-serif font-black text-[#5c3a21] uppercase tracking-wider block mb-0.5">
                      Career Velocity
                    </span>
                    <span className={`font-mono text-2xl sm:text-3xl font-black tracking-tight block ${isImproved ? 'text-[#243d26]' : 'text-[#5c2419]'}`}>
                      {isImproved ? 'Top 5%' : 'Stagnant'}
                    </span>
                    <p className="text-xs sm:text-[13px] font-serif text-[#2c180c] mt-1 leading-snug font-bold">
                      {isImproved ? 'Recognized leader in your craft.' : 'Delayed aspirations and missed opportunities.'}
                    </p>
                  </div>
                </div>

                {/* Narrative Story */}
                <div className="py-1.5 text-sm sm:text-base lg:text-[17px] text-[#1a0f07] leading-relaxed font-serif">
                  <h4 className="font-handwriting text-xl sm:text-2xl font-black text-[#1a0f07] mb-1">
                    The 5-Year Horizon for {userName}:
                  </h4>
                  {isImproved ? (
                    <p className="font-medium text-[#2c180c] leading-relaxed">
                      <span className="float-left text-3xl sm:text-4xl font-serif font-black text-[#8b5a2b] leading-none pr-2 pt-0.5 select-none">H</span>
                      alf a decade of consistent 1% daily habits. You have accumulated over 4,200 hours of focused mastery. Your habits run effortlessly on autopilot. Waking up energized, executing challenging projects, and living with financial freedom has become who you are.
                    </p>
                  ) : (
                    <p className="font-medium text-[#2c180c] leading-relaxed">
                      <span className="float-left text-3xl sm:text-4xl font-serif font-black text-[#8b3d24] leading-none pr-2 pt-0.5 select-none">F</span>
                      ive years have vanished. The habits that once felt harmless have formed an unbreakable cage. Over 14,000 hours were surrendered to digital distraction. Health and self-esteem bear the toll of postponed potential, while peers have advanced far ahead.
                    </p>
                  )}
                </div>

                {/* Navigation Row */}
                <div className={`flex items-center justify-between pt-2.5 sm:pt-3 border-t border-[#8b5a2b]/25 shrink-0 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => scrollToSlide(0)}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-transparent hover:bg-[#8b5a2b]/15 text-[#4a2e18] border-2 border-[#8b5a2b]/70 font-serif font-black text-xs sm:text-sm tracking-wide uppercase transition-all cursor-pointer active:scale-95 flex items-center gap-2 group shrink-0"
                  >
                    {isRtl ? (
                      <>
                        <span>Back to 6 Months</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </>
                    ) : (
                      <>
                        <span className="transition-transform group-hover:-translate-x-1">←</span>
                        <span>Back to 6 Months</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSlide(2)}
                    className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-transparent font-serif font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-sm hover:shadow-lg active:scale-95 flex items-center gap-2.5 cursor-pointer group border-2 shrink-0 ${
                      isImproved
                        ? 'border-[#2c180c] hover:bg-[#2c180c] text-[#2c180c] hover:text-[#fce8ba]'
                        : 'border-[#4a1810] hover:bg-[#4a1810] text-[#4a1810] hover:text-[#fce8ba]'
                    }`}
                  >
                    {isRtl ? (
                      <>
                        <span className="text-base sm:text-lg leading-none transition-transform group-hover:-translate-x-1">← ✉</span>
                        <span>Read Future Self Letter</span>
                      </>
                    ) : (
                      <>
                        <span>Read Future Self Letter</span>
                        <span className="text-base sm:text-lg leading-none transition-transform group-hover:translate-x-1">✉ →</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* SLIDE 3: MESSAGE FROM YOUR FUTURE SELF (THE HANDWRITTEN LETTER) */}
          {/* ------------------------------------------------------------ */}
          <div className="w-1/3 h-full overflow-y-auto overflow-x-hidden parchment-scroll flex items-start justify-center px-4 sm:px-10 py-3 sm:py-4 shrink-0">
            <div className="w-full max-w-[1080px] min-h-full flex flex-col justify-between py-1 sm:py-2">
              
              {/* Letter Header with Stamp */}
              <div className="flex items-center justify-between border-b-2 border-[#8b5a2b]/30 pb-1.5 sm:pb-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-transparent border-2 border-[#8b5a2b] text-[#2c180c] text-base sm:text-lg font-bold shadow-xs">
                    ✉
                  </div>
                  <div>
                    <span className="text-[11px] sm:text-xs font-serif font-black uppercase tracking-wider text-[#6a4224]">
                      {dynamicLetter?.subtitle || 'Special Delivery from 5 Years Later'}
                    </span>
                    <h3 className="font-handwriting text-2xl sm:text-3xl lg:text-[34px] font-black text-[#1a0f07] leading-tight">
                      {dynamicLetter?.title || (isImproved 
                        ? `A Letter of Gratitude from Future ${userName}` 
                        : `A Sincere Wake-Up Call from Future ${userName}`)}
                    </h3>
                  </div>
                </div>

                {/* Vintage Wax Seal Indicator */}
                <div className={`px-3 py-1 rounded-full text-xs font-serif font-black tracking-wider uppercase border-2 shadow-xs shrink-0 ${
                  isImproved
                    ? 'bg-transparent border-[#8b5a2b] text-[#2c180c]'
                    : 'bg-transparent border-[#8b3d24] text-[#4a1810]'
                }`}>
                  {dynamicLetter?.seal_badge || (isImproved ? '✦ Sealed with Hope' : '⚠ Warning Notice')}
                </div>
              </div>

              {/* Dynamic AI Data Grounding Ribbon */}
              {dynamicLetter && (
                <div className="w-full flex flex-wrap items-center justify-between gap-1.5 py-1 px-2.5 my-1.5 bg-[#8b5a2b]/10 border border-[#8b5a2b]/30 rounded-lg text-xs font-serif shrink-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-[#4a2e18]">✦ LLM Generation:</span>
                    <span className="px-2 py-0.5 rounded bg-white/50 border border-[#8b5a2b]/25 font-mono text-[11px] font-bold text-[#1e3a8a]">
                      {dynamicLetter.model_used || 'Google Gemini / Behavioral AI'}
                    </span>
                    {dynamicLetter.archetype_detected && (
                      <span className="px-2 py-0.5 rounded bg-amber-900/10 border border-amber-800/30 font-sans text-[11px] font-black text-[#5a2e18]">
                        {dynamicLetter.archetype_detected.label}
                      </span>
                    )}
                  </div>
                  {dynamicLetter.data_citations && (
                    <div className="flex items-center gap-1 flex-wrap text-[10.5px] font-mono text-[#5a381e] font-semibold">
                      <span>Analyzed:</span>
                      {dynamicLetter.data_citations.map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-[#faecd4] border border-[#cfb696]/60">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Letter Body or Sealed Invitation Card */}
              <div className="py-2 px-1 sm:px-2 text-[#1a0f07] font-handwriting leading-relaxed">
                {loadingLetter ? (
                  <div className="py-16 sm:py-20 flex flex-col items-center justify-center gap-4 select-none">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-[#8b5a2b]/30 border-t-[#8b5a2b] rounded-full animate-spin" />
                      <span className="absolute text-xl">📜</span>
                    </div>
                    <div className="text-center">
                      <p className="font-serif italic font-bold text-base sm:text-lg text-[#3d2414]">
                        ✦ Synthesizing personal dispatch from 2031...
                      </p>
                      <p className="font-sans text-xs text-[#6a4224] mt-1 font-semibold">
                        Analyzing your live habit data with Google Gemini AI
                      </p>
                    </div>
                  </div>
                ) : !dynamicLetter && !hasRequestedLetter ? (
                  /* Initially: Clean Sealed Letter Invitation */
                  <div className="py-10 sm:py-14 px-4 flex flex-col items-center justify-center text-center select-none">
                    {/* Vintage Wax Seal & Envelope Graphic */}
                    <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-[#ebd8c0] to-[#dfc4a2] border-3 border-[#8b5a2b] flex items-center justify-center shadow-[0_12px_28px_rgba(50,25,10,0.25)] mb-4">
                      <span className="text-4xl sm:text-5xl drop-shadow-md">✉️</span>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#8b3d24] border-2 border-[#fce8ba] flex items-center justify-center text-[11px] text-[#fce8ba] font-serif font-black shadow-md">
                        2031
                      </div>
                    </div>

                    <span className="text-xs sm:text-[13px] font-serif font-black uppercase tracking-widest text-[#7a4825] mb-1">
                      {isImproved ? '✦ A Glimpse Across 5 Years of Growth' : '⚠ An Urgent Message Across Time'}
                    </span>

                    <h4 className="font-handwriting text-3xl sm:text-4xl lg:text-[40px] font-black text-[#2c180c] leading-tight mb-2 max-w-lg">
                      {isImproved 
                        ? 'A Letter of Gratitude from Your Future Self' 
                        : 'A Candid Wake-Up Call from Your Future Self'}
                    </h4>

                    <p className="font-serif text-xs sm:text-sm md:text-base text-[#4a2e18] max-w-md mx-auto leading-relaxed mb-6 font-medium">
                      {isImproved
                        ? `Experience a custom, AI-generated letter written by future ${userName} from the year 2031, reflecting on how your compound habits shaped their reality.`
                        : `Read an honest, AI-synthesized warning from future ${userName} from the year 2031 about what happens if current friction habits continue unchanged.`}
                    </p>

                    {/* Prominent Action Button to Generate with AI */}
                    <button
                      type="button"
                      onClick={handleGenerateLetter}
                      className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#2c180c] via-[#4a2b16] to-[#2c180c] hover:from-[#3d2414] hover:to-[#3d2414] text-[#fce8ba] font-serif font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_10px_28px_rgba(44,24,12,0.45)] hover:shadow-[0_14px_34px_rgba(44,24,12,0.65)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-3 border-2 border-[#b59976]/60 group"
                      title="Click to generate your personal letter from the future"
                    >
                      <span className="text-lg">✨</span>
                      <span>See Letter from Your Future Self</span>
                      <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-black mb-1.5 sm:mb-2 text-lg sm:text-xl lg:text-[23px]">
                      {dynamicLetter?.greeting || `Dear ${userName},`}
                    </p>

                    {dynamicLetter && dynamicLetter.paragraphs && dynamicLetter.paragraphs.length > 0 ? (
                      dynamicLetter.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="mb-2 font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          {p}
                        </p>
                      ))
                    ) : isImproved ? (
                      <>
                        <p className="mb-2 font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          I am writing to you from five years down the road. As I sit here in the quiet glow of early morning, looking out over the mountain sunrise, I had to write this to say: <em className="underline decoration-[#8b5a2b]/60">thank you.</em>
                        </p>
                        <p className="mb-2 font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          Thank you for making the quiet choice to improve on that ordinary evening. When you put the phone down, when you committed to waking up at 6:30 AM, and when you protected your study time—no one was clapping for you. But every single 1% gain was an investment in the freedom, the clarity, and the vitality I enjoy today.
                        </p>
                        <p className="font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          Do not doubt yourself this morning. The discipline you build today is quietly creating the person I love being.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="mb-2 font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          I am writing this from a future you didn't mean to create. I wish I could tell you that everything worked out on its own, but it didn't.
                        </p>
                        <p className="mb-2 font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          The late nights and constant screen scrolling didn't feel catastrophic on any single day, but over five years they cost us over 14,000 hours. We watched our peers advance while we stayed stuck in the same cycle of fatigue, brain fog, and postponed goals. The hardest part isn't failure—it's knowing that we had all the potential in the world, and let it slip away.
                        </p>
                        <p className="font-bold leading-relaxed text-lg sm:text-xl lg:text-[23px]">
                          Please, break the loop tonight. Close the screen. Sleep on time. You still have the power to change my reality.
                        </p>
                      </>
                    )}

                    <div className="mt-2.5 sm:mt-3 text-right">
                      <span className="block font-black text-lg sm:text-xl">
                        {dynamicLetter?.signature 
                          ? `— ${dynamicLetter.signature}` 
                          : (isImproved ? '— Your Future Self (With Boundless Gratitude)' : '— Your Default Future Self (Still Hoping You Choose Differently)')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Letter Actions Row */}
              <div className={`flex items-center justify-between pt-2.5 sm:pt-3 border-t-2 border-[#8b5a2b]/30 shrink-0 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => scrollToSlide(1)}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-transparent hover:bg-[#8b5a2b]/15 text-[#4a2e18] border-2 border-[#8b5a2b]/70 font-serif font-black text-xs sm:text-sm tracking-wide uppercase transition-all cursor-pointer active:scale-95 flex items-center gap-2 group shrink-0"
                >
                  {isRtl ? (
                    <>
                      <span>Review 5-Year Self</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </>
                  ) : (
                    <>
                      <span className="transition-transform group-hover:-translate-x-1">←</span>
                      <span>Review 5-Year Self</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {(dynamicLetter || hasRequestedLetter) && (
                    <button
                      type="button"
                      disabled={loadingLetter}
                      onClick={handleGenerateLetter}
                      className="px-4 py-2 rounded-full bg-[#1e3a8a]/10 hover:bg-[#1e3a8a]/20 border-2 border-[#1e3a8a]/50 text-[#1e3a8a] text-xs font-serif font-black tracking-wide flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0"
                      title="Regenerate this letter using latest live habit dataset"
                    >
                      <span className={loadingLetter ? 'animate-spin' : ''}>↻</span>
                      <span>{loadingLetter ? 'Synthesizing...' : 'Regenerate Letter with AI'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onBackToChoices}
                    className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-transparent hover:bg-[#2c180c] text-[#2c180c] hover:text-[#fce8ba] font-serif font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-sm cursor-pointer border-2 border-[#2c180c] active:scale-95 flex items-center gap-2 group shrink-0"
                    title="Return to Consequences of Your Choice"
                  >
                    {isRtl ? (
                      <>
                        <span>Return to Consequences</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </>
                    ) : (
                      <>
                        <span className="transition-transform group-hover:-translate-x-1">←</span>
                        <span>Return to Consequences</span>
                      </>
                    )}
                  </button>
                </div>
              </div>


            </div>
          </div>

          </div>
        </div>

        {/* Bottom Slider Dots Indicator */}
        <div className={`flex items-center gap-2 py-1 select-none z-30 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeSlide === idx 
                  ? isImproved ? 'w-8 bg-[#2c180c]' : 'w-8 bg-[#4a1810]' 
                  : 'w-2 bg-[#8b5a2b]/40 hover:bg-[#8b5a2b]'
              }`}
              title={`Go to Slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE 4 COMPONENT (Bi-Directional 3-Panel Horizontal Track)
// ============================================================================
export default function FutureScenarios({ onScrollToPage3, onScrollToHome, mouseParallax }) {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState(
    typeof window !== 'undefined' && (window.location.search.includes('timeline') || window.location.search.includes('simulate') || window.location.search.includes('modal'))
      ? 'timeline'
      : 'choices'
  ); // 'choices' | 'timeline'

  const [selectedPath, setSelectedPath] = useState(
    typeof window !== 'undefined' && window.location.search.includes('unimproved') ? 'unimproved' : 'improved'
  ); // 'unimproved' | 'improved'

  const [mobileFutureTab, setMobileFutureTab] = useState('unimproved'); // 'unimproved' | 'improved'

  // Handle ESC key to return to choices view
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && viewMode === 'timeline') {
        setViewMode('choices');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  // Read recorded metrics scoped to active user
  const [recordedMetrics, setRecordedMetrics] = useState(() => {
    try {
      const storageKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { sleep: 5.2, study: 2.1, screen: 7.8, exercise: 0.3, spending: 280, hydration: 1.5 };
  });

  useEffect(() => {
    const storageKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setRecordedMetrics(JSON.parse(saved));
    } catch (e) {}
  }, [user?.id]);

  useEffect(() => {
    const handleHabitsUpdated = (e) => {
      if (e.detail?.metrics) {
        setRecordedMetrics(e.detail.metrics);
      } else {
        try {
          const storageKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
          const saved = localStorage.getItem(storageKey);
          if (saved) setRecordedMetrics(JSON.parse(saved));
        } catch (err) {}
      }
    };
    window.addEventListener('future-you-habits-updated', handleHabitsUpdated);
    return () => window.removeEventListener('future-you-habits-updated', handleHabitsUpdated);
  }, [user?.id]);

  const currentSleep = recordedMetrics.sleep ?? 5.2;
  const currentStudy = recordedMetrics.study ?? 2.1;
  const currentScreen = recordedMetrics.screen ?? 7.8;
  const currentExercise = recordedMetrics.exercise ?? 0.3;

  // Optimized target values
  const targetSleep = 7.5;
  const targetStudy = 4.5;
  const targetScreen = 3.2;
  const targetExercise = 1.0;

  // Calculated cumulative annual hours
  const currentAnnualStudy = Math.round(currentStudy * 365);
  const currentAnnualScreen = Math.round(currentScreen * 365);
  const targetAnnualStudy = Math.round(targetStudy * 365);
  const targetAnnualScreen = Math.round(targetScreen * 365);

  const reclaimedAnnualHours = Math.max(0, currentAnnualScreen - targetAnnualScreen);
  const gainedStudyHours = Math.max(0, targetAnnualStudy - currentAnnualStudy);

  const userName = user?.name || 'Explorer';
  const characterMedia = getCharacterMedia(user);

  const handleOpenPath = (path) => {
    setSelectedPath(path);
    setViewMode('timeline');
  };

  const handleBackToChoices = () => {
    setViewMode('choices');
  };

  return (
    <div className="relative w-screen h-screen min-h-[600px] overflow-hidden flex items-center justify-center select-none font-caacupe">
      
      {/* 1. WOOD DESK BACKGROUND WITH AMBIENT SUNLIGHT SHADOWS (Matching Page 2 & 3) */}
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

      {/* ============================================================== */}
      {/* 3. TRIPLE-SCREEN HORIZONTAL TRACK (Bi-Directional Sliding)      */}
      {/* ============================================================== */}
      {/* 
        Panel 0 (Left):   Unimproved Timeline (translateX(0%))
        Panel 1 (Center): Choices Open Book Spread (translateX(-33.333333%))
        Panel 2 (Right):  Improved Timeline (translateX(-66.666667%))
      */}
      <div 
        className="absolute inset-0 w-[300%] h-full flex transition-transform duration-700 ease-in-out z-10"
        style={{
          transform: viewMode === 'choices'
            ? 'translateX(-33.333333%)'
            : selectedPath === 'unimproved'
              ? 'translateX(0%)'
              : 'translateX(-66.666667%)',
        }}
      >
        {/* ============================================================== */}
        {/* PANEL 0 (LEFT): UNIMPROVED TIMELINE (Slides in from the Left)  */}
        {/* ============================================================== */}
        <TimelineMilestones
          path="unimproved"
          userName={userName}
          user={user}
          onBackToChoices={handleBackToChoices}
          reclaimedAnnualHours={reclaimedAnnualHours}
          gainedStudyHours={gainedStudyHours}
          currentAnnualScreen={currentAnnualScreen}
          metrics={recordedMetrics}
        />

        {/* ============================================================== */}
        {/* PANEL 1 (CENTER): THE TWO PATHS OPEN BOOK SPREAD               */}
        {/* ============================================================== */}
        <div className="w-1/3 h-full relative flex-shrink-0 flex items-center justify-center overflow-hidden">
          
          {/* CHERRY BLOSSOM SCENE FRAMING (Inside Screen 1 so it slides together with Book) */}
          <div 
            className="absolute inset-0 w-full h-full pointer-events-none select-none z-30 overflow-hidden transition-transform duration-700 ease-out"
            style={{
              transform: 'translate3d(calc(var(--mouse-x, 0) * -3.5px), calc(var(--mouse-y, 0) * -2.5px), 0)',
            }}
          >
            {/* Top-Right Blooming Cherry Blossom Branch (Original from User) */}
            <div className="absolute -top-4 sm:-top-6 -right-2 sm:-right-4 w-[50%] max-w-[760px] pointer-events-none select-none z-30 animate-sakura-branch">
              <img 
                src="/assets/page4/cherry_blossom.png" 
                alt="Anime blooming cherry blossom branch" 
                className="w-full h-auto object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.48)]"
              />
            </div>

            {/* Top-Left Hanging Leaf Canopy for balanced atmospheric depth */}
            <div className="absolute -top-12 sm:-top-18 md:-top-22 -left-8 sm:-left-12 w-[36%] max-w-[520px] pointer-events-none select-none opacity-85">
              <img 
                src="/assets/wind_leaves.png" 
                alt="Sunlit leaves canopy" 
                className="w-full h-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.6)] rotate-[-3deg]"
              />
            </div>

            {/* Left Viewport Border Botanical Daisies */}
            <div className="absolute -left-6 sm:-left-8 top-[18%] w-32 sm:w-44 md:w-56 pointer-events-none select-none opacity-80">
              <img 
                src="/assets/foliage_left_natural.png" 
                alt="Left botanical foliage" 
                className="w-full h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
              />
            </div>

            {/* Bottom-Right Corner Foliage */}
            <div className="absolute -right-4 sm:-right-6 -bottom-6 sm:-bottom-8 w-44 sm:w-56 md:w-68 pointer-events-none select-none opacity-80">
              <img 
                src="/assets/foliage_corner_br_natural.png" 
                alt="Bottom right foliage" 
                className="w-full h-auto object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Drifting Sakura Petals across the open scene */}
            <div className="absolute inset-0 pointer-events-none select-none z-35 overflow-hidden">
              <img 
                src="/assets/page4/petal_1.png" 
                alt="Floating sakura petal" 
                className="absolute top-[16%] right-[28%] w-5 sm:w-7 h-auto animate-sakura-petal-1 drop-shadow-sm"
              />
              <img 
                src="/assets/page4/petal_2.png" 
                alt="Floating sakura petal" 
                className="absolute top-[28%] right-[10%] w-6 sm:w-8 h-auto animate-sakura-petal-2 drop-shadow-sm"
              />
              <img 
                src="/assets/page4/petal_3.png" 
                alt="Floating sakura petal" 
                className="absolute top-[8%] right-[40%] w-5 sm:w-6 h-auto animate-sakura-petal-3 drop-shadow-sm"
              />
            </div>
          </div>

          {/* Top Left Badge: 4. Choose Your Journey (Desktop Only) */}
          <div className="hidden lg:block absolute top-4 sm:top-5 left-4 sm:left-7 z-40 select-none">
            <div className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#ebd8c0]/95 backdrop-blur-xs border border-[#cfb696] shadow-[0_4px_12px_rgba(40,20,10,0.25)] flex items-center gap-1.5">
              <span className="font-sans font-black text-xs sm:text-sm text-[#2c180c]">
                4.
              </span>
              <span className="font-caacupe font-bold text-xs sm:text-sm text-[#4a2e18]">
                Choose Your Journey
              </span>
            </div>
          </div>

          {/* Top Center Banner: Choose Your Journey Parchment Scroll Banner (Desktop Only) */}
          <div className="hidden lg:flex absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-40 select-none pointer-events-none flex-col items-center">
            <div className="relative px-7 sm:px-12 py-2 sm:py-2.5 max-w-[92vw] flex flex-col items-center justify-center">
              {/* Deckled Parchment Scroll Texture */}
              <img 
                src="/assets/page4/parchment_clean_alpha.png" 
                alt="Parchment banner" 
                className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-[0_8px_20px_rgba(30,15,5,0.4)] -rotate-0.5" 
              />
              
              <div className="relative z-10 flex flex-col items-center text-center px-4 py-1">
                <h1 className="font-handwriting text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black text-[#2c180c] leading-none tracking-wide drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">
                  Choose Your Journey
                </h1>
                <p className="font-caacupe text-[11px] sm:text-xs md:text-[13px] text-[#4a2e18]/90 mt-0.5 max-w-[440px] font-medium leading-tight">
                  A small change today can lead to a very different tomorrow.
                </p>
              </div>
            </div>
          </div>

          {/* THE BIG OPEN JOURNAL (Desktop Spread >= lg) */}
          <div 
            className="hidden lg:flex relative z-10 w-[96%] max-w-[1850px] aspect-[1.84/1] max-h-[94vh] items-center justify-center transition-transform duration-500 ease-out mt-3 sm:mt-4"
            style={{
              transform: 'translate3d(calc(var(--mouse-x, 0) * 3px), calc(var(--mouse-y, 0) * 2px), 0)',
            }}
          >
            {/* Open Book Background Asset */}
            <img 
              src="/assets/open_book_wide.png" 
              alt="Open Journal" 
              className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_28px_60px_rgba(0,0,0,0.88)]"
            />

            {/* Center binding crease shadow */}
            <div className="absolute left-1/2 top-[6%] -translate-x-1/2 w-[2.2%] h-[88%] bg-gradient-to-r from-black/10 via-black/20 to-black/10 blur-[1px] pointer-events-none z-20" />

            {/* CENTER WOODEN SIGNPOST: "Two Choices" / "Two Futures" */}
            <div className="absolute left-1/2 top-[26%] -translate-x-1/2 z-25 pointer-events-none select-none flex flex-col items-center">
              <div className="relative flex flex-col items-center">
                {/* Top Sign: Consequences of Your Choice */}
                <div className="relative px-3 sm:px-4 py-1 sm:py-1.5 rounded-sm bg-[#e8c89b] border-2 border-[#8b5a2b] shadow-[0_4px_12px_rgba(45,25,10,0.45)] rotate-[-2deg] flex items-center justify-center mb-1">
                  <span className="font-handwriting text-xs sm:text-sm md:text-base font-black text-[#2e190a] whitespace-nowrap">
                    Consequences of Your Choice
                  </span>
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#241307] shadow-xs" />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#241307] shadow-xs" />
                </div>

                {/* Bottom Sign: Two Futures */}
                <div className="relative px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-sm bg-[#e8c89b] border-2 border-[#8b5a2b] shadow-[0_4px_12px_rgba(45,25,10,0.45)] rotate-[2deg] flex items-center justify-center">
                  <span className="font-handwriting text-base sm:text-lg md:text-xl font-black text-[#2e190a] whitespace-nowrap">
                    Two Futures
                  </span>
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#241307] shadow-xs" />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#241307] shadow-xs" />
                </div>

                {/* Wooden Timber Post */}
                <div className="w-3.5 sm:w-4 h-48 sm:h-60 bg-gradient-to-r from-[#6b4226] via-[#8b5a2b] to-[#5a361c] border-x border-[#4a2b15] shadow-[0_6px_12px_rgba(0,0,0,0.5)] mt-[-10px] z-[-1] rounded-b-xs" />
              </div>
            </div>

            {/* LEFT PAGE: "If You Don't Improve" (Swipes to Left-Hand Side) */}
            <div className="absolute left-[10.5%] top-[11.5%] w-[37%] h-[76%] flex flex-col justify-between items-center z-10 select-none px-2 sm:px-4 py-1">
              
              {/* Top Section: Washi Tape & Illustration Photo */}
              <div className="w-full flex flex-col items-center shrink-0">
                <div className="w-20 sm:w-24 h-4 sm:h-5 bg-[#eedab4]/95 border-y border-[#d4c19c]/80 shadow-xs -rotate-1 mb-[-6px] z-20 backdrop-blur-[1px]" />
                
                <div 
                  className="w-[82%] max-w-[270px] aspect-[253/156] rounded-xl overflow-hidden border-2 border-[#cfb696]/80 shadow-[0_8px_20px_rgba(40,20,10,0.32)] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                  onClick={() => handleOpenPath('unimproved')}
                  title="Click to swipe left into your timeline if you don't improve"
                >
                  <img 
                    src={characterMedia.unimproved} 
                    alt={`If You Don't Improve - ${characterMedia.name}`} 
                    className="w-full h-full object-cover pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = characterMedia.unimprovedStatic || '/assets/characters/explorer_burnout.jpg';
                    }}
                  />
                </div>

                <h2 className="font-handwriting text-3xl sm:text-4xl md:text-[40px] font-black text-[#4a1810] mt-2 mb-0.5 tracking-wide text-center leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                  If You Don't Improve
                </h2>
              </div>

              {/* Middle Section: Habits List */}
              <div className="w-full max-w-[320px] flex flex-col gap-3.5 sm:gap-4.5 my-auto px-1">
                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#4a1810]/10 flex items-center justify-center shrink-0 text-[#4a1810] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      <polyline points="21 3 21 9 15 9" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Irregular Sleep
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#4a1810]/10 flex items-center justify-center shrink-0 text-[#4a1810] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    High Screen Time
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#4a1810]/10 flex items-center justify-center shrink-0 text-[#4a1810] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Inconsistent Study
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#4a1810]/10 flex items-center justify-center shrink-0 text-[#4a1810] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Low Physical Activity
                  </span>
                </div>
              </div>

              {/* Bottom Section: See the consequences of your choices Button (RED) */}
              <div className="w-full flex justify-center shrink-0 mb-1">
                <button
                  type="button"
                  onClick={() => handleOpenPath('unimproved')}
                  className="w-[92%] max-w-[340px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-full bg-[#8e2b20] hover:bg-[#a63428] text-white font-sans font-black text-xs sm:text-sm md:text-[15px] tracking-wide shadow-[0_10px_24px_rgba(142,43,32,0.55)] hover:shadow-[0_12px_28px_rgba(142,43,32,0.7)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[#b84a3b]/60 group text-center"
                  title="Click to see the consequences of your choices"
                >
                  <span className="leading-snug">See the consequences of your choices</span>
                  <span className="text-base sm:text-lg font-bold leading-none transition-transform group-hover:translate-x-1 shrink-0">→</span>
                </button>
              </div>

            </div>

            {/* RIGHT PAGE: "If You Improve" (Swipes to Right-Hand Side) */}
            <div className="absolute left-[52.5%] top-[11.5%] w-[37%] h-[76%] flex flex-col justify-between items-center z-10 select-none px-2 sm:px-4 py-1">
              
              {/* Top Section: Washi Tape & Illustration Photo */}
              <div className="w-full flex flex-col items-center shrink-0">
                <div className="w-20 sm:w-24 h-4 sm:h-5 bg-[#eedab4]/95 border-y border-[#d4c19c]/80 shadow-xs rotate-1 mb-[-6px] z-20 backdrop-blur-[1px]" />
                
                <div 
                  className="w-[82%] max-w-[270px] aspect-[253/156] rounded-xl overflow-hidden border-2 border-[#cfb696]/80 shadow-[0_8px_20px_rgba(20,40,15,0.32)] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                  onClick={() => handleOpenPath('improved')}
                  title="Click to swipe right into your 6-month & 5-year timeline"
                >
                  <img 
                    src={characterMedia.improved} 
                    alt={`If You Improve - ${characterMedia.name}`} 
                    className="w-full h-full object-cover pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = characterMedia.improvedStatic || '/assets/characters/explorer_radiant.jpg';
                    }}
                  />
                </div>

                <h2 className="font-handwriting text-3xl sm:text-4xl md:text-[40px] font-black text-[#1e3d22] mt-2 mb-0.5 tracking-wide text-center leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
                  If You Improve
                </h2>
              </div>

              {/* Middle Section: Habits List */}
              <div className="w-full max-w-[320px] flex flex-col gap-3.5 sm:gap-4.5 my-auto px-1">
                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e3d22]/10 flex items-center justify-center shrink-0 text-[#1e3d22] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Consistent Sleep
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e3d22]/10 flex items-center justify-center shrink-0 text-[#1e3d22] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Focused Study
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e3d22]/10 flex items-center justify-center shrink-0 text-[#1e3d22] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Regular Exercise
                  </span>
                </div>

                <div className="flex items-center gap-3.5 text-[#2c180c]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1e3d22]/10 flex items-center justify-center shrink-0 text-[#1e3d22] shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                      <circle cx="12" cy="12" r="8" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                  <span className="font-sans font-black text-base sm:text-lg md:text-[19px] text-[#2c180c] tracking-tight">
                    Better Financial Habits
                  </span>
                </div>
              </div>

              {/* Bottom Section: See the consequences of your choices Button (GREEN) */}
              <div className="w-full flex justify-center shrink-0 mb-1">
                <button
                  type="button"
                  onClick={() => handleOpenPath('improved')}
                  className="w-[92%] max-w-[340px] py-3 sm:py-3.5 px-4 sm:px-6 rounded-full bg-[#3c6e39] hover:bg-[#488244] text-white font-sans font-black text-xs sm:text-sm md:text-[15px] tracking-wide shadow-[0_10px_24px_rgba(60,110,57,0.55)] hover:shadow-[0_12px_28px_rgba(60,110,57,0.7)] hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-[#528d4e]/60 group text-center"
                  title="Click to see the consequences of your choices"
                >
                  <span className="leading-snug">See the consequences of your choices</span>
                  <span className="text-base sm:text-lg font-bold leading-none transition-transform group-hover:translate-x-1 shrink-0">→</span>
                </button>
              </div>

            </div>

          </div>

        {/* MOBILE JOURNAL VIEW (< lg) */}
        <div className="lg:hidden relative z-20 w-[94vw] max-w-[440px] sm:max-w-[500px] h-[84vh] max-h-[720px] bg-[#f7eedc] border-2 border-[#8c6b4f]/70 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col justify-between p-3.5 overflow-y-auto parchment-scroll select-none">
            
            {/* Header */}
            <div className="text-center mb-1 shrink-0">
              <h2 className="font-handwriting text-2xl font-bold text-[#2c180c] leading-tight">
                Two Futures: Your Choice
              </h2>
            </div>

            {/* Mobile Header Tabs */}
            <div className="flex items-center justify-center p-1 rounded-full bg-[#ebd8c0]/90 border border-[#8e6e53]/40 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => setMobileFutureTab('unimproved')}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                  mobileFutureTab === 'unimproved'
                    ? 'bg-[#4a1810] text-[#fce8ba] shadow-xs'
                    : 'text-[#5c3a22] hover:text-[#4a1810]'
                }`}
              >
                ⚠️ If You Don't Improve
              </button>
              <button
                type="button"
                onClick={() => setMobileFutureTab('improved')}
                className={`flex-1 py-1.5 px-2 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                  mobileFutureTab === 'improved'
                    ? 'bg-[#243d26] text-[#fce8ba] shadow-xs'
                    : 'text-[#5c3a22] hover:text-[#243d26]'
                }`}
              >
                🌟 If You Improve
              </button>
            </div>

            {/* Tab 1: Unimproved Future */}
            {mobileFutureTab === 'unimproved' ? (
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex flex-col items-center text-center">
                  {/* Polaroid Card */}
                  <div 
                    onClick={() => handleOpenPath('unimproved')}
                    className="w-full max-w-[260px] aspect-[16/10] rounded-xl overflow-hidden border-2 border-[#8c6b4f]/40 shadow-md cursor-pointer relative group"
                    title="Tap to explore burnout timeline"
                  >
                    <img 
                      src={characterMedia.unimproved} 
                      alt="If You Don't Improve" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = characterMedia.unimprovedStatic || '/assets/characters/explorer_burnout.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-1.5">
                      <span className="text-[11px] font-sans font-bold text-rose-200">
                        Tap to Explore 5-Year Drift →
                      </span>
                    </div>
                  </div>

                  <h3 className="font-handwriting text-2xl font-bold text-[#4a1810] mt-1.5 mb-1 leading-tight">
                    If You Don't Improve
                  </h3>

                  <div className="w-full space-y-1.5 my-1 text-left px-2">
                    {[
                      { label: 'Irregular Sleep', desc: '5.2h daily deficit & fatigue' },
                      { label: 'High Screen Time', desc: '7.8h daily distraction' },
                      { label: 'Inconsistent Study', desc: 'Missed compounding gains' },
                      { label: 'Low Physical Activity', desc: 'Stagnant energy levels' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-sans">
                        <span className="w-5 h-5 rounded-full bg-rose-900/15 text-rose-900 flex items-center justify-center font-bold text-xs shrink-0">
                          ✕
                        </span>
                        <div>
                          <span className="font-bold text-[#2c180c] block">{item.label}</span>
                          <span className="text-[10px] text-[#7a4836]">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPath('unimproved')}
                  className="w-full py-2.5 mt-2 rounded-full bg-[#8b3d24] hover:bg-[#6b2a15] text-[#faedd4] text-xs font-serif font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Explore Consequences (Burnout)</span>
                  <span>→</span>
                </button>
              </div>
            ) : (
              /* Tab 2: Improved Future */
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex flex-col items-center text-center">
                  {/* Polaroid Card */}
                  <div 
                    onClick={() => handleOpenPath('improved')}
                    className="w-full max-w-[260px] aspect-[16/10] rounded-xl overflow-hidden border-2 border-[#8c6b4f]/40 shadow-md cursor-pointer relative group"
                    title="Tap to explore flourishing timeline"
                  >
                    <img 
                      src={characterMedia.improved} 
                      alt="If You Improve" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = characterMedia.improvedStatic || '/assets/characters/explorer_radiant.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center p-1.5">
                      <span className="text-[11px] font-sans font-bold text-emerald-200">
                        Tap to Explore 5-Year Mastery →
                      </span>
                    </div>
                  </div>

                  <h3 className="font-handwriting text-2xl font-bold text-[#243d26] mt-1.5 mb-1 leading-tight">
                    If You Improve
                  </h3>

                  <div className="w-full space-y-1.5 my-1 text-left px-2">
                    {[
                      { label: 'Consistent Sleep', desc: '8.0h optimal restoration' },
                      { label: 'Focused Study', desc: '4.0h deliberate daily mastery' },
                      { label: 'Regular Exercise', desc: 'Peak vitality & cognition' },
                      { label: 'Better Financial Habits', desc: 'Compounding savings cushion' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-sans">
                        <span className="w-5 h-5 rounded-full bg-emerald-900/15 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </span>
                        <div>
                          <span className="font-bold text-[#2c180c] block">{item.label}</span>
                          <span className="text-[10px] text-[#366838]">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPath('improved')}
                  className="w-full py-2.5 mt-2 rounded-full bg-[#3c6e39] hover:bg-[#2c5329] text-white text-xs font-serif font-black uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Explore Consequences (Flourishing)</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* Mobile Bottom Navigation */}
            <div className="flex items-center justify-between pt-1.5 border-t border-[#8e6e53]/20 text-[11px] font-serif font-bold text-[#5c3a22]">
              <button 
                type="button" 
                onClick={onScrollToPage3}
                className="hover:text-[#24130a] flex items-center gap-1 cursor-pointer"
              >
                <span>↑</span>
                <span>Insights (Page 3)</span>
              </button>
              <button 
                type="button" 
                onClick={onScrollToHome}
                className="hover:text-[#24130a] flex items-center gap-1 cursor-pointer"
              >
                <span>Desk (Home)</span>
                <span>↑</span>
              </button>
            </div>

          </div>

          {/* Floating Return Controls at bottom right (Desktop Only) */}
          <div className="hidden lg:flex absolute right-3.5 sm:right-5 bottom-3 sm:bottom-4 z-40 items-center gap-2 select-none">
            <button
              type="button"
              onClick={onScrollToPage3}
              className="px-3.5 py-1.5 rounded-full bg-[#2a170c]/85 hover:bg-[#3d2414] text-[#faebd7] hover:text-[#ffd977] border border-[#b59976]/70 hover:border-[#deb15c] shadow-[0_4px_14px_rgba(30,15,5,0.35)] backdrop-blur-md font-serif font-black text-xs sm:text-sm tracking-wide transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer group"
              title="Scroll back to Page 3 (Insights & Habits)"
            >
              <span className="transition-transform group-hover:-translate-y-0.5">↑</span>
              <span>Insights</span>
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
        </div>

        {/* ============================================================== */}
        {/* PANEL 2 (RIGHT): IMPROVED TIMELINE (Slides in from the Right)  */}
        {/* ============================================================== */}
        <TimelineMilestones
          path="improved"
          userName={userName}
          user={user}
          onBackToChoices={handleBackToChoices}
          reclaimedAnnualHours={reclaimedAnnualHours}
          gainedStudyHours={gainedStudyHours}
          currentAnnualScreen={currentAnnualScreen}
          metrics={recordedMetrics}
        />

      </div>

    </div>
  );
}
