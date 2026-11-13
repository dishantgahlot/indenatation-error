import React, { useState } from 'react';
import { saveDailyHabits, batchUploadDataset } from '../api/client';
import { useUser } from '../context/UserContext';
import demoScenariosData from '../data/demoScenarios.json';

export const DEMO_PRESETS = (demoScenariosData?.scenarios || []).map(sc => {
  const latest = sc.weekly_logs[sc.weekly_logs.length - 1];
  return {
    id: sc.id,
    name: sc.name,
    description: sc.tagline,
    metrics: {
      sleep: latest.sleep,
      study: latest.study,
      screen: latest.screen,
      exercise: latest.exercise,
      spending: latest.spending,
      hydration: latest.hydration
    },
    weekly_logs: sc.weekly_logs,
    projected_score: sc.projected_score
  };
});

export default function LiveDatasetAdjusterModal({ isOpen, onClose, currentMetrics, onApplied }) {
  const { user } = useUser();
  const [formData, setFormData] = useState(() => {
    return {
      sleep: currentMetrics?.sleep ?? 5.2,
      study: currentMetrics?.study ?? 2.1,
      screen: currentMetrics?.screen ?? 7.8,
      exercise: currentMetrics?.exercise ?? 0.3,
      spending: currentMetrics?.spending ?? 280,
      hydration: currentMetrics?.hydration ?? 1.8
    };
  });

  const [activePreset, setActivePreset] = useState('baseline');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (preset) => {
    setActivePreset(preset.id);
    setFormData({ ...preset.metrics });
  };

  const handleSliderChange = (field, val) => {
    setActivePreset('custom');
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(val)
    }));
  };

  // Compute live score
  const liveScore = (() => {
    const sleepScore = Math.min(100, (formData.sleep / 8.0) * 100);
    const studyScore = Math.min(100, (formData.study / 4.0) * 100);
    const screenScore = Math.max(10, 100 - Math.max(0, formData.screen - 5.0) * 20);
    const exerciseScore = Math.min(100, (formData.exercise / 1.0) * 100);
    const spendingScore = Math.max(10, 100 - Math.max(0, formData.spending - 600) * 0.12);
    return Math.round(
      sleepScore * 0.25 + 
      studyScore * 0.30 + 
      screenScore * 0.20 + 
      exerciseScore * 0.15 + 
      spendingScore * 0.10
    );
  })();

  const handleApply = async () => {
    setIsSaving(true);
    try {
      // 1. Save to backend database
      await saveDailyHabits(formData);

      // 2. Upload 7-day trend history
      const matchedPreset = DEMO_PRESETS.find(p => p.id === activePreset);
      let batchHistory;
      if (matchedPreset && matchedPreset.weekly_logs) {
        batchHistory = matchedPreset.weekly_logs;
      } else {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        batchHistory = days.map((day, idx) => {
          const variance = (Math.sin(idx * 1.5) * 0.3);
          return {
            log_date: new Date(Date.now() - (6 - idx) * 86400000).toISOString().split('T')[0],
            day_name: day,
            sleep: Math.max(2, Math.round((formData.sleep + variance) * 10) / 10),
            study: Math.max(0.5, Math.round((formData.study + variance * 0.8) * 10) / 10),
            screen: Math.max(1, Math.round((formData.screen - variance) * 10) / 10),
            exercise: Math.max(0, Math.round((formData.exercise + variance * 0.2) * 10) / 10),
            spending: Math.max(100, Math.round(formData.spending + variance * 50)),
            hydration: Math.max(1, Math.round((formData.hydration + variance * 0.2) * 10) / 10),
            notes: `Demonstration day ${idx + 1}`
          };
        });
      }

      await batchUploadDataset(batchHistory);

      // 3. Save to user-scoped localStorage
      const metricsKey = user?.id ? `future_you_${user.id}_daily_metrics` : 'future_you_daily_metrics';
      const scoreKey = user?.id ? `future_you_${user.id}_lifestyle_score` : 'future_you_lifestyle_score';
      localStorage.setItem(metricsKey, JSON.stringify(formData));
      localStorage.setItem(scoreKey, JSON.stringify(liveScore));

      // 4. Dispatch global event so all pages re-render their charts & letters immediately
      window.dispatchEvent(new CustomEvent('future-you-habits-updated', { 
        detail: { userId: user?.id, metrics: formData, score: liveScore } 
      }));

      if (onApplied) {
        onApplied(formData, liveScore);
      }
      onClose();
    } catch (err) {
      console.error('Failed to apply live dataset:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in select-none font-sans">
      
      {/* Parchment Box */}
      <div 
        className="relative w-full max-w-[620px] rounded-3xl p-5 sm:p-7 shadow-[0_30px_80px_rgba(0,0,0,0.85)] border-3 border-[#b59976] overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: '#f7efe1',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.6) 0%, transparent 80%)'
        }}
      >
        {/* Parchment background texture */}
        <img 
          src="/assets/page4/parchment_clean_alpha.png" 
          alt="Parchment Texture" 
          className="absolute inset-0 w-full h-full object-fill pointer-events-none -z-10 opacity-70"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#ebd8c0]/80 hover:bg-[#faebd7] border border-[#b59976] text-[#3d2414] font-bold text-base flex items-center justify-center cursor-pointer shadow-xs transition-transform hover:scale-105"
          title="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#8b5a2b]/25 pb-3 mb-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-[#eedab4] border-2 border-[#8b5a2b] shadow-xs flex items-center justify-center text-xl shrink-0">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-serif font-black uppercase tracking-widest text-[#8b5a2b]">
                Live Demonstration Tool
              </span>
              <span className="text-xs px-2 py-0.2 rounded-full bg-emerald-600/20 text-emerald-800 font-bold border border-emerald-600/30">
                Connected to LLM Layer
              </span>
            </div>
            <h2 className="font-serif font-black text-lg sm:text-xl text-[#2c180c] leading-tight mt-0.5">
              Dynamic Habit Dataset Adjuster
            </h2>
          </div>
        </div>

        {/* Scrollable Sliders & Presets */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          
          {/* Quick-Pick Scenarios */}
          <div>
            <label className="block text-xs font-serif font-black uppercase tracking-wider text-[#4a2e18] mb-1.5">
              ⚡ 1-Click Demonstration Scenarios:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    activePreset === preset.id
                      ? 'bg-[#2c180c] text-[#fce8ba] border-[#2c180c] shadow-sm'
                      : 'bg-[#faecd4]/80 text-[#3d2414] border-[#b59976]/60 hover:bg-[#fff5e6]'
                  }`}
                >
                  <div className="font-serif font-black text-xs leading-snug">
                    {preset.name}
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5 line-clamp-1 font-sans">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Metric Sliders */}
          <div className="bg-[#faecd4]/60 border border-[#b59976]/60 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#b59976]/30">
              <span className="text-xs font-serif font-black uppercase tracking-wider text-[#4a2e18]">
                Fine-Tune Daily Metrics:
              </span>
              <div className="text-xs font-serif font-black text-[#2c180c]">
                <span>Projected Score: </span>
                <span className="text-base text-amber-800 font-black">{liveScore}/100</span>
              </div>
            </div>

            {/* Slider 1: Sleep */}
            <div>
              <div className="flex justify-between text-xs font-serif font-bold text-[#3d2414] mb-1">
                <span>😴 Sleep Duration:</span>
                <span className="font-mono text-sm text-[#527ea9]">{formData.sleep}h</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="10.0"
                step="0.1"
                value={formData.sleep}
                onChange={(e) => handleSliderChange('sleep', e.target.value)}
                className="w-full h-2 bg-[#ebdccf] rounded-lg appearance-none cursor-pointer accent-[#527ea9]"
              />
            </div>

            {/* Slider 2: Study */}
            <div>
              <div className="flex justify-between text-xs font-serif font-bold text-[#3d2414] mb-1">
                <span>📚 Focused Study / Deep Work:</span>
                <span className="font-mono text-sm text-[#c55f46]">{formData.study}h</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={formData.study}
                onChange={(e) => handleSliderChange('study', e.target.value)}
                className="w-full h-2 bg-[#ebdccf] rounded-lg appearance-none cursor-pointer accent-[#c55f46]"
              />
            </div>

            {/* Slider 3: Screen */}
            <div>
              <div className="flex justify-between text-xs font-serif font-bold text-[#3d2414] mb-1">
                <span>📱 Recreational Screen Time:</span>
                <span className="font-mono text-sm text-[#b33e37]">{formData.screen}h</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="12.0"
                step="0.1"
                value={formData.screen}
                onChange={(e) => handleSliderChange('screen', e.target.value)}
                className="w-full h-2 bg-[#ebdccf] rounded-lg appearance-none cursor-pointer accent-[#b33e37]"
              />
            </div>

            {/* Slider 4: Exercise */}
            <div>
              <div className="flex justify-between text-xs font-serif font-bold text-[#3d2414] mb-1">
                <span>🏃 Physical Exercise:</span>
                <span className="font-mono text-sm text-[#d67f56]">{formData.exercise}h</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="3.0"
                step="0.1"
                value={formData.exercise}
                onChange={(e) => handleSliderChange('exercise', e.target.value)}
                className="w-full h-2 bg-[#ebdccf] rounded-lg appearance-none cursor-pointer accent-[#d67f56]"
              />
            </div>

            {/* Slider 5: Spending */}
            <div>
              <div className="flex justify-between text-xs font-serif font-bold text-[#3d2414] mb-1">
                <span>💰 Daily Discretionary Spending:</span>
                <span className="font-mono text-sm text-[#d49b32]">₹{formData.spending}/day</span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="25"
                value={formData.spending}
                onChange={(e) => handleSliderChange('spending', e.target.value)}
                className="w-full h-2 bg-[#ebdccf] rounded-lg appearance-none cursor-pointer accent-[#d49b32]"
              />
            </div>

            {/* Slider 6: Hydration */}
            <div>
              <div className="flex justify-between text-xs font-serif font-bold text-[#3d2414] mb-1">
                <span>💧 Daily Hydration:</span>
                <span className="font-mono text-sm text-[#38bdf8]">{formData.hydration}L</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={formData.hydration}
                onChange={(e) => handleSliderChange('hydration', e.target.value)}
                className="w-full h-2 bg-[#ebdccf] rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
              />
            </div>

          </div>

        </div>

        {/* Bottom Buttons */}
        <div className="flex items-center justify-between border-t border-[#8b5a2b]/25 pt-3 mt-3 shrink-0">
          <div className="text-[11px] font-serif text-[#6a4224]">
            <span>Updates Page 3 Charts & Page 4 AI Letters instantly</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#b59976] text-[#4a2e18] hover:bg-[#faecd4] font-serif font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-[#2c180c] hover:bg-[#432310] text-[#fce8ba] font-serif font-black text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <span>Re-calculating...</span>
              ) : (
                <>
                  <span>Apply & Recalculate AI Letter</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
