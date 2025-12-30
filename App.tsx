
import React, { useState, useEffect, useCallback } from 'react';
import { WeatherData, CulturalInsight } from './types';
import { fetchWeather, reverseGeocode } from './services/weatherService';
import { getCulturalInsight } from './services/geminiService';
import { speakText } from './services/ttsService';
import Clock from './components/Clock';
import WeatherCard from './components/WeatherCard';

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [insight, setInsight] = useState<CulturalInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const initializeApp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });

      const { latitude, longitude } = position.coords;
      const weatherData = await fetchWeather(latitude, longitude);
      const locName = await reverseGeocode(latitude, longitude);
      const updatedWeather = { ...weatherData, locationName: locName };
      setWeather(updatedWeather);

      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
      const insightData = await getCulturalInsight(dateStr, weatherData.conditionText);
      setInsight(insightData);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to initialize app. Please check location permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
    const interval = setInterval(initializeApp, 3600000);
    return () => clearInterval(interval);
  }, [initializeApp]);

  const handleSpeakDate = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const today = new Date();
    const fullDateStr = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const timeStr = today.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    
    let speechText = `Today is ${fullDateStr}. The current time is ${timeStr}.`;
    
    if (weather) {
      speechText += ` In ${weather.locationName}, the weather is currently ${weather.conditionText} with a temperature of ${Math.round(weather.temperature)} degrees Celsius.`;
    }
    
    await speakText(speechText);
    setIsSpeaking(false);
  };

  const finalBgStyle = insight?.imageKeyword 
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('https://loremflickr.com/1920/1080/${encodeURIComponent(insight.imageKeyword)}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(to bottom, #020617, #0f172a)' };

  const getWeatherEventIcon = (type: string) => {
    switch (type) {
      case 'extreme_heat': return 'fa-temperature-high text-orange-400';
      case 'extreme_cold': return 'fa-snowflake text-blue-300';
      case 'storm': return 'fa-wind text-gray-300';
      case 'flood': return 'fa-house-flood-water text-cyan-400';
      default: return 'fa-cloud-bolt text-yellow-400';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && !weather) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
        <div className="animate-spin text-8xl mb-12 text-indigo-500">
          <i className="fas fa-circle-notch"></i>
        </div>
        <p className="text-3xl font-light tracking-[0.5em] uppercase animate-pulse">Initializing Board...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col">
      {/* Background with zoom effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000 animate-bg-zoom"
        style={finalBgStyle}
      ></div>
      
      {insight && (
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none fade-in" 
          style={{ backgroundColor: insight.themeColor }}
        ></div>
      )}

      {/* Full Screen Overlay for Recall (Cultural or Weather) */}
      {expandedId && insight && (
        <div 
          className="fixed inset-0 z-[100] glass backdrop-blur-[40px] flex flex-col p-16 lg:p-24 fade-in cursor-pointer overflow-y-auto"
          onClick={() => setExpandedId(null)}
        >
          <div className="flex justify-between items-start mb-16">
            <div className="flex items-center gap-8">
              <div className={`text-7xl lg:text-8xl ${expandedId === 'cultural' ? 'text-purple-400' : getWeatherEventIcon(insight.historicalWeather?.type || 'other').split(' ')[1]}`}>
                <i className={`fas ${expandedId === 'cultural' ? 'fa-landmark' : getWeatherEventIcon(insight.historicalWeather?.type || 'other').split(' ')[0]}`}></i>
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-black tracking-[0.5em] uppercase opacity-60 block mb-2">
                  {expandedId === 'cultural' ? 'Cultural Recall' : 'Weather Recall'}
                </span>
                <span className="text-3xl lg:text-4xl opacity-40 font-sans">
                  {expandedId === 'cultural' ? insight.location : `Year ${insight.historicalWeather?.year}`}
                </span>
              </div>
            </div>
            <button className="text-5xl opacity-40 hover:opacity-100 transition-opacity">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="max-w-[80vw] mx-auto">
            <h2 className="text-7xl lg:text-[6vw] font-black font-serif text-white mb-16 leading-tight border-b-8 border-white/10 pb-8">
              {expandedId === 'cultural' ? insight.event : insight.historicalWeather?.name}
            </h2>
            <p className="text-4xl lg:text-[4vw] leading-relaxed font-light text-white opacity-95">
              {expandedId === 'cultural' ? insight.description : insight.historicalWeather?.description}
            </p>
            <div className="mt-24 text-2xl lg:text-3xl opacity-40 uppercase tracking-widest font-bold text-center italic">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}

      {/* TV Guides */}
      <div className="absolute inset-8 border border-white/5 pointer-events-none rounded-[3rem] fade-in"></div>

      <main className="relative z-10 flex-1 flex flex-col p-12 lg:p-16 h-full overflow-hidden">
        
        {/* Header Section */}
        <div className="w-full flex justify-between items-start shrink-0">
          <div className="animate-slide-down stagger-1">
            {weather && <WeatherCard weather={weather} />}
          </div>
          
          {/* TTS Button */}
          <button 
            onClick={handleSpeakDate}
            className={`glass h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 border-2 animate-slide-down stagger-1 ${isSpeaking ? 'border-indigo-500 bg-indigo-500/30 scale-110' : 'border-white/20 hover:border-white/60'}`}
            title="Read Date and Weather Aloud"
          >
            <i className={`fas ${isSpeaking ? 'fa-volume-high animate-pulse' : 'fa-volume-low'} text-4xl text-white`}></i>
          </button>
        </div>

        {/* Hero Section: The Date - Scaled to fill remaining space */}
        <div className="flex-1 flex items-center justify-center animate-reveal-hero stagger-2">
          <Clock />
        </div>

        {/* Bottom Section: Recall Lines */}
        <div className="w-full max-w-[120rem] mx-auto space-y-4 shrink-0 mt-8 pb-8">
          {insight && (
            <>
              {/* Cultural Recall Line */}
              <div 
                onClick={() => toggleExpand('cultural')}
                className="glass rounded-full px-10 py-6 hover:bg-white/20 transition-all duration-300 cursor-pointer overflow-hidden group border border-white/10 hover:border-purple-500/50 animate-slide-up stagger-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className="text-3xl text-purple-400">
                      <i className="fas fa-landmark"></i>
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-[0.3em] uppercase opacity-40 block">Cultural Recall</span>
                      <h2 className="text-3xl font-bold font-serif text-white flex items-center gap-4">
                        {insight.event} <span className="text-lg opacity-30 font-sans font-normal">— {insight.location}</span>
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white/30 group-hover:text-white/60 transition-colors">
                    <span className="text-sm font-bold tracking-widest uppercase">Tap to read</span>
                    <i className="fas fa-expand"></i>
                  </div>
                </div>
              </div>

              {/* Weather Recall Line */}
              <div 
                onClick={() => toggleExpand('weather')}
                className="glass rounded-full px-10 py-6 hover:bg-white/20 transition-all duration-300 cursor-pointer overflow-hidden group border border-white/10 hover:border-cyan-500/50 animate-slide-up stagger-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <div className={`text-3xl ${getWeatherEventIcon(insight.historicalWeather?.type || 'other').split(' ')[1]}`}>
                      <i className={`fas ${getWeatherEventIcon(insight.historicalWeather?.type || 'other').split(' ')[0]}`}></i>
                    </div>
                    <div>
                      <span className="text-xs font-black tracking-[0.3em] uppercase opacity-40 block">Weather Recall</span>
                      <h2 className="text-3xl font-bold font-serif text-white flex items-center gap-4">
                        {insight.historicalWeather?.name} <span className="text-lg opacity-30 font-sans font-normal">— Year {insight.historicalWeather?.year}</span>
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white/30 group-hover:text-white/60 transition-colors">
                    <span className="text-sm font-bold tracking-widest uppercase">Tap to read</span>
                    <i className="fas fa-expand"></i>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Subtle border to frame the screen edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 fade-in"></div>
    </div>
  );
};

export default App;
