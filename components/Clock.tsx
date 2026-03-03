
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
    <div className="text-white text-center flex flex-col items-center select-none w-full px-6 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Day of Week */}
      <div className="animate-reveal-hero stagger-1">
        <h2 className="text-[9.6vw] lg:text-[7.36vw] font-black uppercase tracking-tighter leading-none font-serif opacity-80">
          {dayOfWeek}
        </h2>
      </div>

      {/* Time */}
      <div className="animate-reveal-hero stagger-2 my-4">
        <h1 className="text-[4.8vw] lg:text-[3.68vw] font-black tracking-tighter leading-none font-serif uppercase bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          {timeString}
        </h1>
      </div>

      {/* Full Date */}
      <div className="animate-reveal-hero stagger-3">
        <p className="text-[9.6vw] lg:text-[7.36vw] font-black tracking-tighter leading-none font-serif uppercase opacity-80">
          {restOfDate}
        </p>
      </div>
    </div>
  );
};

export default Clock;
