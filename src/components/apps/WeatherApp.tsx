import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Cloud,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSun,
  Wind,
  Droplets,
  Compass,
  MapPin,
  Sparkles,
  RefreshCw,
  Search,
  Thermometer,
  Gauge,
  Sunrise,
  Sunset,
  Eye,
  Plus,
  Trash2,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GeoLocationResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface DailyForecast {
  date: string;
  dayName: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  uvIndex: number;
}

interface HourlyForecast {
  time: string;
  hour: string;
  temp: number;
  weatherCode: number;
  isDay: boolean;
}

interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex: number;
  precipitation: number;
  cloudCover: number;
  sunrise: string;
  sunset: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  lastUpdated: string;
}

const PRESET_CITIES: GeoLocationResult[] = [
  { id: 2950159, name: 'Berlin', country: 'Deutschland', latitude: 52.52, longitude: 13.41 },
  { id: 2867714, name: 'München', country: 'Deutschland', latitude: 48.14, longitude: 11.58 },
  { id: 2761369, name: 'Wien', country: 'Österreich', latitude: 48.21, longitude: 16.37 },
  { id: 2657896, name: 'Zürich', country: 'Schweiz', latitude: 47.37, longitude: 8.54 },
  { id: 2988507, name: 'Paris', country: 'Frankreich', latitude: 48.85, longitude: 2.35 },
  { id: 2643743, name: 'London', country: 'Vereinigtes Königreich', latitude: 51.51, longitude: -0.13 },
  { id: 1850147, name: 'Tokio', country: 'Japan', latitude: 35.68, longitude: 139.76 },
  { id: 5128581, name: 'New York', country: 'USA', latitude: 40.71, longitude: -74.01 },
];

// WMO Weather code interpreter (WMO 4677 standard)
function interpretWmoCode(code: number, isDay = true): { description: string; type: string } {
  switch (code) {
    case 0:
      return { description: isDay ? 'Klarer Himmel' : 'Klare Nacht', type: isDay ? 'sun' : 'moon' };
    case 1:
      return { description: isDay ? 'Überwiegend heiter' : 'Leicht bewölkt', type: isDay ? 'cloud-sun' : 'moon' };
    case 2:
      return { description: 'Teilweise bewölkt', type: 'cloud-sun' };
    case 3:
      return { description: 'Bedeckt', type: 'cloud' };
    case 45:
    case 48:
      return { description: 'Nebel / Raureif', type: 'fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Leichter Nieselregen', type: 'drizzle' };
    case 56:
    case 57:
      return { description: 'Gefrierender Nieselregen', type: 'drizzle' };
    case 61:
      return { description: 'Leichter Regen', type: 'rain' };
    case 63:
      return { description: 'Mäßiger Regen', type: 'rain' };
    case 65:
      return { description: 'Starker Regen', type: 'rain' };
    case 66:
    case 67:
      return { description: 'Gefrierender Regen', type: 'rain' };
    case 71:
      return { description: 'Leichter Schneefall', type: 'snow' };
    case 73:
      return { description: 'Mäßiger Schneefall', type: 'snow' };
    case 75:
      return { description: 'Starker Schneefall', type: 'snow' };
    case 77:
      return { description: 'Schneegriesel', type: 'snow' };
    case 80:
    case 81:
    case 82:
      return { description: 'Regenschauer', type: 'rain' };
    case 85:
    case 86:
      return { description: 'Schneeschauer', type: 'snow' };
    case 95:
      return { description: 'Gewitter', type: 'thunder' };
    case 96:
    case 99:
      return { description: 'Gewitter mit Hagel', type: 'thunder' };
    default:
      return { description: 'Heiter', type: 'sun' };
  }
}

export const WeatherApp: React.FC = () => {
  const { sounds, accentConfig, addNotification, isLight, effectiveGlassContrast } = useOS();
  const isLightMode = isLight || effectiveGlassContrast === 'dark';

  const [currentCity, setCurrentCity] = useState<GeoLocationResult>(() => {
    try {
      const saved = localStorage.getItem('obsidian_weather_city');
      return saved ? JSON.parse(saved) : PRESET_CITIES[0];
    } catch {
      return PRESET_CITIES[0];
    }
  });

  const [savedCities, setSavedCities] = useState<GeoLocationResult[]>(() => {
    try {
      const saved = localStorage.getItem('obsidian_weather_favorites');
      return saved ? JSON.parse(saved) : PRESET_CITIES.slice(0, 5);
    } catch {
      return PRESET_CITIES.slice(0, 5);
    }
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Geocoding states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Save favorites to storage
  useEffect(() => {
    try {
      localStorage.setItem('obsidian_weather_favorites', JSON.stringify(savedCities));
    } catch {}
  }, [savedCities]);

  // Fetch live weather data from Open-Meteo Free API
  const fetchWeather = useCallback(async (location: GeoLocationResult) => {
    setIsLoading(true);
    setError(null);
    try {
      const { latitude, longitude, name, country } = location;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Wetterdaten konnten nicht abgerufen werden');
      }

      const data = await response.json();
      const current = data.current;
      const daily = data.daily;
      const hourly = data.hourly;

      // Extract hourly (next 24 hours from current time)
      const currentHourIndex = new Date().getHours();
      const nextHourly: HourlyForecast[] = [];
      if (hourly && hourly.time) {
        for (let i = currentHourIndex; i < currentHourIndex + 24 && i < hourly.time.length; i++) {
          const timeStr = hourly.time[i];
          const hour = new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          nextHourly.push({
            time: timeStr,
            hour,
            temp: Math.round(hourly.temperature_2m[i]),
            weatherCode: hourly.weather_code[i],
            isDay: Boolean(hourly.is_day[i]),
          });
        }
      }

      // Extract daily forecast (7 days)
      const nextDaily: DailyForecast[] = [];
      if (daily && daily.time) {
        const daysDe = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        for (let i = 0; i < daily.time.length; i++) {
          const d = new Date(daily.time[i]);
          const dayName = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : daysDe[d.getDay()];
          nextDaily.push({
            date: daily.time[i],
            dayName,
            weatherCode: daily.weather_code[i],
            tempMax: Math.round(daily.temperature_2m_max[i]),
            tempMin: Math.round(daily.temperature_2m_min[i]),
            precipitation: daily.precipitation_sum[i] || 0,
            uvIndex: Math.round(daily.uv_index_max[i] || 0),
          });
        }
      }

      const formattedSunrise = daily.sunrise?.[0]
        ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';
      const formattedSunset = daily.sunset?.[0]
        ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '--:--';

      setWeather({
        city: name,
        country: country || location.admin1 || '',
        temp: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        windDirection: current.wind_direction_10m,
        pressure: Math.round(current.surface_pressure),
        weatherCode: current.weather_code,
        isDay: Boolean(current.is_day),
        uvIndex: daily.uv_index_max?.[0] ? Math.round(daily.uv_index_max[0]) : 3,
        precipitation: current.precipitation || 0,
        cloudCover: current.cloud_cover || 0,
        sunrise: formattedSunrise,
        sunset: formattedSunset,
        hourly: nextHourly,
        daily: nextDaily,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      localStorage.setItem('obsidian_weather_city', JSON.stringify(location));
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError(err.message || 'Verbindung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(currentCity);
  }, [currentCity, fetchWeather]);

  // Live Geocoding Search via Open-Meteo
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            searchQuery
          )}&count=6&language=de&format=json`
        );
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results);
          setShowSearchDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city: GeoLocationResult) => {
    sounds.playClick();
    setCurrentCity(city);
    setSearchQuery('');
    setShowSearchDropdown(false);

    // Add to saved cities if not present
    if (!savedCities.some((c) => c.name.toLowerCase() === city.name.toLowerCase())) {
      setSavedCities((prev) => [city, ...prev.slice(0, 7)]);
    }
  };

  const handleRemoveCity = (e: React.MouseEvent, cityId: number) => {
    e.stopPropagation();
    if (savedCities.length <= 1) return;
    setSavedCities((prev) => prev.filter((c) => c.id !== cityId));
    sounds.playClick();
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      addNotification('GPS nicht verfügbar', 'Geolocation wird nicht unterstützt.', 'error', 'Wetter');
      return;
    }
    sounds.playClick();
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocoding or fallback name
          const geoLoc: GeoLocationResult = {
            id: Date.now(),
            name: 'Aktueller Standort',
            country: 'GPS Koordinaten',
            latitude,
            longitude,
          };
          setCurrentCity(geoLoc);
          addNotification('Standort ermittelt', 'Wetter für deinen Standort geladen.', 'success', 'Wetter');
        } catch {
          fetchWeather({
            id: Date.now(),
            name: 'Mein Standort',
            country: '',
            latitude,
            longitude,
          });
        }
      },
      () => {
        setIsLoading(false);
        addNotification('Standortfehler', 'Standort konnte nicht abgerufen werden.', 'info', 'Wetter');
      }
    );
  };

  const renderWeatherIcon = (type: string, className = 'w-6 h-6') => {
    switch (type) {
      case 'sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'moon':
        return <Moon className={`${className} text-indigo-300`} />;
      case 'cloud-sun':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'cloud':
        return <Cloud className={`${className} text-zinc-300`} />;
      case 'rain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'drizzle':
        return <CloudDrizzle className={`${className} text-cyan-300`} />;
      case 'snow':
        return <CloudSnow className={`${className} text-indigo-200`} />;
      case 'thunder':
        return <CloudLightning className={`${className} text-yellow-400`} />;
      case 'fog':
        return <CloudFog className={`${className} text-zinc-400`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  const conditionInfo = weather ? interpretWmoCode(weather.weatherCode, weather.isDay) : null;

  return (
    <div
      id="weather-app-root"
      className={`flex flex-col h-full w-full select-none overflow-y-auto font-sans transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#09090e] text-[#f4f4f5]'
      }`}
    >
      {/* Top Search & Controls Bar */}
      <div
        className={`p-4 border-b shrink-0 transition-colors ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#101018] border-[#27272a]/60'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Live Search Input with Open-Meteo Geocoding */}
          <div ref={searchContainerRef} className="relative flex-1 min-w-[220px] max-w-md">
            <div className="relative flex items-center">
              <Search className={`w-4 h-4 absolute left-3 pointer-events-none ${isLightMode ? 'text-slate-400' : 'text-zinc-400'}`} />
              <input
                type="text"
                placeholder="Weltweite Stadt suchen (z.B. Hamburg, Rom)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchDropdown(true);
                }}
                className={`w-full text-xs pl-9 pr-8 py-2 rounded-xl border outline-none transition-colors ${
                  isLightMode
                    ? 'bg-slate-100 text-slate-900 placeholder-slate-400 border-slate-300 focus:border-purple-500'
                    : 'bg-[#181824] text-white placeholder-zinc-500 border-white/10 focus:border-purple-500/60'
                }`}
              />
              {isSearching && (
                <div className="absolute right-3">
                  <RefreshCw className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            <AnimatePresence>
              {showSearchDropdown && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`absolute top-full mt-1.5 left-0 right-0 z-50 border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl ${
                    isLightMode ? 'bg-white/95 border-slate-200' : 'bg-[#161622] border-white/15'
                  }`}
                >
                  <div className="p-1.5 space-y-1">
                    {searchResults.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => handleSelectCity(res)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          isLightMode ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-white/10 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="font-semibold">{res.name}</span>
                          <span className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                            {res.admin1 ? `${res.admin1}, ` : ''}{res.country}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                          {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUseGeolocation}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border-white/5'
              }`}
              title="Aktueller Standort via GPS"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">GPS</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                fetchWeather(currentCity);
              }}
              disabled={isLoading}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-medium ${
                isLightMode
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border-white/5'
              }`}
              title="Wetterdaten neu laden"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-500' : ''}`} />
              <span className="hidden sm:inline">Aktualisieren</span>
            </button>
          </div>
        </div>

        {/* Saved Cities Quick Badges */}
        <motion.div layout className="flex items-center gap-2 overflow-x-auto pt-3 no-scrollbar text-xs">
          {savedCities.map((c) => {
            const isSelected = c.name === currentCity.name;
            return (
              <motion.button
                layout
                key={c.name + c.latitude}
                onClick={() => {
                  sounds.playClick();
                  setCurrentCity(c);
                }}
                className={`group px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 shrink-0 transition-all border ${
                  isSelected
                    ? isLightMode
                      ? 'bg-purple-100 border-purple-400 text-purple-900 shadow-xs'
                      : 'bg-purple-500/20 border-purple-500/50 text-white shadow-sm'
                    : isLightMode
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    : 'bg-[#151520] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <span>{c.name}</span>
                {savedCities.length > 1 && (
                  <span
                    onClick={(e) => handleRemoveCity(e, c.id)}
                    className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    title="Entfernen"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Main Weather Content */}
      <motion.div layout className="flex-1 p-5 space-y-6 max-w-5xl mx-auto w-full">
        {error ? (
          <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <div className="text-sm font-semibold text-red-600 dark:text-red-200">{error}</div>
            <button
              onClick={() => fetchWeather(currentCity)}
              className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-900 dark:text-white text-xs font-semibold"
            >
              Erneut versuchen
            </button>
          </div>
        ) : weather ? (
          <>
            {/* Primary Hero Weather Card */}
            <motion.div
              layout
              layoutId="hero-weather-card"
              className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl transition-colors ${
                isLightMode
                  ? 'bg-gradient-to-br from-white via-slate-50 to-purple-50/30 border-slate-200 shadow-slate-200/50'
                  : 'bg-gradient-to-br from-[#161626] to-[#0f0f18] border-white/10 shadow-2xl'
              }`}
            >
              {/* Subtle background ambient glow */}
              <div
                className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: accentConfig.primary }}
              />

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                    <MapPin className="w-3.5 h-3.5 text-purple-500" />
                    <span className={isLightMode ? 'text-slate-800' : 'text-zinc-300'}>{weather.city}</span>
                    <span>•</span>
                    <span className={isLightMode ? 'text-slate-400' : 'text-zinc-500'}>{weather.country}</span>
                  </div>

                  <div className="flex items-baseline gap-4 mt-2">
                    <span className={`text-5xl sm:text-7xl font-extrabold tracking-tight font-sans ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {weather.temp}°
                    </span>
                    <div className="space-y-1">
                      <div className={`text-sm font-medium ${isLightMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                        Gefühlt wie {weather.feelsLike}°
                      </div>
                      <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                        Max {weather.daily[0]?.tempMax ?? weather.temp}° / Min{' '}
                        {weather.daily[0]?.tempMin ?? weather.temp}°
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {conditionInfo && renderWeatherIcon(conditionInfo.type, 'w-6 h-6')}
                    <span className={`text-base font-semibold ${isLightMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                      {conditionInfo?.description}
                    </span>
                  </div>
                </div>

                {/* API Status Badge & Last Updated */}
                <div className="sm:text-right space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Open-Meteo API</span>
                  </div>
                  <div className={`text-[11px] ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                    Stand: {weather.lastUpdated} Uhr
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 24-Hour Hourly Forecast Carousel */}
            <div className="space-y-3">
              <div className={`flex items-center justify-between text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-zinc-300'}`}>
                <span>Stündliche Vorhersage (24h)</span>
                <span className={`text-[11px] ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>Echtzeit-Meteo</span>
              </div>

              <motion.div layout className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {weather.hourly.map((hour, idx) => {
                  const hourCond = interpretWmoCode(hour.weatherCode, hour.isDay);
                  return (
                    <motion.div
                      layout
                      key={hour.time + idx}
                      className={`flex flex-col items-center justify-between p-3 min-w-[72px] rounded-2xl border transition-all shrink-0 space-y-2 ${
                        isLightMode
                          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          : 'bg-[#13131c] border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`text-[11px] font-medium ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                        {idx === 0 ? 'Jetzt' : hour.hour}
                      </span>
                      {renderWeatherIcon(hourCond.type, 'w-5 h-5')}
                      <span className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{hour.temp}°</span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Key Atmospheric Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-4 rounded-2xl border space-y-1 ${
                isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>Luftfeuchtigkeit</span>
                </div>
                <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.humidity}%</div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Taupunkt bei {Math.round(weather.temp - (100 - weather.humidity) / 5)}°C
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${
                isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  <Wind className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Windstärke</span>
                </div>
                <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.windSpeed} km/h</div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>Richtung {weather.windDirection}°</div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${
                isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>UV-Index</span>
                </div>
                <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.uvIndex} / 10</div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                  {weather.uvIndex > 5 ? 'Starke Strahlung' : 'Geringes Risiko'}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 ${
                isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
              }`}>
                <div className={`flex items-center gap-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  <Gauge className="w-3.5 h-3.5 text-purple-500" />
                  <span>Luftdruck</span>
                </div>
                <div className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.pressure} hPa</div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>Normaldruck</div>
              </div>
            </div>

            {/* 7-Day Forecast & Sun Times Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 7-Day Forecast List */}
              <div className={`md:col-span-2 p-5 rounded-3xl border space-y-3 ${
                isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
              }`}>
                <span className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-zinc-300'}`}>7-Tage Wetterausblick</span>

                <div className="space-y-2.5 pt-1">
                  {weather.daily.map((day) => {
                    const dayCond = interpretWmoCode(day.weatherCode, true);
                    return (
                      <div
                        key={day.date}
                        className={`flex items-center justify-between p-2 rounded-xl transition-colors text-xs ${
                          isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className={`w-16 font-semibold ${isLightMode ? 'text-slate-800' : 'text-zinc-200'}`}>{day.dayName}</span>

                        <div className="flex items-center gap-2 w-36">
                          {renderWeatherIcon(dayCond.type, 'w-4 h-4')}
                          <span className={`truncate text-[11px] ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>{dayCond.description}</span>
                        </div>

                        <div className="flex items-center gap-3 flex-1 justify-end">
                          <span className={`w-8 text-right ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>{day.tempMin}°</span>
                          {/* Mini temperature bar */}
                          <div className={`w-20 sm:w-28 h-1.5 rounded-full overflow-hidden relative ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-400"
                              style={{ width: `${Math.min(100, Math.max(20, (day.tempMax - day.tempMin) * 8))}%` }}
                            />
                          </div>
                          <span className={`font-bold w-8 text-right ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{day.tempMax}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sun Position & Precipitation Stats */}
              <div className="flex flex-col gap-4">
                {/* Sunrise & Sunset */}
                <div className={`p-5 rounded-3xl border space-y-4 flex-1 ${
                  isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
                }`}>
                  <span className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-zinc-300'}`}>Sonne & Tageslicht</span>

                  <div className="space-y-3 pt-1">
                    <div className={`flex items-center justify-between p-2.5 rounded-2xl ${isLightMode ? 'bg-slate-50' : 'bg-white/5'}`}>
                      <div className="flex items-center gap-2">
                        <Sunrise className="w-4 h-4 text-amber-500" />
                        <span className={`text-xs ${isLightMode ? 'text-slate-700' : 'text-zinc-300'}`}>Sonnenaufgang</span>
                      </div>
                      <span className={`text-xs font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.sunrise}</span>
                    </div>

                    <div className={`flex items-center justify-between p-2.5 rounded-2xl ${isLightMode ? 'bg-slate-50' : 'bg-white/5'}`}>
                      <div className="flex items-center gap-2">
                        <Sunset className="w-4 h-4 text-orange-500" />
                        <span className={`text-xs ${isLightMode ? 'text-slate-700' : 'text-zinc-300'}`}>Sonnenuntergang</span>
                      </div>
                      <span className={`text-xs font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.sunset}</span>
                    </div>
                  </div>
                </div>

                {/* Cloud & Precipitation */}
                <div className={`p-5 rounded-3xl border space-y-2 ${
                  isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121a] border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLightMode ? 'text-slate-600' : 'text-zinc-400'}>Bewölkung</span>
                    <span className={`font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{weather.cloudCover}%</span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${weather.cloudCover}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex flex-col items-center justify-center py-20 space-y-3 ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-sm">Lade Echtzeit-Wetterdaten...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
