
import React from 'react';
import { WeatherData } from '../types';

interface WeatherCardProps {
  weather: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const getIcon = (code: number) => {
    if (code === 0) return 'fa-sun';
    if (code <= 3) return 'fa-cloud-sun';
    if (code <= 48) return 'fa-smog';
    if (code <= 65) return 'fa-cloud-showers-heavy';
    if (code <= 75) return 'fa-snowflake';
    if (code >= 95) return 'fa-bolt';
    return 'fa-cloud';
  };

  return (
    <div className="glass rounded-3xl p-8 flex items-center gap-6 text-white min-w-[280px] shadow-2xl">
      <div className="text-6xl text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]">
        <i 
          key={weather.conditionCode}
          className={`fas ${getIcon(weather.conditionCode)} animate-pop-in animate-float-subtle`}
        ></i>
      </div>
      <div>
        <div className="text-5xl font-bold">{Math.round(weather.temperature)}°C</div>
        <div className="text-lg opacity-80 font-medium">{weather.conditionText}</div>
        <div className="text-sm opacity-60 flex items-center gap-1 mt-1">
          <i className="fas fa-location-dot"></i>
          {weather.locationName}
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
