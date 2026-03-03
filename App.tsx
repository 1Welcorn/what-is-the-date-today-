
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData } from './types.ts';
import { fetchWeather, reverseGeocode, fetchWeatherViaGemini } from './services/weatherService.ts';
import { speakText } from './services/ttsService.ts';
import { getImage, saveImage, saveWeather, getWeather } from './services/dbService.ts';
import Clock from './components/Clock.tsx';
import WeatherCard from './components/WeatherCard.tsx';
import ForecastOverlay from './components/ForecastOverlay.tsx';
import NotebookGuide from './components/NotebookGuide.tsx';
import ThermalIndicator from './components/ThermalIndicator.tsx';

const WALLPAPERS = [
  'https://i.ibb.co/c4RJyrx/dynamic-cityscape-at-night-1o782x3nkldsi7oy.webp',
  'https://i.ibb.co/YTLVj1r1/among-us-sus-desktop-background-y4bioj7iu1job3kq.webp',
  'https://i.ibb.co/39jFQ9tQ/Uzumaki-Naruto-In-Competition-With-Uchiha-Sasuke.webp'
];

const App: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [locationSource, setLocationSource] = useState<'gps' | 'default' | 'manual'>('default');
  const [usingAISearch, setUsingAISearch] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  
  const lastFetchRef = useRef<number>(0);

  const initializeApp = useCallback(async (isManual = false, customQuery?: string) => {
    const now = Date.now();
    if (isManual && !customQuery && now - lastFetchRef.current < 5000) return;
    lastFetchRef.current = now;

    setLoading(true);
    setError(null);
    if (customQuery) {
      setIsSearchOpen(false);
    }

    try {
      let finalWeather: WeatherData | null = null;
      if (customQuery) {
        setUsingAISearch(true);
        setLocationSource('manual');
        finalWeather = await fetchWeatherViaGemini(customQuery);
      } else {
        let lat = -15.7975; 
        let lon = -47.8919;
        let source: 'gps' | 'default' = 'default';

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("No GPS support"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            timeout: 4000, 
            enableHighAccuracy: false
          });
        }).then(pos => {
          source = 'gps';
          return pos;
        }).catch(() => {
          source = 'default';
          return null;
        });

        if (position) {
          lat = position.coords.latitude;
          lon = position.coords.longitude;
        }
        setLocationSource(source);

        let locName = "Detecting...";
        try {
          locName = source === 'default' ? "Brasília, BR" : await reverseGeocode(lat, lon);
        } catch (e) {
          locName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        }

        try {
          const weatherData = await fetchWeather(lat, lon);
          finalWeather = { ...weatherData, locationName: locName };
          setUsingAISearch(false);
        } catch (weatherErr: any) {
          if (weatherErr.message.includes("Busy") || weatherErr.message.includes("Rate limit")) {
            setUsingAISearch(true);
            finalWeather = await fetchWeatherViaGemini(locName);
          } else {
            throw weatherErr;
          }
        }
      }
      
      if (finalWeather) {
        setWeather(finalWeather);
        await saveWeather('last_weather_state', { weather: finalWeather, usingAISearch, locationSource });
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Atmospheric Error:", err);
      setError(err.message || "Engine Link Lost.");
    } finally {
      setLoading(false);
    }
  }, [usingAISearch, locationSource]);

  useEffect(() => {
    const loadInitial = async () => {
      const cached = await getWeather('last_weather_state');
      if (cached) {
        setWeather(cached.data.weather);
        setUsingAISearch(cached.data.usingAISearch);
        setLocationSource(cached.data.locationSource);
      }
      initializeApp();
    };
    loadInitial();
    
    const interval = setInterval(() => {
      if (locationSource !== 'manual') initializeApp(false);
    }, 900000); 
    return () => clearInterval(interval);
  }, []);

  const handleSpeakDate = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    const today = new Date();
    const fullDateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    let speechText = `Today is ${fullDateStr}. The current time is ${timeStr}.`;
    
    if (weather) {
      speechText += ` In ${weather.locationName}, it's ${weather.conditionText} at ${Math.round(weather.temperature)} degrees Celsius.`;
      if (usingAISearch) speechText += " This report was obtained via global satellite search.";
    } else if (error) {
      speechText += ` Atmospheric data is currently unavailable.`;
    }
    
    await speakText(speechText);
    setIsSpeaking(false);
  };

  useEffect(() => {
    const url = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
    
    const loadBg = async () => {
      try {
        const cached = await getImage(url);
        if (cached) {
          setBgImageUrl(URL.createObjectURL(cached.blob));
          return;
        }
        
        const response = await fetch(url);
        const blob = await response.blob();
        await saveImage(url, blob);
        setBgImageUrl(URL.createObjectURL(blob));
      } catch (e) {
        console.error("BG Cache Error:", e);
        setBgImageUrl(url);
      }
    };
    
    loadBg();
  }, [weather]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(e => console.error(e));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const getWeatherTheme = (code: number | undefined) => {
    if (code === undefined) return 'abstract-dark';
    if (code === 0) return 'sunny-horizon';
    if (code <= 3) return 'cloudy-day';
    if (code <= 48) return 'misty-landscape';
    if (code <= 65) return 'rain-drops';
    if (code <= 75) return 'snow-field';
    if (code >= 95) return 'storm-clouds';
    return 'nature';
  };

  const finalBgStyle = bgImageUrl 
    ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('${bgImageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(to bottom, #020617, #0f172a)' };

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
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col bg-black">
      <div 
        className={`absolute inset-0 transition-all duration-[3000ms] ease-in-out ${isFullscreen ? 'scale-110 opacity-50' : 'scale-100 opacity-100'}`} 
        style={{ ...finalBgStyle }}
      ></div>
      
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 lg:p-20 backdrop-blur-3xl bg-black/60 fade-in">
          <div className="w-full max-w-4xl glass rounded-[2.5rem] p-8 lg:p-16 flex flex-col gap-8 shadow-2xl animate-reveal-hero border-2 border-white/10">
            <div className="flex justify-between items-center">
              <h2 className="text-xl lg:text-4xl font-serif font-black text-white uppercase tracking-tighter">Atmospheric Redirect</h2>
              <button onClick={() => setIsSearchOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <i className="fas fa-times text-2xl lg:text-4xl"></i>
              </button>
            </div>
            <p className="text-sm lg:text-lg text-white/50 leading-relaxed font-medium">
              Enter a city name, zip code, or a <span className="text-indigo-400">BBC Weather URL</span> to recalibrate the satellite link.
            </p>
            <div className="relative group">
              <input 
                autoFocus
                type="text"
                placeholder="e.g. Rio de Janeiro or bbc.com/weather/3458449"
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 px-8 text-xl lg:text-3xl text-white outline-none focus:border-indigo-500/50 transition-all placeholder:opacity-20 font-light"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() && initializeApp(true, searchQuery.trim())}
              />
              <button 
                onClick={() => searchQuery.trim() && initializeApp(true, searchQuery.trim())}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 lg:h-20 lg:w-20 bg-indigo-500 hover:bg-indigo-400 rounded-xl flex items-center justify-center transition-all shadow-xl group-hover:scale-105"
              >
                <i className="fas fa-satellite-dish text-white text-xl lg:text-3xl"></i>
              </button>
            </div>
            <div className="flex gap-4">
               <button onClick={() => { setSearchQuery(''); initializeApp(true); }} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors">Reset to Local GPS</button>
            </div>
          </div>
        </div>
      )}

      {isForecastOpen && weather && (
        <ForecastOverlay 
          weather={weather} 
          onClose={() => setIsForecastOpen(false)} 
          isDiscreteMode={isFullscreen} 
        />
      )}

      {isNotebookOpen && (
        <NotebookGuide 
          weather={weather || { temperature: 0, conditionCode: 0, conditionText: 'Syncing...', isDay: true, locationName: 'Earth' }}
          onClose={() => setIsNotebookOpen(false)}
        />
      )}

      <main className="relative z-10 flex-1 flex flex-col justify-between p-6 lg:p-20 h-full">
        <div className={`w-full flex justify-between items-start shrink-0 transition-all duration-1000 ${isFullscreen ? 'opacity-0 -translate-y-20 pointer-events-none invisible' : 'opacity-100 translate-y-0 pointer-events-auto visible'}`}>
          <div className="transform hover:scale-105 transition-transform max-w-[70%]">
            {weather ? (
              <WeatherCard 
                weather={weather} 
                lastUpdated={lastUpdated}
                onRefresh={() => setIsSearchOpen(true)}
                onClick={() => setIsForecastOpen(true)}
                isRefreshing={loading}
                locationSource={locationSource === 'manual' ? 'gps' : locationSource}
                usingAISearch={usingAISearch}
              />
            ) : error ? (
              <div className="glass rounded-[2rem] p-6 lg:p-8 border-l-4 border-red-500/50 flex items-center gap-6 text-white shadow-2xl animate-reveal-hero">
                <i className="fas fa-triangle-exclamation text-4xl text-red-400"></i>
                <div className="flex-1">
                  <div className="text-xl font-bold uppercase tracking-widest opacity-60">Engine Error</div>
                  <div className="text-sm opacity-40 mb-3">{error}</div>
                  <button onClick={() => setIsSearchOpen(true)} className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">Manual Redirect</button>
                </div>
              </div>
            ) : (
              <div className="glass rounded-[2rem] p-6 lg:p-12 flex items-center gap-6 text-white animate-pulse">
                <i className="fas fa-compass-drafting animate-spin-slow text-4xl"></i>
                <span className="font-black uppercase tracking-widest opacity-50">Configuring Environment...</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:gap-6 items-center">
            <button onClick={() => setIsSearchOpen(true)} className="glass h-16 w-16 lg:h-28 lg:w-28 rounded-full flex items-center justify-center transition-all border-2 border-white/10 hover:border-white/40 shadow-xl group">
              <i className="fas fa-search-location text-2xl lg:text-5xl text-white group-hover:scale-110 transition-transform"></i>
            </button>
            <button onClick={() => setIsNotebookOpen(true)} className="glass h-16 w-16 lg:h-28 lg:w-28 rounded-full flex items-center justify-center transition-all border-2 border-white/10 hover:border-white/40 shadow-xl group">
              <i className="fas fa-book-open text-2xl lg:text-5xl text-white group-hover:scale-110 transition-transform"></i>
            </button>
            <button onClick={handleSpeakDate} className={`glass h-16 w-16 lg:h-28 lg:w-28 rounded-full flex items-center justify-center transition-all border-2 ${isSpeaking ? 'border-indigo-500 bg-indigo-500/30' : 'border-white/10 hover:border-white/40 shadow-xl'}`}>
              <i className={`fas ${isSpeaking ? 'fa-volume-high animate-pulse' : 'fa-volume-low'} text-2xl lg:text-5xl text-white`}></i>
            </button>
            <button onClick={toggleFullscreen} className={`glass h-16 w-16 lg:h-28 lg:w-28 rounded-full flex items-center justify-center transition-all border-2 shadow-xl ${isFullscreen ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/10 hover:border-white/40'}`}>
              <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-2xl lg:text-5xl text-white`}></i>
            </button>
          </div>
        </div>

        <div className={`absolute inset-0 transition-all duration-1000 ${isFullscreen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}>
          <div className={`absolute top-10 left-10 lg:top-20 lg:left-20 transition-all duration-1000 ${isFullscreen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            {weather ? (
              <button onClick={() => setIsForecastOpen(true)} className="group flex items-center gap-6 lg:gap-10 text-white drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)] outline-none hover:scale-110 transition-transform active:scale-95 text-left">
                <i className={`fas ${getIcon(weather.conditionCode)} text-[15vw] lg:text-[10vw] text-yellow-300 animate-float-subtle group-hover:drop-shadow-[0_0_30px_rgba(253,224,71,0.5)]`}></i>
                <div className="flex flex-col">
                  <span className="text-[12vw] lg:text-[8vw] font-black leading-none group-hover:text-yellow-100 transition-colors">{Math.round(weather.temperature)}°C</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl lg:text-3xl font-black uppercase tracking-[0.5em] opacity-40 group-hover:opacity-100 transition-opacity">{weather.conditionText}</span>
                    {usingAISearch && <span className="text-[10px] bg-indigo-500/50 px-2 py-0.5 rounded-full uppercase font-black tracking-widest text-white/80">AI Search</span>}
                  </div>
                </div>
              </button>
            ) : error && (
               <div className="text-white/20 flex items-center gap-4">
                 <i className="fas fa-cloud-slash text-6xl"></i>
                 <span className="text-xs uppercase font-black tracking-widest">Link Lost</span>
               </div>
            )}
          </div>

          <div className={`absolute top-10 right-10 lg:top-20 lg:right-20 transition-all duration-1000 flex flex-col gap-4 lg:gap-8 ${isFullscreen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            <button onClick={() => setIsSearchOpen(true)} className="h-16 w-16 lg:h-28 lg:w-28 glass rounded-full flex items-center justify-center transition-all border border-white/10 hover:bg-white/20 hover:scale-110 group shadow-2xl">
              <i className="fas fa-search-location text-2xl lg:text-5xl text-white opacity-40 group-hover:opacity-100"></i>
            </button>
            <button onClick={() => setIsNotebookOpen(true)} className="h-16 w-16 lg:h-28 lg:w-28 glass rounded-full flex items-center justify-center transition-all border border-white/10 hover:bg-white/20 hover:scale-110 group shadow-2xl">
              <i className="fas fa-book-open text-2xl lg:text-5xl text-white opacity-40 group-hover:opacity-100"></i>
            </button>
            <button onClick={handleSpeakDate} className={`h-16 w-16 lg:h-28 lg:w-28 glass rounded-full flex items-center justify-center transition-all border border-white/10 hover:bg-white/20 hover:scale-110 group shadow-2xl ${isSpeaking ? 'bg-indigo-500/20' : ''}`}>
              <i className={`fas ${isSpeaking ? 'fa-volume-high animate-pulse' : 'fa-volume-low'} text-2xl lg:text-5xl text-white opacity-40 group-hover:opacity-100`}></i>
            </button>
            <button onClick={toggleFullscreen} className="h-16 w-16 lg:h-28 lg:w-28 glass rounded-full flex items-center justify-center transition-all border border-white/10 hover:bg-white/20 hover:scale-110 group shadow-2xl">
              <i className="fas fa-compress text-2xl lg:text-5xl text-white opacity-40 group-hover:opacity-100"></i>
            </button>
          </div>
        </div>

        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ${isFullscreen ? 'scale-110' : 'scale-100'}`}>
          <div className="pointer-events-auto w-full">
            <Clock />
          </div>
        </div>

        <div className={`w-full flex flex-col items-center gap-6 lg:gap-8 pb-4 transition-all duration-1000 ${isFullscreen ? 'opacity-0 translate-y-20 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
           <div className="px-6 py-3 lg:px-10 lg:py-4 glass rounded-full flex items-center gap-4 lg:gap-6 shadow-2xl">
             <div className={`h-2 w-2 lg:h-3 lg:w-3 rounded-full animate-pulse shadow-lg ${weather ? (usingAISearch ? 'bg-indigo-500 shadow-indigo-500/50' : 'bg-green-500 shadow-green-500/50') : 'bg-red-500 shadow-red-500/50'}`}></div>
             <span className="text-[10px] lg:text-xs uppercase font-black tracking-[0.4em] lg:tracking-[0.6em] text-white opacity-60">
               {weather ? (locationSource === 'manual' ? `Custom Satellite: ${weather.locationName}` : (usingAISearch ? 'Atmospheric Hybrid Link Active' : 'Atmosphere Engine Active')) : 'Atmosphere Engine Offline'}
             </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
