
import React, { useState, useRef, useEffect } from 'react';
import { speakText, preloadText } from '../services/ttsService';

interface ThermalIndicatorProps {
  temperature: number;
}

const levels = [
  { label: 'Burning hot', color: 'bg-red-600', textColor: 'text-red-100', icon: 'fa-fire', feature: 'MELTING' },
  { label: 'hot', color: 'bg-orange-500', textColor: 'text-orange-100', icon: 'fa-sun', feature: 'SWEATING' },
  { label: 'warm', color: 'bg-yellow-400', textColor: 'text-yellow-900', icon: 'fa-face-smile-beam', feature: 'PERFECT' },
  { label: 'cool', color: 'bg-cyan-400', textColor: 'text-cyan-900', icon: 'fa-face-smile', feature: 'REFRESHING' },
  { label: 'cold', color: 'bg-blue-500', textColor: 'text-blue-100', icon: 'fa-face-grimace', feature: 'SHIVERING' },
  { label: 'Freezing cold', color: 'bg-indigo-700', textColor: 'text-indigo-100', icon: 'fa-snowflake', feature: 'FROZEN' }
].reverse();

const ThermalIndicator: React.FC<ThermalIndicatorProps> = ({ temperature }) => {
  const tubeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastSpokenIndex = useRef<number | null>(null);

  const getThermalData = (temp: number) => {
    if (temp >= 40) return { label: 'Burning hot', color: 'bg-red-600', textColor: 'text-red-100', index: 5 };
    if (temp >= 30) return { label: 'hot', color: 'bg-orange-500', textColor: 'text-orange-100', index: 4 };
    if (temp >= 20) return { label: 'warm', color: 'bg-yellow-400', textColor: 'text-yellow-900', index: 3 };
    if (temp >= 10) return { label: 'cool', color: 'bg-cyan-400', textColor: 'text-cyan-900', index: 2 };
    if (temp >= 0) return { label: 'cold', color: 'bg-blue-500', textColor: 'text-blue-100', index: 1 };
    return { label: 'Freezing cold', color: 'bg-indigo-700', textColor: 'text-indigo-100', index: 0 };
  };

  const realCurrent = getThermalData(temperature);
  const displayIndex = draggedIndex !== null ? draggedIndex : realCurrent.index;
  const current = { ...levels[displayIndex], index: displayIndex };

  const displayIndexRef = useRef(displayIndex);
  useEffect(() => {
    displayIndexRef.current = displayIndex;
  }, [displayIndex]);

  const handleDrag = (clientY: number) => {
    if (!tubeRef.current) return;
    const rect = tubeRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const percent = 1 - Math.max(0, Math.min(1, y / rect.height));
    const newIndex = Math.floor(percent * levels.length);
    setDraggedIndex(Math.max(0, Math.min(levels.length - 1, newIndex)));
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleDrag(e.clientY);
    const onTouchMove = (e: TouchEvent) => handleDrag(e.touches[0].clientY);
    const onEnd = async () => {
      setIsDragging(false);
      // Trigger speech when dragging ends
      const finalIndex = displayIndexRef.current;
      if (lastSpokenIndex.current !== finalIndex) {
        setIsSpeaking(true);
        await speakText(levels[finalIndex].label);
        setIsSpeaking(false);
        lastSpokenIndex.current = finalIndex;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  // Reset dragged index when temperature prop changes significantly
  useEffect(() => {
    setDraggedIndex(null);
  }, [temperature]);

  // Preload all audio on mount
  useEffect(() => {
    levels.forEach(level => {
      preloadText(level.label);
    });
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 animate-reveal-hero stagger-4 scale-75 lg:scale-100">
      <div className="relative p-1.5 bg-gradient-to-br from-red-400 via-green-400 to-blue-400 rounded-full shadow-2xl">
        <div className="relative flex flex-col items-center p-2 bg-white backdrop-blur-md rounded-full border-2 border-slate-800">
          {/* Thermometer Tube */}
          <div 
            ref={tubeRef}
            className="relative w-32 h-64 bg-slate-100 rounded-2xl border-2 border-slate-800 cursor-crosshair"
            onMouseDown={(e) => {
              setIsDragging(true);
              handleDrag(e.clientY);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleDrag(e.touches[0].clientY);
            }}
          >
            {/* Colored Bars (Clipped) */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col-reverse">
              {levels.map((level, i) => (
                <div 
                  key={`bar-${level.label}`}
                  className={`flex-1 w-full transition-all duration-1000 border-t border-black/5
                    ${i <= displayIndex ? level.color : 'bg-transparent'}
                    ${i === displayIndex ? 'animate-pulse' : ''}
                  `}
                />
              ))}
            </div>

            {/* Labels and Active Marker (Not Clipped) */}
            <div className="absolute inset-0 flex flex-col-reverse">
              {levels.map((level, i) => (
                <div 
                  key={`label-${level.label}`}
                  className="flex-1 w-full flex items-center justify-center relative px-2 cursor-pointer group/level"
                  onClick={async (e) => {
                    e.stopPropagation();
                    setDraggedIndex(i);
                    if (lastSpokenIndex.current !== i) {
                      setIsSpeaking(true);
                      await speakText(levels[i].label);
                      setIsSpeaking(false);
                      lastSpokenIndex.current = i;
                    }
                  }}
                >
                  {/* Hover Highlight */}
                  <div className="absolute inset-x-4 inset-y-1 bg-white/0 group-hover/level:bg-white/10 rounded-lg transition-colors pointer-events-none" />
                  
                  <span className={`text-[10px] lg:text-[11px] font-black uppercase tracking-tighter text-center transition-opacity duration-1000 z-10 whitespace-nowrap ${i <= displayIndex ? 'opacity-100' : 'opacity-20'} ${i === 3 ? 'text-slate-900' : 'text-white'}`}>
                    {level.label}
                  </span>
                  
                  {i === displayIndex && (
                    <div 
                      className={`absolute left-36 flex items-center z-20 transition-transform duration-300 ${isDragging ? 'scale-110 cursor-grabbing' : 'animate-slide-right cursor-grab'}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setIsDragging(true);
                      }}
                    >
                      {/* Arrow */}
                      <div className="w-12 h-12 mr-2 flex items-center justify-center">
                        <i className="fas fa-long-arrow-alt-left text-white text-4xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]"></i>
                      </div>
                      
                      {/* Label Box */}
                      <div className="bg-dots p-0.5 rounded-sm shadow-2xl border-2 border-slate-800">
                        <div className="bg-white/95 px-2 py-0.5 border border-dashed border-slate-300 flex flex-col items-center">
                          <span className={`text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight whitespace-nowrap transition-all duration-300 ${isSpeaking ? 'scale-110 text-indigo-600' : 'scale-100'}`}>
                            {level.label}
                          </span>
                          {isDragging && (
                            <span className="text-[9px] font-bold text-indigo-500 uppercase mt-0.5 animate-pulse">Calibrating...</span>
                          )}
                          {isSpeaking && !isDragging && (
                            <span className="text-[9px] font-bold text-indigo-500 uppercase mt-0.5 animate-bounce">Announcing...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        
        {/* Bulb */}
        <div className={`w-32 h-32 rounded-full mt-2 border-4 border-slate-800 shadow-2xl transition-colors duration-1000 flex flex-col items-center justify-center z-30 ${current.color}`}>
           {draggedIndex !== null ? (
             <div className="flex flex-col items-center animate-pop-in">
               <i className={`fas ${current.icon} text-4xl ${current.textColor} mb-1`}></i>
               <span className={`text-[9px] font-black uppercase tracking-widest ${current.textColor} opacity-80`}>
                 {current.feature}
               </span>
             </div>
           ) : (
             <span className={`text-2xl font-black ${current.textColor}`}>{Math.round(temperature)}°</span>
           )}
        </div>
      </div>
    </div>
    
    <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mt-2 bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm border border-white/5">
        Atmospheric Thermal Scale
      </div>
    </div>
  );
};

export default ThermalIndicator;
