
import React from 'react';
import { WeatherData } from '../types.ts';

interface NotebookGuideProps {
  weather: WeatherData;
  onClose: () => void;
}

const NotebookGuide: React.FC<NotebookGuideProps> = ({ weather, onClose }) => {
  const today = new Date();
  
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const fullDate = today.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const getShortCondition = (text: string) => {
    if (!text) return "Unknown";
    const lower = text.toLowerCase();
    
    if (lower.includes('thunderstorm')) return 'Thunderstorm';
    if (lower.includes('drizzle')) return 'Light Rain';
    if (lower.includes('partly cloudy')) return 'Partly Cloudy';
    if (lower.includes('mainly clear')) return 'Mainly Clear';
    if (lower.includes('clear sky')) return 'Clear Sky';
    if (lower.includes('overcast')) return 'Cloudy';
    
    const words = text.split(' ').filter(w => w.length > 0);
    return words.length <= 2 ? text : words.slice(0, 2).join(' ');
  };

  const shortCondition = getShortCondition(weather.conditionText);

  return (
    <div 
      className="fixed inset-0 z-[500] flex flex-col bg-white fade-in overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="flex-1 flex flex-col w-full h-full p-0 m-0 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-[1.2] flex items-center justify-center w-full px-8 overflow-hidden">
           <h1 className="text-[14vw] md:text-[12vw] font-serif font-black text-slate-900 leading-none tracking-tighter uppercase text-center">
            {dayName}
          </h1>
        </div>

        <div className="flex-none w-full bg-slate-50 border-y-2 lg:border-y-4 border-slate-100 py-8 lg:py-16 flex items-center justify-center">
          <h2 className="text-[7.5vw] md:text-[5.5vw] font-sans font-bold text-slate-300 tracking-tight leading-none uppercase text-center px-4">
            {fullDate}
          </h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full px-8 pb-10">
          <div className="text-[26vw] md:text-[20vw] font-black text-slate-950 leading-none tracking-tighter flex items-center justify-center py-2">
            <span>{Math.round(weather.temperature)}°C</span>
          </div>
          
          <div className="text-[9vw] md:text-[7vw] font-serif italic text-slate-400 capitalize leading-tight text-center mt-2">
            {shortCondition}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 lg:top-12 lg:right-12 h-14 w-14 lg:h-24 lg:w-24 rounded-full bg-slate-100/80 hover:bg-slate-200 transition-all active:scale-90 flex items-center justify-center shadow-sm z-[600]"
          aria-label="Close Guide"
        >
          <i className="fas fa-times text-2xl lg:text-5xl text-slate-500"></i>
        </button>
      </div>
    </div>
  );
};

export default NotebookGuide;
