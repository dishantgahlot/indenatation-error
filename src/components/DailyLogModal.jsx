import React, { useState, useEffect } from 'react';

export default function DailyLogModal({ 
  isOpen, 
  onClose, 
  metrics, 
  onSave, 
  initialMetricId = null 
}) {
  // Local form state holding current values for metrics
  const [formData, setFormData] = useState({});
  const [activeMetricId, setActiveMetricId] = useState(initialMetricId || 'sleep');
  
  // Track whether the modal was opened specifically for a single aspect
  const isSingleAspectMode = Boolean(initialMetricId);

  // Initialize or reset form data whenever modal opens
  useEffect(() => {
    if (isOpen && metrics && metrics.length > 0) {
      const initial = {};
      metrics.forEach(m => {
        initial[m.id] = m.current !== undefined ? m.current : (parseFloat(m.value) || 0);
      });
      setFormData(initial);

      if (initialMetricId) {
        setActiveMetricId(initialMetricId);
      } else {
        setActiveMetricId(metrics[0]?.id || 'sleep');
      }
    }
  }, [isOpen, metrics, initialMetricId]);

  if (!isOpen || !metrics || metrics.length === 0) return null;

  // Active metric object
  const activeMetric = metrics.find(m => m.id === activeMetricId) || metrics[0];
  const currentValue = formData[activeMetric.id] !== undefined 
    ? formData[activeMetric.id] 
    : (activeMetric.current || 0);

  // Handle number change with boundary clamping
  const handleValueChange = (id, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setFormData(prev => ({
      ...prev,
      [id]: Math.round(num * 10) / 10
    }));
  };

  // Step buttons (+ / -)
  const handleStep = (id, delta, step = 0.5) => {
    setFormData(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta * step);
      return {
        ...prev,
        [id]: Math.round(next * 10) / 10
      };
    });
  };

  // Calculate projected Lifestyle Score in real-time
  const calculateLiveScore = () => {
    if (!metrics || metrics.length === 0) return 42;
    let totalScore = 0;

    metrics.forEach(m => {
      const val = formData[m.id] !== undefined ? formData[m.id] : (m.current || 0);
      let metricScore = 50;

      if (m.id === 'sleep') {
        metricScore = Math.min(100, Math.max(10, (val / 8.0) * 100));
      } else if (m.id === 'study') {
        metricScore = Math.min(100, Math.max(10, (val / 4.0) * 100));
      } else if (m.id === 'screen') {
        const penalty = Math.max(0, val - 5.0) * 22;
        metricScore = Math.max(10, 100 - penalty);
      } else if (m.id === 'exercise') {
        metricScore = Math.min(100, Math.max(10, (val / 1.0) * 100));
      } else if (m.id === 'spending') {
        const penalty = Math.max(0, val - 600) * 0.12;
        metricScore = Math.max(10, 100 - penalty);
      } else if (m.id === 'hydration') {
        metricScore = Math.min(100, Math.max(10, (val / 3.0) * 100));
      }

      totalScore += metricScore;
    });

    return Math.round(totalScore / metrics.length);
  };

  const liveScore = calculateLiveScore();

  // Completed factors count (0 - 6)
  const completedFactorsCount = [
    Number(formData.sleep) > 0,
    Number(formData.study) > 0,
    Number(formData.screen) > 0,
    Number(formData.exercise) > 0,
    Number(formData.spending) > 0,
    Number(formData.hydration) > 0
  ].filter(Boolean).length;
  const isAllSixComplete = completedFactorsCount === 6;

  // Auto-fill all 6 factors with recommended healthy starter values for Day 1
  const handleCompleteAllForDay1 = () => {
    setFormData(prev => ({
      sleep: prev.sleep > 0 ? prev.sleep : 8.0,
      study: prev.study > 0 ? prev.study : 4.0,
      screen: prev.screen > 0 ? prev.screen : 3.5,
      exercise: prev.exercise > 0 ? prev.exercise : 1.0,
      spending: prev.spending > 0 ? prev.spending : 300,
      hydration: prev.hydration > 0 ? prev.hydration : 2.5
    }));
  };

  // Save handler: saves changes and closes
  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, is_complete: isAllSixComplete }, liveScore);
    }
    onClose();
  };

  // Today's formatted date string (e.g. Wed, Nov 11)
  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Step and range settings per metric
  const step = activeMetric.id === 'spending' ? 25 : (activeMetric.id === 'hydration' ? 0.2 : 0.5);
  const maxSlider = activeMetric.id === 'spending' 
    ? 1200 
    : (activeMetric.id === 'screen' ? 14 : (activeMetric.id === 'sleep' ? 12 : (activeMetric.id === 'hydration' ? 5 : 6)));

  // Progress percentage for active metric
  const progressRatio = activeMetric.target ? Math.min(1.5, currentValue / activeMetric.target) : 0.5;
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-3 sm:p-5 select-none font-caacupe animate-fadeIn">
      {/* 1. Ambient Warm Vignette Backdrop (Keeping the open book & desk softly glowing behind) */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
      />

      {/* 2. Top Screen Headline Framing (Vintage Explorer Field Calibration Header) */}
      <div className="relative text-center mb-3 sm:mb-4 pointer-events-none select-none max-w-xl mx-auto px-4 z-10 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ebd8c0]/95 border border-[#cfb696] text-[#2c180c] text-[10px] sm:text-[11px] font-sans font-black tracking-widest uppercase shadow-sm mb-1.5">
          <span>DAILY FIELD LOG</span>
          <span className="text-[#8e6e53]">•</span>
          <span>CALIBRATION</span>
        </div>
        <h1 className="font-handwriting text-3xl sm:text-4xl md:text-5xl font-bold text-[#fff7ed] tracking-normal drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] leading-tight">
          Calibrate Your Trajectory
        </h1>
        <p className="font-handwriting text-sm sm:text-base md:text-lg text-[#fed7aa] mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] max-w-md mx-auto">
          "Every daily habit logged recalibrates your digital twin in real time."
        </p>
      </div>

      {/* 3. The Antique Parchment Field Sheet (Authentic Aged Paper Dossier) */}
      <div 
        className="relative w-full max-w-[540px] rounded-3xl border-2 border-[#bfa27d] shadow-[0_25px_80px_rgba(20,10,5,0.7),0_10px_25px_rgba(30,15,5,0.35)] p-5 sm:p-7 overflow-hidden z-10 flex flex-col transition-all"
        style={{
          backgroundColor: '#faf3e3',
          backgroundImage: 'radial-gradient(#ebd8be 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      >
        {/* Decorative Washi Tape pinning the sheet at the top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#dfcfba]/90 border-x border-[#b59e81]/70 rotate-[-1deg] shadow-xs pointer-events-none z-20" />

        {/* Ambient Watercolor Bloom behind active metric */}
        <div 
          className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500" 
          style={{ backgroundColor: activeMetric.color || '#247b48' }} 
        />
        <div 
          className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-500" 
          style={{ backgroundColor: activeMetric.color || '#247b48' }} 
        />

        {/* Modal Top Header Bar: Tag + Title + Close Button */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#8e6e53]/25 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] sm:text-[11px] font-sans font-black tracking-widest uppercase px-3 py-0.5 rounded-full text-white shadow-xs"
                style={{ backgroundColor: activeMetric.color || '#247b48' }}
              >
                {activeMetric.label.toUpperCase()} LOG
              </span>
              <span className="text-[#8e6e53] font-bold">•</span>
              <span className="text-xs font-handwriting font-bold text-[#6d503b]">
                {todayDateString}
              </span>
            </div>
            <h2 className="font-handwriting text-2xl sm:text-3xl font-bold text-[#2c180c] tracking-normal leading-tight mt-1">
              Update Today's {activeMetric.label}
            </h2>
          </div>
          
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#ebd8c0] hover:bg-[#dfc4a4] border border-[#cfb696] text-[#2c180c] flex items-center justify-center text-sm font-black transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* 6-Factor Day 1 Progress Header */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#ebd8c0]/80 border border-[#cfb696] mb-3 relative z-10 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-sans font-black uppercase tracking-wider text-[#2c180c]">
              Day 1 Progress:
            </span>
            <span className={`text-[10px] sm:text-xs font-mono font-black px-2.5 py-0.5 rounded-full border ${
              isAllSixComplete 
                ? 'bg-emerald-800/15 text-emerald-950 border-emerald-800/40' 
                : 'bg-[#8e6e53]/15 text-[#8b3d24] border-[#8e6e53]/35'
            }`}>
              {isAllSixComplete ? '✓ 6/6 Factors (Day 1 Ready!)' : `${completedFactorsCount} / 6 Logged`}
            </span>
          </div>

          {!isAllSixComplete && (
            <button
              type="button"
              onClick={handleCompleteAllForDay1}
              className="px-2.5 py-1 rounded-full bg-[#2c180c] hover:bg-[#432313] text-[#fce8ba] text-[10px] sm:text-xs font-sans font-black tracking-wide cursor-pointer transition-all shadow-2xs hover:scale-105 active:scale-95 flex items-center gap-1"
              title="Pre-fill remaining empty factors with starter values for Day 1"
            >
              <span>✨</span>
              <span>Fill 6 for Day 1</span>
            </button>
          )}
        </div>

        {/* Aspect Tab Switcher: ONLY shown when opened with NO specific aspect selected */}
        {!isSingleAspectMode && (
          <div className="flex gap-1.5 p-1 bg-[#ede0ce]/60 border border-[#cfb696]/60 rounded-2xl mb-3.5 overflow-x-auto scrollbar-none relative z-10">
            {metrics.map((m) => {
              const isActive = m.id === activeMetricId;
              const isFilled = Number(formData[m.id]) > 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMetricId(m.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-handwriting font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#2c180c] text-[#fce8ba] shadow-xs scale-105'
                      : 'bg-transparent text-[#6d503b] hover:text-[#2c180c] hover:bg-[#ebd8c0]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span>{m.label}</span>
                  <span className={`text-[10px] font-sans font-black ${isFilled ? 'text-emerald-700' : 'text-[#8e6e53]/60'}`}>
                    {isFilled ? '✓' : '○'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* FOCUSED METRIC INSET WELL (Warm Paper Well) */}
        <div className="bg-[#f5ebd9] border border-[#cfb696]/80 rounded-2xl p-4 sm:p-5 space-y-4 relative z-10 shadow-inner">
          
          {/* Header Row: Category Icon + Category + Target + Big Hero Stat */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-xs border border-[#cfb696]"
                style={{ 
                  backgroundColor: activeMetric.bgColor || '#fdfaf2',
                  color: activeMetric.iconColor || activeMetric.color
                }}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  {activeMetric.icon}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-sans font-black tracking-widest uppercase text-[#8e6e53] block">
                  CATEGORY
                </span>
                <h3 className="font-handwriting text-2xl sm:text-3xl font-bold text-[#2c180c] tracking-normal leading-tight mt-0.5">
                  {activeMetric.label}
                </h3>
                <span className="text-xs font-sans font-semibold text-[#7c583b] mt-0.5 block">
                  {activeMetric.targetLabel || (activeMetric.target ? `Target: ${activeMetric.target}${activeMetric.unit}` : '')}
                </span>
              </div>
            </div>

            {/* Large Highlighted Number Badge */}
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-sans font-black text-[#1a0e07] tracking-tight leading-none">
                {activeMetric.id === 'spending' ? `₹${Math.round(currentValue)}` : currentValue}
                <span className="text-base sm:text-lg font-bold text-[#7c583b] ml-1">
                  {activeMetric.id === 'spending' ? '/day' : activeMetric.unit}
                </span>
              </div>
              <span 
                className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold border"
                style={{ 
                  backgroundColor: `${activeMetric.color}15`, 
                  borderColor: `${activeMetric.color}50`,
                  color: activeMetric.color || '#2c180c' 
                }}
              >
                {progressPercent}% of target
              </span>
            </div>
          </div>

          {/* Minimalist Range Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs font-sans font-bold text-[#7c583b]">
              <span>0 {activeMetric.unit || ''}</span>
              <span className="font-handwriting text-sm font-bold text-[#2c180c]">Slide to adjust</span>
              <span>{maxSlider} {activeMetric.unit || ''}</span>
            </div>
            
            <div className="relative flex items-center">
              <input 
                type="range"
                min="0"
                max={maxSlider}
                step={step}
                value={currentValue}
                onChange={(e) => handleValueChange(activeMetric.id, e.target.value)}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-[#dfcca4] focus:outline-none transition-all"
                style={{
                  accentColor: activeMetric.color || '#247b48'
                }}
              />
            </div>
          </div>

          {/* Stepper Controls: Clean Vintage Parchment Controls with Exact Value Input */}
          <div className="flex items-center justify-between gap-3 bg-[#ede0ce] p-2.5 sm:p-3 rounded-xl border border-[#cfb696]/90 shadow-xs">
            <button 
              type="button"
              onClick={() => handleStep(activeMetric.id, -1, step)}
              className="w-11 h-10 rounded-xl bg-[#fffcf7] hover:bg-[#2c180c] hover:text-[#f8d789] active:scale-95 border-2 border-[#bfa27d] text-[#2c180c] font-black text-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title={`Decrease by ${step}`}
            >
              -
            </button>

            <div className="flex items-center justify-center gap-2 flex-1">
              <span className="text-xs font-sans font-bold tracking-wider uppercase text-[#7c583b]">
                EXACT VALUE:
              </span>
              <input 
                type="number" 
                step={step}
                min="0"
                value={currentValue}
                onChange={(e) => handleValueChange(activeMetric.id, e.target.value)}
                className="w-24 px-3 py-1.5 rounded-xl bg-[#fffcf7] border-2 border-[#bfa27d] text-[#1a0e07] text-center font-mono font-black text-lg focus:outline-none focus:border-[#2c180c] transition-all shadow-inner"
              />
              <span className="text-xs font-sans font-bold text-[#7c583b]">
                {activeMetric.unit}
              </span>
            </div>

            <button 
              type="button"
              onClick={() => handleStep(activeMetric.id, 1, step)}
              className="w-11 h-10 rounded-xl bg-[#fffcf7] hover:bg-[#2c180c] hover:text-[#f8d789] active:scale-95 border-2 border-[#bfa27d] text-[#2c180c] font-black text-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title={`Increase by ${step}`}
            >
              +
            </button>
          </div>

          {/* Projected Overall Lifestyle Score Impact (Warm Honey Banner) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#faeed7] border-2 border-[#deb15c] text-[#2c180c] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-sm">✨</span>
              <span className="text-xs sm:text-sm font-sans font-bold text-[#6d4b24]">
                Projected Lifestyle Score:
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-sans font-black text-[#2c180c]">
                {liveScore}
              </span>
              <span className="text-xs font-sans font-bold text-[#8c6b4f]">
                / 100
              </span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions: Sleek Vintage Spacing */}
        <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-[#8e6e53]/25 relative z-10">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full border-2 border-[#bfa27d] text-[#6d503b] hover:bg-[#ebd8c0]/60 font-sans font-bold text-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button 
            type="button"
            onClick={handleSave}
            className="px-8 py-2.5 rounded-full bg-[#2c180c] hover:bg-[#432313] text-[#f7eed6] hover:text-[#fbe6a8] font-sans font-black text-sm tracking-wide shadow-[0_5px_18px_rgba(44,24,12,0.35)] hover:shadow-[0_7px_22px_rgba(44,24,12,0.5)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{isAllSixComplete ? 'Complete Day 1 & Start Streak (6/6) ★' : `Save Habit Log (${completedFactorsCount}/6 Done)`}</span>
            <span className="text-sm">✍</span>
          </button>
        </div>

      </div>
    </div>
  );
}
