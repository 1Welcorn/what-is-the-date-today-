
import React from 'react';
import { WeatherData } from '../types.ts';

interface WeatherCardProps {
  weather: WeatherData;
  lastUpdated?: Date;
  onRefresh?: () => void;
  onClick?: () => void;
  isRefreshing?: boolean;
  locationSource?: 'gps' | 'default';
  isCleanMode?: boolean;
  usingAISearch?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ 
  weather, 
  lastUpdated, 
  onRefresh, 
  onClick, 
  isRefreshing, 
  locationSource,
  isCleanMode,
  usingAISearch
}) => {
  const getIcon = (code: number) => {
    if (code === 0) return 'fa-sun';
    if (code <= 3) return 'fa-cloud-sun';
    if (code <= 48) return 'fa-smog';
    if (code <= 65) return 'fa-cloud-showers-heavy';
    if (code <= 75) return 'fa-snowflake';
    if (code >= 95) return 'fa-bolt';
    return 'fa-cloud';
  };

  const formattedTime = lastUpdated?.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div 
      onClick={onClick}
      className={`glass rounded-[2rem] p-6 lg:p-8 flex items-center gap-6 text-white transition-all duration-700 cursor-pointer group active:scale-95 shadow-2xl
        ${isCleanMode ? 'bg-transparent border-none shadow-none' : 'border-l-4'}
        ${usingAISearch ? 'border-indigo-500/50' : (locationSource === 'gps' ? 'border-green-500/50' : 'border-orange-500/50')} 
        ${isRefreshing ? 'opacity-50 scale-95' : 'opacity-100 hover:scale-105 hover:bg-white/15 hover:shadow-yellow-500/10'}
      `}
    >
      <div className={`transition-all duration-700 ${isCleanMode ? 'text-8xl' : 'text-6xl'} text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(253,224,71,0.8)]`}>
        <i 
          key={weather.conditionCode}
          className={`fas ${getIcon(weather.conditionCode)} ${isRefreshing ? 'animate-spin' : 'animate-pop-in animate-float-subtle'}`}
        ></i>
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className={`font-bold transition-all duration-700 ${isCleanMode ? 'text-7xl lg:text-8xl' : 'text-5xl'}`}>
                {Math.round(weather.temperature)}°C
              </div>
              {usingAISearch && !isCleanMode && (
                <div className="bg-indigo-500/30 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-100 animate-pulse">
                  AI Search
                </div>
              )}
            </div>
            <div className={`opacity-80 font-medium leading-tight transition-all duration-700 ${isCleanMode ? 'text-2xl mt-2' : 'text-lg'}`}>
              {weather.conditionText}
            </div>
          </div>
          
          {!isCleanMode && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRefresh?.();
              }}
              disabled={isRefreshing}
              className={`p-3 rounded-full hover:bg-white/20 transition-all ${isRefreshing ? 'animate-spin bg-white/10' : 'bg-white/5'}`}
              title="Update Weather"
            >
              <i className="fas fa-rotate text-sm"></i>
            </button>
          )}
        </div>
        
        {!isCleanMode && (
          <div className="flex flex-col mt-3 animate-fade-in">
            <div className="text-sm font-bold flex items-center gap-2">
              <i className={`fas ${locationSource === 'gps' ? 'fa-location-crosshairs text-green-400' : 'fa-map-pin text-orange-400'}`}></i>
              <span className="truncate max-w-[180px]">{weather.locationName}</span>
            </div>
            
            {weather.sources && weather.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                 <span className="text-[8px] uppercase font-bold opacity-30">Grounding:</span>
                 {weather.sources.slice(0, 2).map((url, i) => (
                   <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[8px] text-indigo-300 hover:text-white transition-colors underline truncate max-w-[100px]">
                     Source {i + 1}
                   </a>
                 ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              {formattedTime && (
                <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">
                  Synced: {formattedTime}
                </span>
              )}
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 group-hover:bg-white/20 transition-colors">
                Tap for Details
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherCard;
