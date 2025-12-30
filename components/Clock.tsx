
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  
  const dateString = time.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const dayOfWeek = dateString.split(',')[0];
  const restOfDate = dateString.split(',').slice(1).join(',');

  return (
    <div className="text-white text-center drop-shadow-[0_30px_30px_rgba(0,0,0,0.8)] flex flex-col items-center select-none w-full px-4">
      {/* Secondary: Time */}
      <div className="flex items-center gap-8 opacity-70 mb-8 lg:mb-12 fade-in">
        <div className="h-[3px] w-20 lg:w-40 bg-gradient-to-r from-transparent to-white/50"></div>
        <span className="text-6xl md:text-8xl lg:text-9xl font-light tracking-[0.3em] font-sans">
          {timeString}
        </span>
        <div className="h-[3px] w-20 lg:w-40 bg-gradient-to-l from-transparent to-white/50"></div>
      </div>

      {/* Primary: Date (Massive for TV) */}
      <div className="flex flex-col items-center w-full">
        <h1 className="text-[14.4vw] lg:text-[17.6vw] font-black tracking-tighter leading-[0.8] font-serif uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
          {dayOfWeek}
        </h1>
        <span className="block text-[6vw] lg:text-[7vw] font-bold tracking-tight mt-[-2vw] opacity-90 lowercase font-sans border-t-8 border-white/10 pt-4 px-20">
           {restOfDate}
        </span>
      </div>
    </div>
  );
};

export default Clock;
