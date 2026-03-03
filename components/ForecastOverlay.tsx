
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types.ts';
import ThermalIndicator from './ThermalIndicator.tsx';

interface ForecastOverlayProps {
  weather: WeatherData;
  onClose: () => void;
  isDiscreteMode?: boolean;
}

const ForecastOverlay: React.FC<ForecastOverlayProps> = ({ weather, onClose, isDiscreteMode: initialDiscrete }) => {
  const [localDiscrete, setLocalDiscrete] = useState(initialDiscrete);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFsChange = () => setIsNativeFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getIcon = (code: number) => {
    if (code === 0) return 'fa-sun text-yellow-400';
    if (code <= 3) return 'fa-cloud-sun text-gray-300';
    if (code <= 48) return 'fa-smog text-blue-200';
    if (code <= 65) return 'fa-cloud-showers-heavy text-blue-400';
    if (code <= 75) return 'fa-snowflake text-indigo-200';
    if (code >= 95) return 'fa-bolt text-yellow-300';
    return 'fa-cloud text-gray-400';
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const toggleLocalDiscrete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalDiscrete(!localDiscrete);
  };

  const toggleNativeFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col backdrop-blur-[120px] bg-black/95 fade-in cursor-default p-0 m-0 overflow-hidden select-none"
      onClick={onClose}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className={`fixed top-4 right-4 lg:top-8 lg:right-8 z-[120] h-10 w-10 lg:h-20 lg:w-20 glass rounded-full flex items-center justify-center transition-all duration-700 hover:bg-white/20 group border border-white/5 shadow-2xl
          ${localDiscrete ? 'opacity-20 hover:opacity-100 scale-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-[-20px]'}`}
        title="Return to Dashboard"
      >
        <i className="fas fa-chevron-left text-white text-xs lg:text-3xl group-hover:scale-110 transition-transform"></i>
      </button>

      <header className={`w-full flex justify-between items-center px-4 lg:px-16 pt-6 lg:pt-12 pb-6 border-b border-white/5 transition-all duration-700 ease-in-out ${localDiscrete ? 'opacity-0 -translate-y-full absolute pointer-events-none' : 'opacity-100 translate-y-0 relative'}`}>
        <div className="flex flex-col max-w-[50%] lg:max-w-[70%]">
          <div className="flex items-center gap-3 lg:gap-8 mb-2 lg:mb-4">
            <span className="h-1.5 lg:h-3 w-8 lg:w-24 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.5)]"></span>
            <h2 className="text-xs lg:text-2xl font-black uppercase tracking-[0.3em] lg:tracking-[0.5em] text-white/30 whitespace-nowrap overflow-hidden">Atmospheric Analysis</h2>
          </div>
          <h1 className="text-[6vw] lg:text-[6vw] font-serif font-bold text-white tracking-tighter leading-none truncate drop-shadow-2xl">
            {weather.locationName}
          </h1>
        </div>
        
        <div className="flex gap-3 lg:gap-8 shrink-0">
          <button 
            onClick={toggleNativeFullscreen}
            className={`h-12 w-12 lg:h-32 lg:w-32 glass rounded-full flex items-center justify-center transition-all text-xl lg:text-6xl group shadow-2xl border-2 ${isNativeFullscreen ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10 hover:border-white/40'}`}
            title={isNativeFullscreen ? "Exit Immersion" : "Enter Immersion"}
          >
            <i className={`fas ${isNativeFullscreen ? 'fa-compress' : 'fa-expand'} text-white group-hover:scale-110 transition-transform`}></i>
          </button>
          <button 
            onClick={toggleLocalDiscrete}
            className="h-12 w-12 lg:h-32 lg:w-32 glass rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-xl lg:text-6xl group shadow-2xl border-2 border-white/10"
            title="Focus Mode"
          >
            <i className={`fas ${localDiscrete ? 'fa-eye' : 'fa-eye-slash'} opacity-30 group-hover:opacity-100 transition-opacity text-white`}></i>
          </button>
          <button 
            onClick={onClose}
            className="h-12 w-12 lg:h-32 lg:w-32 glass rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-xl lg:text-6xl group shadow-2xl border-2 border-white/10"
          >
            <i className="fas fa-times opacity-30 group-hover:opacity-100 transition-opacity text-white"></i>
          </button>
        </div>
      </header>

      <div className={`flex-1 w-full overflow-hidden p-4 lg:p-6 flex flex-col items-center justify-center transition-all duration-1000 ${localDiscrete ? 'scale-[1.02] lg:scale-[1.03]' : ''}`}>
        <div className="max-w-[98vw] w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center justify-items-center">
          {/* Today's Weather Detail */}
          <div className="flex flex-col items-center lg:items-start gap-6 lg:gap-10 animate-reveal-hero w-full max-w-4xl">
            <div className="flex items-center justify-center lg:justify-start gap-6 lg:gap-12 w-full">
              <i className={`fas ${getIcon(weather.conditionCode)} text-[22vw] lg:text-[14vw] text-yellow-300 drop-shadow-[0_20px_40px_rgba(253,224,71,0.3)] animate-float-subtle`}></i>
              <div className="flex flex-col">
                <span className="text-[18vw] lg:text-[12vw] font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                  {Math.round(weather.temperature)}°C
                </span>
                <span className="text-2xl lg:text-5xl font-black uppercase tracking-[0.2em] text-white/60 drop-shadow-lg mt-2">
                  {weather.conditionText}
                </span>
              </div>
            </div>

            <div className="glass rounded-[3rem] p-8 lg:p-12 w-full border-t border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
              <div className="grid grid-cols-2 gap-6 lg:gap-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] lg:text-lg font-black uppercase tracking-widest text-white/30">Location</span>
                  <span className="text-xl lg:text-4xl font-bold text-white truncate">{weather.locationName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] lg:text-lg font-black uppercase tracking-widest text-white/30">Atmosphere</span>
                  <span className="text-xl lg:text-4xl font-bold text-white uppercase">{weather.conditionText}</span>
                </div>
                {weather.daily && weather.daily[0] && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] lg:text-lg font-black uppercase tracking-widest text-white/30">Daily High</span>
                      <span className="text-xl lg:text-4xl font-bold text-yellow-400">{Math.round(weather.daily[0].maxTemp)}°C</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] lg:text-lg font-black uppercase tracking-widest text-white/30">Daily Low</span>
                      <span className="text-xl lg:text-4xl font-bold text-blue-400">{Math.round(weather.daily[0].minTemp)}°C</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Thermal Indicator Section */}
          <div className="flex flex-col items-center justify-center lg:justify-self-end lg:-translate-x-72 animate-reveal-hero stagger-2 w-full max-h-[60vh] lg:max-h-none">
            <div className="scale-[1.1] sm:scale-[1.3] lg:scale-[1.6] xl:scale-[1.8] origin-center transition-transform duration-500">
              <ThermalIndicator temperature={weather.temperature} />
            </div>
          </div>
        </div>
      </div>

      <footer className={`w-full h-8 lg:h-20 flex items-center justify-center gap-4 lg:gap-16 transition-all duration-700 ease-in-out px-4 ${localDiscrete ? 'opacity-0 translate-y-full absolute pointer-events-none' : 'opacity-20 translate-y-0 relative'}`}>
        <div className="flex items-center gap-2 lg:gap-3">
          <i className="fas fa-satellite-dish text-[10px] lg:text-2xl text-indigo-400"></i>
          <span className="text-[7px] lg:text-sm font-black uppercase tracking-[0.3em] lg:tracking-[0.8em]">Satellite Link: Stable</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 lg:gap-3">
          <i className="fas fa-microchip text-[10px] lg:text-2xl text-blue-400"></i>
          <span className="text-[7px] lg:text-sm font-black uppercase tracking-[0.3em] lg:tracking-[0.8em]">Analysis Engine: Active</span>
        </div>
      </footer>

      <div 
        onClick={toggleLocalDiscrete}
        className={`fixed bottom-0 left-0 right-0 h-4 hover:bg-white/10 transition-all z-[110] cursor-pointer ${localDiscrete ? 'opacity-30' : 'opacity-0'}`}
      ></div>
    </div>
  );
};

export default ForecastOverlay;
