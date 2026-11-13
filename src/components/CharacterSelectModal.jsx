import React, { useState, useEffect } from 'react';
import { useUser, CHARACTER_PRESETS } from '../context/UserContext';

export default function CharacterSelectModal() {
  const { 
    user, 
    updateAccount, 
    isCharacterModalOpen, 
    closeCharacterModal 
  } = useUser();

  const [selectedId, setSelectedId] = useState(user?.characterId || 'explorer');
  const [nameInput, setNameInput] = useState(user?.name || 'Explorer');

  useEffect(() => {
    if (user?.characterId) setSelectedId(user.characterId);
    if (user?.name) setNameInput(user.name);
  }, [user, isCharacterModalOpen]);

  if (!isCharacterModalOpen) return null;

  const handleSave = () => {
    const selectedPreset = CHARACTER_PRESETS.find(c => c.id === selectedId) || CHARACTER_PRESETS[0];
    updateAccount({
      name: nameInput.trim() || selectedPreset.name,
      characterId: selectedPreset.id,
      customAvatarUrl: selectedPreset.avatarFull
    });
    closeCharacterModal();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-5 font-sans animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={closeCharacterModal}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
      />

      {/* Clean Glassmorphic Dialog Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[760px] max-h-[88dvh] sm:max-h-[85vh] bg-[#1a1410]/95 border-2 border-amber-400/50 rounded-2xl sm:rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] flex flex-col overflow-hidden text-white z-10"
      >
        {/* Top Gold Specular Bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-amber-200 tracking-tight leading-tight">
              Choose Your Avatar
            </h2>
            <p className="text-[11px] sm:text-sm text-white/70 mt-0.5">
              Select an archetype to represent your digital twin
            </p>
          </div>
          
          <button 
            type="button"
            onClick={closeCharacterModal}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer active:scale-95"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* 16 Avatar Grid (Clean, Spacious, Touch-friendly) */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {CHARACTER_PRESETS.map((preset) => {
              const isSelected = selectedId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedId(preset.id)}
                  className={`group relative flex flex-col items-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all cursor-pointer active:scale-98 ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02]'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/25'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 text-neutral-950 font-black text-[11px] flex items-center justify-center shadow-md">
                      ✓
                    </span>
                  )}

                  {/* Avatar SVG Portrait */}
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-800/80 border border-white/15 p-1 mb-2 transition-transform group-hover:scale-105 shadow-md">
                    <img 
                      src={preset.avatarFull} 
                      alt={preset.title}
                      className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${preset.id}&backgroundColor=b6e3f4`;
                      }}
                    />
                  </div>

                  {/* Title & Name */}
                  <span className="text-xs sm:text-sm font-extrabold text-white group-hover:text-amber-200 transition-colors line-clamp-1">
                    {preset.title}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-white/50 font-medium mt-0.5">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Name Input & Save Button */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
            <label className="text-[11px] sm:text-xs font-bold text-white/70 whitespace-nowrap">
              Your Name:
            </label>
            <input 
              type="text" 
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={closeCharacterModal}
              className="flex-1 sm:flex-none px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 sm:px-6 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_20px_rgba(251,191,36,0.35)] transition-all cursor-pointer active:scale-95 text-center"
            >
              Save Avatar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
