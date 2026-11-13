import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onNavigateToJournal }) {
  const { 
    user, 
    isAuthenticated, 
    login, 
    register, 
    logout, 
    openCharacterModal 
  } = useUser();

  const [mode, setMode] = useState(initialMode || 'login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (mode === 'login') {
        await login(cleanEmail, password);
      } else {
        if (!name.trim()) {
          setError('Please provide your name');
          setLoading(false);
          return;
        }
        await register(name.trim(), cleanEmail, password);
      }
      onClose();
      if (onNavigateToJournal) {
        onNavigateToJournal();
      }
    } catch (err) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    setMode('login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200 select-none font-sans">
      
      {/* Luxury Vintage Archival Card */}
      <div 
        className="relative w-full max-w-[470px] rounded-[28px] p-6 sm:p-8 bg-gradient-to-b from-[#fdfbf7] via-[#f7f2e8] to-[#eee4d0] text-[#2c180c] border-2 border-[#d4af37]/70 shadow-[0_30px_90px_rgba(20,10,4,0.7),0_0_50px_rgba(212,175,55,0.18)] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Gold Foil Specular Filament */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#f5d78e] to-transparent pointer-events-none" />

        {/* Minimal Luxury Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4.5 right-4.5 w-8 h-8 rounded-full bg-[#ebd8c0]/60 hover:bg-[#ebd8c0] border border-[#b59976]/70 text-[#3d2414] hover:text-[#2c180c] font-bold text-sm flex items-center justify-center cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
          title="Close dialog"
        >
          ✕
        </button>

        {/* Header Medallion & Branding */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f8dfad] via-[#e5b352] to-[#b87c28] border-2 border-[#fff3d4] shadow-[0_4px_16px_rgba(184,124,40,0.35)] flex items-center justify-center mb-2.5 ring-4 ring-[#eedab4]/40">
            <span className="text-2xl drop-shadow-xs">🧭</span>
          </div>
          <h2 className="font-caacupe text-2xl sm:text-3xl font-black text-[#261509] tracking-wide leading-tight">
            {isAuthenticated ? 'Your Account' : (mode === 'login' ? 'Sign In to Future You' : 'Create New Account')}
          </h2>
          <p className="text-xs sm:text-sm font-serif italic text-[#5e3d22] mt-1 max-w-[340px] mx-auto leading-relaxed font-semibold">
            {isAuthenticated 
              ? 'Manage your session and access your personal digital twin'
              : (mode === 'login' 
                  ? 'Sign in to access your habits, lifestyle score & predictions' 
                  : 'Start your journey with an isolated personal habit journal')}
          </p>
        </div>

        {/* Authenticated State: User Profile, Continue, and Sign Out */}
        {isAuthenticated ? (
          <div className="space-y-4">
            {/* Clean Explorer Identity Card (Zero Overlaps, Crisp Layout) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#f5ebd9] border-2 border-[#c4975e]/80 flex items-center gap-4 sm:gap-5 shadow-[inset_0_1px_3px_rgba(255,255,255,0.8),0_6px_20px_rgba(74,46,24,0.12)]">
              {/* Avatar with Crisp Border — No Bleeding Rings */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-full border-2 border-[#c4975e] shadow-md bg-[#e8dcce] overflow-hidden">
                <img 
                  src={user.avatarFull || user.avatarThumb} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" title="Active Session" />
              </div>

              {/* User Identity Details — Clean Spacing, Fully Visible, Zero Collisions */}
              <div className="flex flex-col justify-center min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-xl sm:text-2xl font-black text-[#1e0f06] truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/15 border border-emerald-700/40 text-emerald-950 text-xs font-sans font-black uppercase tracking-wider shrink-0 shadow-2xs">
                    Active
                  </span>
                </div>
                <div className="text-sm font-serif font-bold text-[#6d3910] truncate">
                  {user.title || 'The Mountain Explorer'}
                </div>
                <div className="pt-0.5">
                  <span className="text-xs sm:text-[13px] font-mono text-[#3a2010] font-bold bg-white/95 px-2.5 py-0.5 rounded-md border border-[#c4975e]/50 truncate inline-block max-w-full shadow-2xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action: Open My Journal (Luxury Leather Gradient with Gold Foil Trim) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateToJournal) onNavigateToJournal();
              }}
              className="w-full py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#241308] via-[#3d2010] to-[#241308] hover:from-[#331c0d] hover:to-[#331c0d] text-[#faedd4] hover:text-[#fff2d6] border-2 border-[#d4af37]/80 shadow-[0_6px_22px_rgba(36,19,8,0.45)] hover:shadow-[0_8px_28px_rgba(36,19,8,0.65)] font-serif font-black text-sm sm:text-base tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
            >
              <span>Open My Journal (Page 2)</span>
              <span className="text-lg">→</span>
            </button>

            {/* Secondary Action: Customize Avatar (Pearl White with Gold Border) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                openCharacterModal();
              }}
              className="w-full py-2.5 sm:py-3 rounded-full bg-white/95 hover:bg-white text-[#2c180c] border-2 border-[#c5a47e]/80 hover:border-[#8b5a2b] shadow-xs font-serif font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
            >
              <span className="text-base">🎨</span>
              <span>Choose Different Avatar</span>
            </button>

            {/* Subtle Divider & Sign Out */}
            <div className="pt-1.5 border-t border-[#8b5a2b]/20 text-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 sm:py-3 rounded-full text-[#991b1b] hover:text-[#7f1d1d] hover:bg-rose-500/10 font-serif font-bold text-sm sm:text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 border border-rose-300/60 hover:border-rose-400 active:scale-95"
              >
                <svg className="w-4 h-4 text-[#991b1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Unauthenticated State: Sign In or Register Form */
          <>
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-center p-1 rounded-full bg-[#ebd8c0]/70 border border-[#c5a47e]/50 mb-4">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-1.5 rounded-full font-serif font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#241308] text-[#fce8ba] shadow-sm'
                    : 'text-[#5c3a22] hover:text-[#241308]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-1.5 rounded-full font-serif font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#241308] text-[#fce8ba] shadow-sm'
                    : 'text-[#5c3a22] hover:text-[#241308]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-red-100/90 border border-red-300 text-red-900 text-xs font-sans font-bold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 font-sans">
              {mode === 'register' && (
                <div>
                  <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#4a2e18] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. Dishant)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-[#c5a47e]/60 text-[#2c180c] placeholder-[#8b5a2b]/40 text-sm font-serif focus:outline-none focus:border-[#8b5a2b] focus:ring-2 focus:ring-[#8b5a2b]/20 shadow-xs"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#4a2e18] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@futureyou.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 border border-[#c5a47e]/60 text-[#2c180c] placeholder-[#8b5a2b]/40 text-sm font-serif focus:outline-none focus:border-[#8b5a2b] focus:ring-2 focus:ring-[#8b5a2b]/20 shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-[#4a2e18] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-white/90 border border-[#c5a47e]/60 text-[#2c180c] placeholder-[#8b5a2b]/40 text-sm font-serif focus:outline-none focus:border-[#8b5a2b] focus:ring-2 focus:ring-[#8b5a2b]/20 shadow-xs"
                    required
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8b5a2b]/70 hover:text-[#2c180c] transition-colors cursor-pointer rounded-lg hover:bg-black/5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#241308] via-[#3d2010] to-[#241308] hover:from-[#331c0d] hover:to-[#331c0d] text-[#faedd4] hover:text-[#fff2d6] border border-[#d4af37]/70 font-serif font-black text-xs sm:text-sm uppercase tracking-widest shadow-[0_6px_20px_rgba(36,19,8,0.4)] transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : mode === 'login' ? (
                  <>
                    <span>Sign In</span>
                    <span>→</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
