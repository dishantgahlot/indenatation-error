import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import DigitalTwinJournal from './components/DigitalTwinJournal';
import CurrentYouInsights from './components/CurrentYouInsights';
import FutureScenarios from './components/FutureScenarios';
import ViewportCreases from './components/ViewportCreases';
import CharacterSelectModal from './components/CharacterSelectModal';
import AuthModal from './components/AuthModal';
import { useUser } from './context/UserContext';

export default function App() {
  const { 
    user, 
    openCharacterModal,
    isAuthenticated,
    isAuthLoading,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    logout,
    loginNotification,
    dismissNotification
  } = useUser();
  const isDirectJourney = typeof window !== 'undefined' && window.location.search.includes('journey');
  const isDirectPage3 = typeof window !== 'undefined' && (window.location.search.includes('page3') || window.location.search.includes('insights'));
  const isDirectPage4 = typeof window !== 'undefined' && (window.location.search.includes('page4') || window.location.search.includes('scenarios') || window.location.search.includes('future') || window.location.search.includes('journey2'));
  const [activeNav, setActiveNav] = useState(isDirectPage4 ? 'Future' : (isDirectPage3 ? 'Insights' : (isDirectJourney ? 'Journey' : 'Home')));
  const activeNavRef = useRef(activeNav);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [needleSpin, setNeedleSpin] = useState(0);
  const [checklist, setChecklist] = useState({
    habits: true,
    simulate: true,
    futureSelf: true,
  });

  const containerRef = useRef(null);
  const homeRef = useRef(null);
  const journeyRef = useRef(null);
  const page3Ref = useRef(null);
  const page4Ref = useRef(null);
  const deskBookRef = useRef(null);
  const deskLeftGroupRef = useRef(null);
  const deskRightGroupRef = useRef(null);

  // Smooth scroll handler between pages using GSAP - strictly gates Page 2 to authenticated users
  const scrollToSection = (sectionId) => {
    const el = containerRef.current;
    if (!el) return;

    if (sectionId === 'home') {
      gsap.to(el, {
        scrollTop: 0,
        duration: 0.8,
        ease: 'power3.inOut'
      });
      return;
    }

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    let targetTop = 0;
    if (sectionId === 'journey') {
      targetTop = journeyRef.current?.offsetTop || window.innerHeight;
    } else if (sectionId === 'page3' || sectionId === 'insights') {
      targetTop = page3Ref.current?.offsetTop || window.innerHeight * 2;
    } else if (sectionId === 'page4' || sectionId === 'future' || sectionId === 'scenarios') {
      targetTop = page4Ref.current?.offsetTop || window.innerHeight * 3;
    }

    gsap.to(el, {
      scrollTop: targetTop,
      duration: 0.9,
      ease: 'power3.inOut'
    });
  };

  // GSAP Scroll Transition & Active Nav Sync - Zero-lag GPU direct transforms
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;

    const handleScrollTransitions = () => {
      const scrollTop = el.scrollTop;
      const vh = window.innerHeight;

      // GSAP Scroll Down Transition for Section 1 (Desk Elements)
      if (scrollTop <= vh * 1.2) {
        const progress = Math.min(1, Math.max(0, scrollTop / (vh * 0.85)));

        if (deskBookRef.current) {
          gsap.set(deskBookRef.current, {
            y: -progress * 110,
            scale: 1 + progress * 0.12,
            opacity: Math.max(0, 1 - progress * 1.2),
            force3D: true
          });
        }

        if (deskLeftGroupRef.current) {
          gsap.set(deskLeftGroupRef.current, {
            x: -progress * 160,
            opacity: Math.max(0, 1 - progress * 1.3),
            force3D: true
          });
        }

        if (deskRightGroupRef.current) {
          gsap.set(deskRightGroupRef.current, {
            x: progress * 160,
            opacity: Math.max(0, 1 - progress * 1.3),
            force3D: true
          });
        }
      }

      let newNav = 'Home';
      if (scrollTop > vh * 2.45) {
        newNav = 'Future';
      } else if (scrollTop > vh * 1.45) {
        newNav = 'Insights';
      } else if (scrollTop > vh * 0.45) {
        newNav = 'Journey';
      }

      if (activeNavRef.current !== newNav) {
        activeNavRef.current = newNav;
        setActiveNav(newNav);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(handleScrollTransitions);
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Handle URL hash or search params on initial load
  useEffect(() => {
    if (!isAuthenticated) return;
    const checkHash = () => {
      if (window.location.hash === '#future' || window.location.hash === '#page4' || window.location.hash === '#scenarios' || window.location.hash === '#section-page4' || window.location.search.includes('page4') || window.location.search.includes('scenarios') || window.location.search.includes('future')) {
        if (containerRef.current && page4Ref.current) {
          containerRef.current.scrollTo({ top: page4Ref.current.offsetTop, behavior: 'instant' });
        } else {
          page4Ref.current?.scrollIntoView({ behavior: 'instant' });
        }
        activeNavRef.current = 'Future';
        setActiveNav('Future');
      } else if (window.location.hash === '#insights' || window.location.hash === '#page3' || window.location.hash === '#section-page3' || window.location.search.includes('page3') || window.location.search.includes('insights')) {
        if (containerRef.current && page3Ref.current) {
          containerRef.current.scrollTo({ top: page3Ref.current.offsetTop, behavior: 'instant' });
        } else {
          page3Ref.current?.scrollIntoView({ behavior: 'instant' });
        }
        activeNavRef.current = 'Insights';
        setActiveNav('Insights');
      } else if (window.location.hash === '#journey' || window.location.hash === '#section-journey' || window.location.search.includes('journey')) {
        if (containerRef.current && journeyRef.current) {
          containerRef.current.scrollTo({ top: journeyRef.current.offsetTop, behavior: 'instant' });
        } else {
          journeyRef.current?.scrollIntoView({ behavior: 'instant' });
        }
        activeNavRef.current = 'Journey';
        setActiveNav('Journey');
      }
    };
    checkHash();
    const timer = setTimeout(checkHash, 150);
    window.addEventListener('hashchange', checkHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', checkHash);
    };
  }, [isAuthenticated]);

  // Ultra-smooth 60-120 FPS CSS-variable mouse parallax - zero React re-render overhead
  useEffect(() => {
    let ticking = false;
    let targetX = 0;
    let targetY = 0;

    const updateMouseVars = () => {
      document.documentElement.style.setProperty('--mouse-x', targetX);
      document.documentElement.style.setProperty('--mouse-y', targetY);
      ticking = false;
    };

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      targetX = ((e.clientX / innerWidth) - 0.5) * 2;
      targetY = ((e.clientY / innerHeight) - 0.5) * 2;

      if (!ticking) {
        requestAnimationFrame(updateMouseVars);
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Clicking the compass spins it dynamically, then it continues wandering
  const handleCompassClick = () => {
    setNeedleSpin(prev => prev + 180 + Math.floor(Math.random() * 90 - 45));
  };

  const handleGetStartedClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      scrollToSection('journey');
    }
  };

  const isLoadingScreenActive = isAuthLoading;

  return (
    <div 
      ref={containerRef}
      className={`relative w-screen h-screen ${!isAuthenticated ? 'overflow-y-hidden' : 'overflow-y-auto'} overflow-x-hidden snap-y snap-mandatory scroll-smooth font-caacupe selection:bg-[#B86F50]/30 selection:text-[#FAF0DC]`}
    >
      
      {/* 0. Fullscreen Home Page Loading Screen (Blurred Home Background + Classy Floating Card) */}
      {isLoadingScreenActive && (
        <div className="fixed inset-0 z-[300] bg-black/45 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none transition-all duration-500 animate-in fade-in">
          <div className="relative p-8 sm:p-10 rounded-[28px] bg-[#1c140d]/92 border border-[#d4af37]/50 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_40px_rgba(212,175,55,0.22)] flex flex-col items-center max-w-[380px] w-full text-center overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Top Specular Gold Line */}
            <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#f5d78e] to-transparent pointer-events-none" />

            <div className="relative w-18 h-18 sm:w-20 sm:h-20 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
              <img 
                src="/assets/tram-logo_tight.png" 
                alt="Future You Logo" 
                className="w-full h-full object-contain relative z-10 animate-bounce duration-1000 drop-shadow-[0_4px_14px_rgba(251,191,36,0.6)]" 
              />
            </div>
            
            <h1 className="font-caacupe text-2xl sm:text-3xl text-[#fdf3dc] tracking-wider drop-shadow-md">
              Future You
            </h1>
            
            <p className="text-xs text-amber-200/80 font-serif italic tracking-wide mt-1.5 font-medium animate-pulse">
              ✦ Synchronizing Journal Archive...
            </p>
            
            <div className="w-48 sm:w-56 h-1 bg-black/50 rounded-full overflow-hidden mt-5 border border-amber-400/30">
              <div className="w-full h-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Sleek Minimal Real-World Toast Notification (Clean, Non-Intrusive, Modern App Style) */}
      {loginNotification && (
        <aside 
          aria-label="Notification"
          role="status"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[350] max-w-[92vw] animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1c140d]/95 backdrop-blur-md border border-[#c4975e]/40 shadow-[0_8px_24px_rgba(0,0,0,0.55)] text-[#fbf7ee] text-xs sm:text-sm font-sans">
            {/* Minimal Status Icon */}
            <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold leading-none ${
              loginNotification.type === 'info'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
            }`}>
              {loginNotification.type === 'info' ? 'i' : '✓'}
            </span>

            {/* Notification Text */}
            <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
              <span className="font-medium text-[#f5ebd7]">
                {loginNotification.title}
              </span>
              {loginNotification.message ? (
                <span className="text-[#c4a98a] font-normal hidden sm:inline">
                  · {loginNotification.message}
                </span>
              ) : null}
            </div>

            {/* Compact Dismiss Button */}
            <button
              type="button"
              onClick={dismissNotification}
              className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer text-[10px]"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </aside>
      )}

      {/* Page Sections Container */}
      <div className="w-full h-full">

      {/* Floating Top Navigation Bar */}
      <header className={`fixed z-50 w-full flex flex-col items-center top-0 select-none transition-all duration-300 ${
        activeNav === 'Journey' || activeNav === 'Insights' || activeNav === 'Future' || isDirectJourney || isDirectPage3 || isDirectPage4
          ? 'opacity-0 hover:opacity-100 pointer-events-none hover:pointer-events-auto -translate-y-2 hover:translate-y-0 focus-within:opacity-100 focus-within:pointer-events-auto focus-within:translate-y-0' 
          : 'pointer-events-none'
      }`}>
        <div className="w-[94%] sm:w-[90%] md:w-[82%] lg:w-[75%] max-w-[1140px] px-3.5 sm:px-6 md:px-9 py-2 md:py-2.5 bg-[#18110b]/95 rounded-b-2xl md:rounded-b-3xl border-b border-x border-[#eedab4]/30 shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-between pointer-events-auto transition-all duration-300 hover:bg-[#1c140d] hover:border-[#eedab4]/45">
          
          {/* Brand Logo */}
          <div 
            onClick={() => {
              setMobileMenuOpen(false);
              scrollToSection('home');
            }}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <img 
                src="/assets/tram-logo_tight.png" 
                alt="Future You Logo" 
                className="w-full h-full max-w-[32px] max-h-[32px] object-contain brightness-110" 
              />
            </div>
            <span 
              className="font-serif font-bold text-lg sm:text-xl md:text-2xl text-[#fef5e7] tracking-wide group-hover:text-[#f8d789] transition-colors duration-200"
            >
              Future You
            </span>
          </div>

          {/* Desktop Navigation Links (>= md) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-10 text-[15px] lg:text-base font-sans font-bold tracking-wide">
            {['Home', 'Journey', 'Insights', 'Future'].map((item) => (
              <button 
                key={item}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item === 'Home') scrollToSection('home');
                  else if (item === 'Journey') scrollToSection('journey');
                  else if (item === 'Insights') scrollToSection('page3');
                  else if (item === 'Future') scrollToSection('page4');
                  else {
                    activeNavRef.current = item;
                    setActiveNav(item);
                  }
                }}
                className={`relative py-1 transition-all duration-200 cursor-pointer ${
                  activeNav === item 
                    ? 'text-[#f59e0b] font-extrabold' 
                    : 'text-[#f5ebd7]/85 hover:text-white font-semibold hover:-translate-y-0.5'
                }`}
              >
                <span>{item}</span>
                {activeNav === item && (
                  <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Desktop User Profile & Sign Out / Get Started Buttons (>= md) */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <button 
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-[#241710] hover:bg-[#322016] border-2 border-amber-400/80 hover:border-amber-300 text-left transition-all duration-200 cursor-pointer group shadow-md hover:scale-102"
                title="Account details & options"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-amber-400/90 border border-white/40 shrink-0 bg-[#e8dcce]">
                  <img 
                    src={user.avatarThumb || user.avatarFull || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4'} 
                    alt={user.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-neutral-950" />
                </div>
                <span className="text-[15px] lg:text-base font-sans font-bold text-white group-hover:text-amber-200 truncate max-w-[120px] leading-none">
                  {user.name}
                </span>
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center justify-center">
                <button 
                  onClick={logout}
                  className="group relative min-w-[118px] px-5 py-2 rounded-full font-serif font-black text-sm lg:text-[15px] text-[#faecd4] bg-gradient-to-b from-[#341b10] to-[#200f07] border-2 border-[#8c5a3c]/85 hover:border-amber-400 hover:from-[#452416] hover:to-[#2b140a] hover:text-[#fff5e6] shadow-[0_4px_14px_rgba(0,0,0,0.65)] hover:shadow-[0_4px_20px_rgba(217,119,6,0.3)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-103 active:scale-95"
                  title="Sign out of your account"
                >
                  <span className="text-center">Sign Out</span>
                  <svg className="w-3.5 h-3.5 text-[#e5a975] transition-transform duration-200 group-hover:translate-x-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <button 
                  onClick={handleGetStartedClick}
                  className="group relative min-w-[130px] px-5 py-2 rounded-full font-serif font-black text-sm lg:text-[15px] text-[#2c170b] bg-gradient-to-b from-[#f7e6ce] via-[#edd4b4] to-[#dfbe95] hover:from-[#fff3e2] hover:to-[#edd4b4] hover:text-[#170a03] border-2 border-[#b88c58] hover:border-[#ffd699] shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_6px_22px_rgba(223,190,149,0.45)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-103 active:scale-95"
                  title="Get Started with Future You"
                >
                  <span className="text-center">Get Started</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 text-[#6b3b19] font-bold text-sm shrink-0">→</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Right Controls (< md: Avatar + Hamburger Menu Toggle) */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-amber-400 border border-white/50 bg-[#e8dcce] cursor-pointer"
                title="Account"
              >
                <img 
                  src={user.avatarThumb || user.avatarFull || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4'} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="w-8.5 h-8.5 rounded-full bg-[#241710] border border-amber-400/60 text-amber-200 flex items-center justify-center hover:bg-[#322016] active:scale-90 transition-all cursor-pointer shadow-sm text-sm"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu Card (< md) */}
        {mobileMenuOpen && (
          <div className="md:hidden w-[94%] sm:w-[90%] max-w-[420px] mt-2 p-3.5 bg-[#1c140d]/98 rounded-2xl border border-[#eedab4]/40 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col gap-2 pointer-events-auto backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Nav Links Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Home', label: '🏠 Home', action: () => scrollToSection('home') },
                { id: 'Journey', label: '🗺️ Journey', action: () => scrollToSection('journey') },
                { id: 'Insights', label: '📊 Insights', action: () => scrollToSection('page3') },
                { id: 'Future', label: '🔮 Future', action: () => scrollToSection('page4') },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    item.action();
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-sans font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeNav === item.id 
                      ? 'bg-amber-400/20 text-[#f59e0b] border border-amber-400/50 shadow-xs' 
                      : 'bg-[#2a1b12]/80 text-[#f5ebd7]/90 hover:text-white border border-[#eedab4]/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Auth Action in Mobile Menu */}
            <div className="pt-2 border-t border-[#eedab4]/20 flex items-center justify-between gap-2">
              {isAuthenticated ? (
                <>
                  <div 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                  >
                    <span className="text-xs font-sans font-bold text-white truncate">
                      {user.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                      Active
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="py-1.5 px-3.5 rounded-full bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs font-sans font-bold hover:bg-rose-900/60 active:scale-95 transition-all cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleGetStartedClick();
                  }}
                  className="w-full py-2.5 rounded-full bg-[#faecd4] text-[#2c1d13] text-xs font-sans font-black uppercase tracking-wider shadow-md hover:bg-white transition-all cursor-pointer"
                >
                  Get Started →
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {isDirectPage4 ? (
        <>
          <section 
            ref={page4Ref} 
            id="section-page4" 
            className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
          >
            <FutureScenarios 
              onScrollToPage3={() => { window.location.href = '/?page3'; }}
              onScrollToHome={() => { window.location.href = '/'; }}
            />
          </section>
        </>
      ) : isDirectPage3 ? (
        <>
          <section 
            ref={page3Ref} 
            id="section-page3" 
            className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
          >
            <CurrentYouInsights 
              onScrollToPage2={() => { window.location.href = '/?journey'; }}
              onScrollToHome={() => { window.location.href = '/'; }}
              onScrollToNext={() => { window.location.href = '/?page4'; }}
            />
          </section>
        </>
      ) : isDirectJourney ? (
        <>
          <section 
            ref={journeyRef} 
            id="section-journey" 
            className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
          >
            <DigitalTwinJournal 
              onScrollToTop={() => { window.location.href = '/'; }} 
              onScrollToNext={() => scrollToSection('page3')}
            />
          </section>

          <section 
            ref={page3Ref} 
            id="section-page3" 
            className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
          >
            <CurrentYouInsights 
              onScrollToPage2={() => scrollToSection('journey')}
              onScrollToHome={() => { window.location.href = '/'; }}
            />
          </section>
        </>
      ) : (
        <>
      {/* ============================================================== */}
      {/* SECTION 1: Desk Scene (Cover Page)                             */}
      {/* ============================================================== */}
      <section 
        ref={homeRef} 
        id="section-home" 
        className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 flex flex-col justify-between overflow-hidden"
      >
      
      {/* 1. Full Viewport Background — Subtle deep ambient parallax with GPU acceleration */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 transition-transform duration-700 ease-out will-change-transform"
        style={{
          transform: 'scale(1.03) translate3d(calc(var(--mouse-x, 0) * -3px), calc(var(--mouse-y, 0) * -2px), 0)',
        }}
      >
        {/* Base desk & wall texture with clean sunlight shafts (static foliage removed) */}
        <img 
          src="/assets/table-bg-clean.jpg" 
          alt="Desk surface with sunlight window shadows" 
          className="w-full h-full object-cover"
        />

        {/* DYNAMIC WINDOW SHADOW BARS: Smooth GPU-accelerated ambient breeze shadow */}
        <div 
          className="absolute left-0 top-0 w-[55%] h-[78%] pointer-events-none overflow-hidden select-none animate-wind-shadow"
          style={{
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

        {/* DYNAMIC SUNLIGHT PANES: Warm living afternoon sunlight breathing across the stucco */}
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

        {/* DYNAMIC LEAF SHADOW ON WALL: Perfectly synchronized with the leaves, swaying & rippling across sunlight shafts */}
        <div 
          className="absolute right-[-1%] top-[3.5%] w-[46.3%] max-w-[620px] aspect-[474/220] pointer-events-none origin-[90%_0%] animate-wind-shadow mix-blend-multiply"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * -2.5px), calc(var(--mouse-y, 0) * -1.8px), 0)',
          }}
        >
          <div className="w-full h-full animate-shadow-rustle">
            <img 
              src="/assets/wind_leaf_shadow.png" 
              alt="Dynamic dappled leaf shadows" 
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>

        {/* DYNAMIC WIND-BLOWN FOLIAGE LEAVES: Swaying, fluttering and rustling in the outdoor breeze */}
        <div 
          className="absolute right-0 top-0 w-[46.3%] max-w-[620px] aspect-[474/220] origin-[90%_0%] animate-wind-leaves cursor-pointer pointer-events-auto group/foliage z-10"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * -4px), calc(var(--mouse-y, 0) * -3px), 0)',
          }}
          title="Foliage rustling in the outdoor breeze"
        >
          <div className="w-full h-full animate-leaf-rustle">
            <img 
              src="/assets/wind_leaves.png" 
              alt="Dynamic windblown foliage leaves" 
              className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover/foliage:scale-103"
            />
          </div>
        </div>
      </div>

      {/* Atmospheric Sunlight & Soft Breeze Shadow overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 via-transparent to-amber-600/10 pointer-events-none z-0 animate-sunlight-breeze mix-blend-soft-light" />

      {/* Tiny Golden Sunbeam Dust Motes (Floating lazily in the warm room sunlight) */}
      <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
        <div className="absolute left-[24%] top-[42%] w-1.5 h-1.5 rounded-full bg-amber-200/50 blur-[0.6px] animate-dust-1" />
        <div className="absolute left-[45%] top-[58%] w-1.5 h-1.5 rounded-full bg-amber-100/40 blur-[0.4px] animate-dust-2" />
        <div className="absolute left-[64%] top-[34%] w-2 h-2 rounded-full bg-amber-200/45 blur-[0.8px] animate-dust-3" />
        <div className="absolute left-[18%] top-[28%] w-1.5 h-1.5 rounded-full bg-amber-300/35 blur-[0.5px] animate-dust-4" />
        <div className="absolute left-[78%] top-[48%] w-1 h-1 rounded-full bg-amber-100/40 blur-[0.3px] animate-dust-5" />
        <div className="absolute left-[36%] top-[25%] w-1.5 h-1.5 rounded-full bg-amber-200/30 blur-[0.6px] animate-dust-6" />
      </div>

      {/* Subtle ambient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-0" />

      {/* 3. Main Desk Canvas Area — Interactive Edge-to-Edge scene with subtle depth parallax */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center z-10 px-4 md:px-8">

        {/* LEFT ELEMENTS: Flowers & Map with Live Sailing Ship Animation */}
        <div ref={deskLeftGroupRef} className="absolute inset-0 pointer-events-none will-change-transform [&>*]:pointer-events-auto">

        {/* White Daisies Bouquet (Behind map: z-5, 40% hidden under map, with gentle natural breeze sway & black hover shadow) */}
        <div 
          className="absolute left-[8%] md:left-[11%] lg:left-[13%] xl:left-[15%] top-[4%] md:top-[6%] z-[5] cursor-pointer group transition-transform duration-500 ease-out"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * 3px), calc(var(--mouse-y, 0) * 2px), 0)',
          }}
          title="Fresh morning daisies"
        >
          <div className="animate-daisy-sway origin-bottom-left">
            <img 
              src="/assets/daisies_tight.png" 
              alt="White Daisies Bouquet" 
              className="w-[260px] md:w-[320px] lg:w-[370px] xl:w-[410px] h-auto drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)] transition-all duration-500 ease-out group-hover:scale-105 group-hover:drop-shadow-[0_28px_35px_rgba(0,0,0,0.98)]"
            />
          </div>
        </div>

        {/* Large Topographical Map Chart with Interactive Moving Ship (Visible on md+ screens) */}
        <div 
          className="hidden md:block absolute left-[0%] lg:left-[2%] xl:left-[4%] top-[19%] md:top-[21%] z-10 transition-transform duration-500 ease-out"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * 4px), calc(var(--mouse-y, 0) * 3px), 0)',
          }}
        >
          <div className="relative w-[460px] md:w-[580px] lg:w-[690px] xl:w-[780px] h-auto">
            {/* The Map Chart Image */}
            <img 
              src="/assets/topo_map_tight.png" 
              alt="Vintage Topographical Map Chart" 
              className="w-full h-auto drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] opacity-95 rotate-[-2.5deg] pointer-events-none select-none block"
            />

            {/* LIVE SAILING EXPEDITION OVERLAY: Ship sailing from Point A to Point B */}
            <svg 
              viewBox="0 0 980 608" 
              className="absolute inset-0 w-full h-full pointer-events-none rotate-[-2.5deg]"
            >
              <defs>
                {/* Ship Drop Shadow */}
                <filter id="ship-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="2" dy="5" stdDeviation="3" floodColor="#1a0f07" floodOpacity="0.6" />
                </filter>

                {/* Point A / Point B Marker Glow */}
                <radialGradient id="waypoint-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Outbound Navigation Trail: Point A to Point B across southern archipelago */}
              <path 
                id="routeOutbound"
                d="M 140 370 C 230 260, 340 430, 480 320 S 590 350, 660 260" 
                fill="none" 
                stroke="#68421e" 
                strokeWidth="2.4" 
                strokeDasharray="6 7" 
                strokeLinecap="round"
                opacity="0.8" 
              />

              {/* Northern Trade Route: Merchant Sloop Passage */}
              <path 
                id="routeNorth"
                d="M 240 185 C 320 155, 410 175, 490 150 S 580 135, 640 145" 
                fill="none" 
                stroke="#68421e" 
                strokeWidth="1.6" 
                strokeDasharray="4 6" 
                strokeLinecap="round"
                opacity="0.55" 
              />

              {/* Southern Coastal Passage: Coastal Schooner Channel */}
              <path 
                id="routeSouth"
                d="M 130 480 C 220 505, 310 465, 400 485 S 490 475, 560 490" 
                fill="none" 
                stroke="#68421e" 
                strokeWidth="1.6" 
                strokeDasharray="4 6" 
                strokeLinecap="round"
                opacity="0.55" 
              />

              {/* Inbound Return Passage: Point B to Point A along northern channel */}
              <path 
                id="routeReturn"
                d="M 660 260 C 590 200, 470 230, 360 270 S 210 430, 140 370" 
                fill="none" 
                stroke="#8a5a2e" 
                strokeWidth="1.8" 
                strokeDasharray="4 6" 
                strokeLinecap="round"
                opacity="0.6" 
              />

              {/* Combined Continuous Loop for the Sailing Ship (Always sailing forward) */}
              <path 
                id="expeditionLoop"
                d="M 140 370 C 230 260, 340 430, 480 320 S 590 350, 660 260 C 590 200, 470 230, 360 270 S 210 430, 140 370 Z" 
                fill="none" 
                stroke="transparent"
              />

              {/* Waypoint A (Portus - Origin Harbor) */}
              <g transform="translate(140, 370)">
                <circle cx="0" cy="0" r="15" fill="url(#waypoint-glow)" className="animate-waypoint-pulse" />
                <circle cx="0" cy="0" r="6" fill="#fdf6e7" stroke="#5b371b" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="2.2" fill="#b45309" />
                {/* Tiny Anchor detail */}
                <path d="M -3 3 C -3 6, 3 6, 3 3 M 0 0 L 0 5" stroke="#5b371b" strokeWidth="1" fill="none" />
                <text 
                  x="0" 
                  y="24" 
                  fontFamily="'Caacupe One', serif" 
                  fontSize="16" 
                  fill="#38210e" 
                  textAnchor="middle" 
                  fontWeight="bold"
                  className="select-none filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]"
                >
                  Point A
                </text>
                <text 
                  x="0" 
                  y="36" 
                  fontFamily="'Caacupe One', serif" 
                  fontSize="9.5" 
                  fill="#694014" 
                  textAnchor="middle" 
                  opacity="0.8"
                  className="select-none"
                >
                  PORTUS • 34°N
                </text>
              </g>

              {/* Waypoint B (Isla Nova - Destination Horizon) */}
              <g transform="translate(660, 260)">
                <circle cx="0" cy="0" r="15" fill="url(#waypoint-glow)" className="animate-waypoint-pulse" />
                <circle cx="0" cy="0" r="6" fill="#fdf6e7" stroke="#5b371b" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="2.2" fill="#b45309" />
                {/* Tiny Star detail */}
                <path d="M 0 -2 L 1 0 L 3 0 L 1.5 1 L 2 3 L 0 1.5 L -2 3 L -1.5 1 L -3 0 L -1 0 Z" fill="#b45309" />
                <text 
                  x="0" 
                  y="-14" 
                  fontFamily="'Caacupe One', serif" 
                  fontSize="16" 
                  fill="#38210e" 
                  textAnchor="middle" 
                  fontWeight="bold"
                  className="select-none filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.7)]"
                >
                  Point B
                </text>
                <text 
                  x="0" 
                  y="-2" 
                  fontFamily="'Caacupe One', serif" 
                  fontSize="9.5" 
                  fill="#694014" 
                  textAnchor="middle" 
                  opacity="0.8"
                  className="select-none"
                >
                  ISLA NOVA • 138°E
                </text>
              </g>

              {/* THE LITTLE SAILING SHIP: Continuously navigating forward along the trade channels */}
              <g filter="url(#ship-shadow)">
                <animateMotion 
                  dur="22s" 
                  repeatCount="indefinite" 
                  rotate="auto" 
                  keyPoints="0; 1; 1; 0; 0"
                  keyTimes="0; 0.46; 0.52; 0.96; 1"
                >
                  <mpath href="#routeOutbound" />
                </animateMotion>

                {/* Animated Horizontal Turnaround: Stays upright with mast pointing up on both legs */}
                <g>
                  <animateTransform 
                    attributeName="transform" 
                    type="scale" 
                    values="1.15 1.15; 1.15 1.15; -1.15 1.15; -1.15 1.15; 1.15 1.15" 
                    keyTimes="0; 0.47; 0.51; 0.97; 1" 
                    dur="22s" 
                    repeatCount="indefinite" 
                  />

                  {/* Animated Ship Vessel with gentle wave bobbing */}
                  <g className="animate-ship-rock">
                  
                  {/* Subtle dynamic wake ripples behind the stern */}
                  <circle cx="-16" cy="6" fill="none" stroke="#fef3c7" className="animate-wake-1" />
                  <circle cx="-16" cy="6" fill="none" stroke="#eedab4" className="animate-wake-2" />

                  {/* Wooden Hull */}
                  <path 
                    d="M -16 5 C -12 12, 12 12, 18 5 L 15 2 L -14 2 Z" 
                    fill="#4a2d14" 
                    stroke="#2e1909" 
                    strokeWidth="1.2" 
                  />
                  {/* Deck highlight strip */}
                  <line x1="-12" y1="2" x2="14" y2="2" stroke="#d5b485" strokeWidth="0.8" />

                  {/* Main Mast & Fore Mast */}
                  <line x1="2" y1="3" x2="2" y2="-19" stroke="#331c0a" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="-6" y1="3" x2="-6" y2="-13" stroke="#331c0a" strokeWidth="1.3" strokeLinecap="round" />
                  <line x1="10" y1="3" x2="10" y2="-10" stroke="#331c0a" strokeWidth="1.1" strokeLinecap="round" />

                  {/* Billowing Main Canvas Sail (Antique cream) */}
                  <path 
                    d="M 2 -18 C 10 -15, 11 -7, 2 -2 C 6 -8, 5 -14, 2 -18 Z" 
                    fill="#fef8ea" 
                    stroke="#50351b" 
                    strokeWidth="0.9" 
                  />
                  {/* Fore Canvas Sail */}
                  <path 
                    d="M -6 -12 C -2 -10, -1 -5, -6 -1 C -4 -5, -4 -9, -6 -12 Z" 
                    fill="#f6eed8" 
                    stroke="#50351b" 
                    strokeWidth="0.8" 
                  />
                  {/* Jib Sail */}
                  <path 
                    d="M 10 -9 C 14 -7, 13 -4, 10 0 C 12 -4, 11 -7, 10 -9 Z" 
                    fill="#ede1c4" 
                    stroke="#50351b" 
                    strokeWidth="0.7" 
                  />

                  {/* Fluttering Red Royal Pennant at top of main mast */}
                  <path d="M 2 -19 L 9 -16.5 L 2 -14 Z" fill="#b91c1c" />
                </g>
              </g>
            </g>

            {/* SHIP 2: Northern Merchant Sloop (Emerald Pennant, Swift 17s voyage) */}
            <g filter="url(#ship-shadow)">
              <animateMotion 
                dur="17s" 
                repeatCount="indefinite" 
                rotate="auto" 
                keyPoints="0; 1; 1; 0; 0"
                keyTimes="0; 0.46; 0.52; 0.96; 1"
              >
                <mpath href="#routeNorth" />
              </animateMotion>

              {/* Animated Horizontal Turnaround */}
              <g>
                <animateTransform 
                  attributeName="transform" 
                  type="scale" 
                  values="0.85 0.85; 0.85 0.85; -0.85 0.85; -0.85 0.85; 0.85 0.85" 
                  keyTimes="0; 0.47; 0.51; 0.97; 1" 
                  dur="17s" 
                  repeatCount="indefinite" 
                />

                {/* Sloop Vessel with gentle sea bobbing */}
                <g className="animate-ship-rock">
                  {/* Dynamic wake ripples behind the stern */}
                  <circle cx="-13" cy="5" fill="none" stroke="#fef3c7" className="animate-wake-1" />
                  <circle cx="-13" cy="5" fill="none" stroke="#eedab4" className="animate-wake-2" />

                  {/* Hull */}
                  <path 
                    d="M -13 4 C -10 10, 10 10, 15 4 L 12 1 L -11 1 Z" 
                    fill="#3d210b" 
                    stroke="#221105" 
                    strokeWidth="1.1" 
                  />
                  {/* Gilded waterline strip */}
                  <line x1="-10" y1="1" x2="12" y2="1" stroke="#ca8a04" strokeWidth="0.7" />

                  {/* Masts */}
                  <line x1="1" y1="2" x2="1" y2="-16" stroke="#221105" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="-5" y1="2" x2="-5" y2="-11" stroke="#221105" strokeWidth="1.1" strokeLinecap="round" />

                  {/* Main Sail */}
                  <path 
                    d="M 1 -15 C 8 -12, 9 -5, 1 -1 C 4 -6, 4 -11, 1 -15 Z" 
                    fill="#fffdf7" 
                    stroke="#4a2c11" 
                    strokeWidth="0.8" 
                  />
                  {/* Fore Sail */}
                  <path 
                    d="M -5 -10 C -1 -8, 0 -4, -5 0 C -3 -4, -3 -7, -5 -10 Z" 
                    fill="#f7f0df" 
                    stroke="#4a2c11" 
                    strokeWidth="0.7" 
                  />

                  {/* Emerald Green Merchant Guild Pennant */}
                  <path d="M 1 -16 L 7 -14 L 1 -12 Z" fill="#059669" />
                </g>
              </g>
            </g>

            {/* SHIP 3: Southern Coastal Schooner (Golden Amber Pennant, Relaxed 27s voyage) */}
            <g filter="url(#ship-shadow)">
              <animateMotion 
                dur="27s" 
                repeatCount="indefinite" 
                rotate="auto" 
                keyPoints="0; 1; 1; 0; 0"
                keyTimes="0; 0.46; 0.52; 0.96; 1"
              >
                <mpath href="#routeSouth" />
              </animateMotion>

              {/* Animated Horizontal Turnaround */}
              <g>
                <animateTransform 
                  attributeName="transform" 
                  type="scale" 
                  values="0.92 0.92; 0.92 0.92; -0.92 0.92; -0.92 0.92; 0.92 0.92" 
                  keyTimes="0; 0.47; 0.51; 0.97; 1" 
                  dur="27s" 
                  repeatCount="indefinite" 
                />

                {/* Schooner Vessel with gentle sea bobbing */}
                <g className="animate-ship-rock">
                  {/* Dynamic wake ripples behind the stern */}
                  <circle cx="-14" cy="5" fill="none" stroke="#fef3c7" className="animate-wake-1" />
                  <circle cx="-14" cy="5" fill="none" stroke="#eedab4" className="animate-wake-2" />

                  {/* Hull */}
                  <path 
                    d="M -14 5 C -11 11, 11 11, 16 5 L 13 2 L -12 2 Z" 
                    fill="#431407" 
                    stroke="#230b04" 
                    strokeWidth="1.1" 
                  />
                  {/* Copper deck highlight */}
                  <line x1="-11" y1="2" x2="13" y2="2" stroke="#b45309" strokeWidth="0.7" />

                  {/* Bowsprit extending forward */}
                  <line x1="13" y1="2" x2="19" y2="0" stroke="#230b04" strokeWidth="1.1" strokeLinecap="round" />

                  {/* Main Mast & Fore Mast */}
                  <line x1="2" y1="3" x2="2" y2="-17" stroke="#230b04" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="-6" y1="3" x2="-6" y2="-12" stroke="#230b04" strokeWidth="1.2" strokeLinecap="round" />

                  {/* Main Sail */}
                  <path 
                    d="M 2 -16 C 9 -13, 10 -6, 2 -2 C 6 -7, 5 -12, 2 -16 Z" 
                    fill="#fefcf0" 
                    stroke="#48240f" 
                    strokeWidth="0.8" 
                  />
                  {/* Fore Sail */}
                  <path 
                    d="M -6 -11 C -2 -9, -1 -4, -6 0 C -4 -4, -4 -8, -6 -11 Z" 
                    fill="#f4e8cb" 
                    stroke="#48240f" 
                    strokeWidth="0.7" 
                  />
                  {/* Jib Sail to bowsprit */}
                  <path 
                    d="M 9 -8 C 13 -6, 12 -3, 9 0 C 11 -3, 10 -6, 9 -8 Z" 
                    fill="#ebe0c3" 
                    stroke="#48240f" 
                    strokeWidth="0.6" 
                  />

                  {/* Golden Amber Royal Pennant */}
                  <path d="M 2 -17 L 9 -15 L 2 -13 Z" fill="#d97706" />
                </g>
              </g>
            </g>

            </svg>
          </div>
        </div>

        {/* Lower-Left: Brass Compass with Live Continuously Moving Magnetic Needle */}
        <div 
          className="absolute left-[5%] lg:left-[7%] xl:left-[9%] bottom-[6%] md:bottom-[8%] z-20 cursor-pointer group transition-transform duration-500 ease-out"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * 5px), calc(var(--mouse-y, 0) * 4px), 0)',
          }}
          onClick={handleCompassClick}
          title="Click to give the compass a quick magnetic spin"
        >
          {/* Mountain trail map scrap */}
          <img 
            src="/assets/map_tight.png" 
            alt="Vintage Mountain Map" 
            className="w-[260px] md:w-[320px] lg:w-[380px] h-auto drop-shadow-[0_15px_22px_rgba(0,0,0,0.55)] opacity-95 rotate-[-4deg] pointer-events-none transition-transform duration-300 group-hover:scale-102"
          />

          {/* Brass Compass Case & Dial with deep black pop-up hover shadow */}
          <div 
            className="absolute left-[28%] top-[12%] w-[125px] md:w-[155px] lg:w-[185px] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-105 group-hover:drop-shadow-[0_32px_36px_rgba(0,0,0,0.98)]"
          >
            <div className="relative w-full h-auto">
              <img 
                src="/assets/compass_tight.png" 
                alt="Brass Compass" 
                className="w-full h-auto drop-shadow-[0_18px_25px_rgba(0,0,0,0.85)] block pointer-events-none" 
              />

              {/* LIVE CONTINUOUSLY MOVING COMPASS NEEDLE (Pivot centered exactly at golden boss: 53.13%, 58.85%) */}
              <div 
                className="absolute left-[53.13%] top-[58.85%] w-[44%] h-[44%] pointer-events-none transition-transform duration-1000 ease-out origin-center"
                style={{ transform: `translate(-50%, -50%) rotate(${needleSpin}deg)` }}
              >
                {/* Continuous Magnetic Oscillation/Wandering Needle */}
                <div className="relative w-full h-full animate-compass-drift flex items-center justify-center origin-center">
                  <svg 
                    viewBox="-30 -110 60 220" 
                    className="w-full h-full overflow-visible drop-shadow-[1px_4px_6px_rgba(0,0,0,0.95)]"
                  >
                    <defs>
                      <radialGradient id="rivet-gradient" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#fff3b0" />
                        <stop offset="40%" stopColor="#e5a93b" />
                        <stop offset="85%" stopColor="#875317" />
                        <stop offset="100%" stopColor="#4e2e0a" />
                      </radialGradient>
                    </defs>

                    {/* North Magnetic Arrow (Red & Gold Facets) */}
                    <path d="M 0 0 L -8 -15 L -2 -98 L 0 -108 Z" fill="#b91c1c" stroke="#5b1010" strokeWidth="0.8" />
                    <path d="M 0 0 L 8 -15 L 2 -98 L 0 -108 Z" fill="#ef4444" stroke="#eab308" strokeWidth="0.8" />
                    <line x1="0" y1="-10" x2="0" y2="-106" stroke="#fef08a" strokeWidth="1.2" />

                    {/* South Magnetic Arrow (Bronze & Steel Facets) */}
                    <path d="M 0 0 L -8 15 L -2 98 L 0 108 Z" fill="#2d2218" stroke="#170f08" strokeWidth="0.8" />
                    <path d="M 0 0 L 8 15 L 2 98 L 0 108 Z" fill="#58412e" stroke="#c29658" strokeWidth="0.8" />
                    <line x1="0" y1="10" x2="0" y2="106" stroke="#e0c294" strokeWidth="1.2" />

                    {/* Central Golden Brass Pivot Boss */}
                    <circle cx="0" cy="0" r="14" fill="#694014" stroke="#2a1705" strokeWidth="1" />
                    <circle cx="0" cy="0" r="11" fill="url(#rivet-gradient)" stroke="#ffe58f" strokeWidth="0.8" />
                    <circle cx="-3" cy="-3" r="3" fill="#ffffff" opacity="0.6" />
                  </svg>
                </div>
              </div>

              {/* Periodic glass reflection shimmer centered directly on compass dial */}
              <div className="absolute left-[53.13%] top-[58.85%] w-[58%] h-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden pointer-events-none">
                <div className="w-full h-full bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-lens-shimmer" />
              </div>

            </div>
          </div>
        </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER ELEMENT: The Book Model with Real Jet-Black Desk Shadow */}
        {/* ============================================================== */}
        <div 
          ref={deskBookRef}
          onClick={() => scrollToSection('journey')}
          className="relative z-20 flex items-center justify-center mx-auto cursor-pointer group transition-transform duration-500 ease-out will-change-transform"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * 6px), calc(var(--mouse-y, 0) * 4px), 0)',
          }}
          title="Future You — Click to open your Digital Twin journal"
        >
          {/* 1. Grounded Jet-Black Desk Surface Contact Shadow (Stays on desk when book pops up) */}
          <div 
            className="absolute -bottom-3 md:-bottom-5 left-[6%] right-[6%] h-10 md:h-14 bg-black/90 rounded-[50%] blur-md md:blur-lg transition-all duration-500 pointer-events-none group-hover:bg-black group-hover:opacity-100 group-hover:scale-x-105 group-hover:scale-y-125 group-hover:blur-xl group-hover:translate-y-5" 
          />
          {/* 2. Deep Jet-Black Desk Ambient Spread Shadow (Darkens and spreads downward on pop up) */}
          <div 
            className="absolute -bottom-7 md:-bottom-10 left-[10%] right-[10%] h-14 md:h-20 bg-black/75 rounded-[50%] blur-xl md:blur-2xl transition-all duration-500 pointer-events-none group-hover:bg-black group-hover:opacity-95 group-hover:scale-x-110 group-hover:scale-y-130 group-hover:blur-3xl group-hover:translate-y-9" 
          />

          {/* The Book: Lifts up smoothly on hover */}
          <div className="relative transition-all duration-500 ease-out group-hover:-translate-y-4 group-hover:scale-[1.025] will-change-transform">
            <img 
              src="/assets/book_tight.png" 
              alt="Future You Journal Book" 
              className="w-[76vw] max-w-[320px] sm:max-w-none sm:w-[440px] md:w-[520px] lg:w-[600px] xl:w-[660px] max-h-[62vh] md:max-h-[78vh] h-auto object-contain pointer-events-none transition-all duration-500"
              style={{
                filter: 'drop-shadow(0 20px 24px rgba(0,0,0,0.85))'
              }}
            />

            {/* LIVE FOREST EXPEDITION OVERLAY: Small Horse and Rider trotting along the trail */}
            <svg 
              viewBox="0 0 895 978" 
              className="absolute inset-0 w-full h-full pointer-events-none"
            >
              <defs>
                {/* Horse Drop Shadow onto the parchment */}
                <filter id="rider-shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0.5" dy="2.5" stdDeviation="1.5" floodColor="#1e1007" floodOpacity="0.7" />
                </filter>
              </defs>

              {/* The Forest Dirt Trail Path (From western pine forest across to eastern mountain overlook) */}
              <path 
                id="forestTrail" 
                d="M 210 828 C 280 822, 345 815, 415 813 S 560 825, 720 813" 
                fill="none" 
                stroke="transparent"
              />

              {/* THE HORSE AND RIDER: Continuously navigating along the forest trail */}
              <g filter="url(#rider-shadow)">
                <animateMotion 
                  dur="24s" 
                  repeatCount="indefinite" 
                  rotate="auto" 
                  keyPoints="0; 1; 1; 0; 0"
                  keyTimes="0; 0.46; 0.52; 0.96; 1"
                >
                  <mpath href="#forestTrail" />
                </animateMotion>

                {/* Animated Horizontal Turn: Stays 100% upright with legs down on both outbound and return ride */}
                <g>
                  <animateTransform 
                    attributeName="transform" 
                    type="scale" 
                    values="0.75 0.75; 0.75 0.75; -0.75 0.75; -0.75 0.75; 0.75 0.75" 
                    keyTimes="0; 0.47; 0.51; 0.97; 1" 
                    dur="24s" 
                    repeatCount="indefinite" 
                  />

                  {/* Animated Trotting Horse and Rider in Vintage Sepia Ink Engraving Style */}
                  <g className="animate-horse-trot">
                  
                  {/* Subtle ground dust puff behind hooves */}
                  <ellipse cx="-12" cy="18" rx="3.5" ry="1.2" fill="#d1b896" opacity="0.4" className="animate-wake-1" />

                  {/* Ground Contact Shadow */}
                  <ellipse cx="0" cy="18" rx="14" ry="2.8" fill="#1f1107" opacity="0.45" />
                  
                  {/* Flowing Tail */}
                  <path d="M -11 4 C -16 6, -18 12, -15 17 C -14 13, -13 8, -9 6 Z" fill="#2b170a" />
                  
                  {/* Back Legs (Trotting cadence) */}
                  <path d="M -9 8 L -12 16 L -10 18 L -7 11 Z" fill="#2b170a" />
                  <path d="M -6 8 L -4 14 L -6 17 L -4 18 L -3 10 Z" fill="#1c0f06" />
                  
                  {/* Horse Muscular Body / Torso */}
                  <path 
                    d="M -11 6 C -12 1, -8 -2, -2 -1 C 4 -1, 8 2, 11 1 C 12 4, 9 9, 4 9 C -3 9, -8 9, -11 6 Z" 
                    fill="#3d220e" 
                    stroke="#1c0f06" 
                    strokeWidth="0.8" 
                  />
                  
                  {/* Front Legs (Trotting stride) */}
                  <path d="M 7 7 L 11 15 L 13 15 L 9 6 Z" fill="#2b170a" />
                  <path d="M 9 7 L 7 14 L 6 18 L 8 18 L 11 8 Z" fill="#1c0f06" />
                  
                  {/* Arched Neck & Head */}
                  <path 
                    d="M 8 2 C 10 -4, 12 -8, 14 -10 C 15 -11, 16 -10, 16 -8 C 17 -6, 17 -4, 15 -2 C 14 0, 12 4, 10 6 Z" 
                    fill="#3d220e" 
                    stroke="#1c0f06" 
                    strokeWidth="0.8" 
                  />
                  {/* Muzzle & Ears */}
                  <path d="M 14 -10 L 18 -9 L 17 -7 L 14 -8 Z" fill="#2b170a" />
                  <path d="M 14 -11 L 15 -13 L 16 -10 Z" fill="#1c0f06" />
                  {/* Mane */}
                  <path d="M 13 -9 C 11 -7, 9 -4, 9 -1" stroke="#1c0f06" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  
                  {/* Saddle & Stirrup Strap */}
                  <path d="M -3 0 C 0 -1, 3 -1, 5 0 L 4 5 L -2 5 Z" fill="#78350f" stroke="#1c0f06" strokeWidth="0.6" />
                  <line x1="1" y1="5" x2="1" y2="11" stroke="#b45309" strokeWidth="0.8" />
                  
                  {/* Rider Legs in Stirrups */}
                  <path d="M -1 0 C 1 3, 2 6, 2 9 L 4 10 L 3 11 L 0 10 C 0 7, -1 4, -2 1 Z" fill="#261408" />
                  
                  {/* Rider Torso & Fluttering Traveler Cloak */}
                  <path d="M -2 -1 C -1 -5, 0 -8, 2 -8 C 4 -8, 4 -4, 3 -1 Z" fill="#451a03" stroke="#1c0f06" strokeWidth="0.6" />
                  <path d="M -2 -7 C -7 -6, -9 -3, -8 1 C -6 -1, -4 -4, -1 -6 Z" fill="#58240a" />
                  
                  {/* Rider Arm & Reins */}
                  <path d="M 2 -5 L 6 -3 L 8 -2" stroke="#3d220e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  <path d="M 7 -2 C 10 -4, 12 -6, 15 -7" stroke="#1c0f06" strokeWidth="0.6" fill="none" />
                  
                  {/* Rider Head & Wide-Brimmed Traveler Hat */}
                  <circle cx="2" cy="-10" r="2.5" fill="#d97706" />
                  <ellipse cx="2" cy="-11" rx="5.5" ry="1.6" fill="#1c0f06" />
                  <path d="M 0 -11 C 0 -14, 4 -14, 4 -11 Z" fill="#1c0f06" />
                </g>
              </g>
            </g>
          </svg>

            {/* Slow ambient gold luster reflection gliding across book title */}
            <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-gold-luster" />
            </div>

            {/* Subtle warm sunlight sheen on book hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT ELEMENTS: Interactive Polaroid & Habits Checklist Note    */}
        {/* ============================================================== */}
        <div ref={deskRightGroupRef} className="absolute inset-0 pointer-events-none will-change-transform [&>*]:pointer-events-auto">

        {/* Upper-Right Card: Polaroid Photo with realistic tilt, lift & glossy glint */}
        <div 
          className="absolute right-[4%] lg:right-[6%] xl:right-[8%] top-[8%] md:top-[10%] z-10 cursor-pointer group transition-transform duration-500 ease-out"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * 7px), calc(var(--mouse-y, 0) * 5px), 0)',
          }}
          title="Memory: Vintage tram in spring cherry blossoms"
        >
          <div className="relative overflow-hidden rounded-md">
            <img 
              src="/assets/polaroid_tight.png" 
              alt="Polaroid Memory" 
              className="w-[200px] md:w-[250px] lg:w-[290px] h-auto drop-shadow-[0_16px_25px_rgba(0,0,0,0.8)] rotate-[-4deg] transition-all duration-300 ease-out group-hover:rotate-[-1deg] group-hover:-translate-y-2 group-hover:scale-105 group-hover:drop-shadow-[0_32px_36px_rgba(0,0,0,0.98)]"
            />

            {/* Living occasional photo glint sheen */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full pointer-events-none animate-polaroid-glint" />
          </div>
        </div>

        {/* Map scrap peeking behind note */}
        <img 
          src="/assets/map_tight.png" 
          alt="Map Scrap" 
          className="hidden md:block absolute right-[4%] lg:right-[6%] xl:right-[8%] top-[45%] w-[250px] md:w-[310px] lg:w-[370px] h-auto pointer-events-none drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)] rotate-[8deg] opacity-70 z-10"
        />

        {/* Lower-Right Card: Torn Parchment Checklist Note (Visible on md+ screens) */}
        <div 
          className="hidden md:block absolute right-[3%] lg:right-[5%] xl:right-[7%] top-[49%] md:top-[51%] z-20 cursor-pointer group transition-transform duration-500 ease-out"
          style={{
            transform: 'translate3d(calc(var(--mouse-x, 0) * 6px), calc(var(--mouse-y, 0) * 4px), 0)',
          }}
          title="Daily Habit Commitments"
        >
          <div className="relative transition-all duration-300 ease-out group-hover:rotate-0 group-hover:-translate-y-2 group-hover:scale-103 group-hover:drop-shadow-[0_32px_36px_rgba(0,0,0,0.98)] animate-corner-flutter origin-bottom-right">
            <img 
              src="/assets/note_tight.png" 
              alt="Habits Checklist Note" 
              className="w-[220px] md:w-[275px] lg:w-[325px] h-auto drop-shadow-[0_16px_25px_rgba(0,0,0,0.85)] rotate-[-2deg] pointer-events-none"
            />

            {/* Interactive Checkbox 1: Track your Habits */}
            <div 
              onClick={() => setChecklist(prev => ({ ...prev, habits: !prev.habits }))}
              className="absolute left-[6%] top-[12%] w-[88%] h-[26%] rounded hover:bg-amber-900/10 transition-colors"
              title="Click to toggle: Track your Habits"
            >
              {!checklist.habits && (
                <div className="absolute left-[3%] top-[25%] w-[11%] h-[50%] bg-[#faecd4] rounded flex items-center justify-center text-red-800 font-bold text-xs shadow-sm">
                  ✕
                </div>
              )}
            </div>

            {/* Interactive Checkbox 2: Simulate your Future */}
            <div 
              onClick={() => setChecklist(prev => ({ ...prev, simulate: !prev.simulate }))}
              className="absolute left-[6%] top-[39%] w-[88%] h-[26%] rounded hover:bg-amber-900/10 transition-colors"
              title="Click to toggle: Simulate your Future"
            >
              {!checklist.simulate && (
                <div className="absolute left-[3%] top-[25%] w-[11%] h-[50%] bg-[#faecd4] rounded flex items-center justify-center text-red-800 font-bold text-xs shadow-sm">
                  ✕
                </div>
              )}
            </div>

            {/* Interactive Checkbox 3: Meet your Future Self */}
            <div 
              onClick={() => setChecklist(prev => ({ ...prev, futureSelf: !prev.futureSelf }))}
              className="absolute left-[6%] top-[66%] w-[88%] h-[26%] rounded hover:bg-amber-900/10 transition-colors"
              title="Click to toggle: Meet your Future Self"
            >
              {!checklist.futureSelf && (
                <div className="absolute left-[3%] top-[25%] w-[11%] h-[50%] bg-[#faecd4] rounded flex items-center justify-center text-red-800 font-bold text-xs shadow-sm">
                  ✕
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Scroll Indicator Pill (< md) */}
        <div 
          onClick={() => scrollToSection('journey')}
          className="md:hidden absolute right-3.5 bottom-3.5 z-30 select-none cursor-pointer group active:scale-95 transition-transform"
          title="Tap to open the journal"
        >
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1c1209]/90 backdrop-blur-md border border-[#c8a97e]/65 shadow-[0_6px_20px_rgba(0,0,0,0.75)] text-[#faecd4] group-hover:border-amber-400 group-hover:bg-[#2a1a0e] transition-all">
            <div className="flex flex-col text-right leading-tight">
              <span className="font-serif font-black text-xs text-[#f5ebd7] tracking-wider uppercase">
                Scroll
              </span>
              <span className="font-sans text-[9px] text-[#eedab4]/75 tracking-wider font-semibold">
                page flip
              </span>
            </div>
            <div className="w-5 h-5 rounded-full bg-[#3d2212] border border-amber-400/60 flex items-center justify-center text-amber-300 text-xs shadow-inner animate-bounce">
              <svg className="w-3 h-3 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop Scroll Callout & Curved Arrow (>= md) */}
        <div 
          onClick={() => scrollToSection('journey')}
          className="hidden md:block absolute right-[4%] bottom-[3%] z-30 text-right select-none cursor-pointer group text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]"
          title="Scroll or click to open the journal"
        >
          <div className="font-serif text-2xl md:text-3xl lg:text-4xl leading-none font-bold flex items-center justify-end gap-2 group-hover:text-[#f8d789] transition-colors duration-200">
            <span>Scroll</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-y-1">↓</span>
          </div>
          <div className="font-serif text-sm md:text-base opacity-90 mt-0.5 tracking-wider group-hover:opacity-100 transition-opacity">
            (page flip)
          </div>
          <div className="w-16 md:w-20 lg:w-24 h-8 md:h-10 lg:h-12 ml-auto mt-0.5 transition-transform duration-300 group-hover:translate-y-1.5">
            <svg 
              viewBox="0 0 100 50" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-full h-full stroke-white group-hover:stroke-[#f8d789] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-colors duration-200"
            >
              <path 
                d="M 15 8 C 45 4, 75 14, 88 36" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
              <path 
                d="M 72 35 L 89 37 L 85 23" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
          </div>
        </div>

        </div>

      </main>

      </section>

      {/* ============================================================== */}
      {/* SECTION 2: Digital Twin Journal (Page 2 matching Reference)     */}
      {/* ============================================================== */}
      <section 
        ref={journeyRef} 
        id="section-journey" 
        className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
      >
        <DigitalTwinJournal 
          onScrollToTop={() => scrollToSection('home')} 
          onScrollToNext={() => scrollToSection('page3')}
        />
      </section>

      {/* ============================================================== */}
      {/* SECTION 3: Current You & Habit Breakdown (Page 3)              */}
      {/* ============================================================== */}
      <section 
        ref={page3Ref} 
        id="section-page3" 
        className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
      >
        <CurrentYouInsights 
          onScrollToPage2={() => scrollToSection('journey')}
          onScrollToHome={() => scrollToSection('home')}
          onScrollToNext={() => scrollToSection('page4')}
        />
      </section>

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* SECTION 4: Future Scenarios - Book with Two Choices Cards     */}
      {/* ============================================================== */}
      <section 
        ref={page4Ref} 
        id="section-page4" 
        className="relative w-screen h-screen min-h-[640px] snap-start flex-shrink-0 overflow-hidden"
      >
        <FutureScenarios 
          onScrollToPage3={() => scrollToSection('page3')}
          onScrollToHome={() => scrollToSection('home')}
        />
      </section>
      </>
      )}
      </div>

      {/* Interactive Anime Avatar & Character Selection Modal */}
      <CharacterSelectModal />

      {/* JWT Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        onNavigateToJournal={() => scrollToSection('journey')} 
      />

    </div>
  );
}
