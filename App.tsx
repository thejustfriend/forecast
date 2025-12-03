import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudRain, 
  MapPin, 
  Plus, 
  Trash2, 
  Wind, 
  Thermometer, 
  Umbrella, 
  Navigation as NavIcon,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy
} from 'firebase/firestore';

import Navigation from './components/Navigation';
import RainChart from './components/RainChart';
import { fetchWeatherData, getWeatherDescription } from './services/weatherService';
import { generateWeatherInsight } from './services/geminiService';
import { db } from './services/firebase';
import { AppTab, SavedLocation, WeatherData, Alert } from './types';

// Default fallback location if DB is empty
const DEFAULT_LOCATION: SavedLocation = { 
  id: 'default', 
  name: 'Bangkok (Default)', 
  coords: { lat: 13.7563, lng: 100.5018 }, 
  type: 'other' 
};

function App() {
  // State
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [currentLocation, setCurrentLocation] = useState<SavedLocation>(DEFAULT_LOCATION);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // --- Firebase Subscriptions ---

  // 1. Sync Locations
  useEffect(() => {
    const q = query(collection(db, "locations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLocations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedLocation[];
      
      setLocations(fetchedLocations);

      // If we are currently using a saved location that was just deleted, revert to default
      // Or if we are on the default and data comes in, maybe switch? (Optional logic)
      if (fetchedLocations.length > 0 && currentLocation.id === 'default') {
        setCurrentLocation(fetchedLocations[0]);
      }
    });
    return () => unsubscribe();
  }, [currentLocation.id]);

  // 2. Sync Alerts
  useEffect(() => {
    // Assuming 'timestamp' field exists and sort by descending
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Handle Firestore Timestamp or string
        let timeString = '';
        if (data.timestamp?.toDate) {
          timeString = data.timestamp.toDate().toLocaleString();
        } else if (typeof data.timestamp === 'string') {
          timeString = data.timestamp;
        }

        return {
          id: doc.id,
          ...data,
          timestamp: timeString
        };
      }) as Alert[];
      setAlerts(fetchedAlerts);
    });
    return () => unsubscribe();
  }, []);

  // --- Geolocation ---
  const handleUseCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc: SavedLocation = {
            id: 'current',
            name: 'Current Location',
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            type: 'other'
          };
          setCurrentLocation(newLoc);
          setActiveTab(AppTab.DASHBOARD);
        },
        (error) => {
          console.error("Geo Error", error);
          alert("Could not get location.");
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // --- Weather Fetching ---
  const loadWeather = useCallback(async () => {
    if (!currentLocation) return;
    setLoading(true);
    setAiInsight(''); 
    try {
      const data = await fetchWeatherData(currentLocation.coords);
      setWeather(data);
      
      // Trigger AI Insight
      setInsightLoading(true);
      generateWeatherInsight(data, currentLocation.name)
        .then(setAiInsight)
        .catch(() => setAiInsight("AI unavailable"))
        .finally(() => setInsightLoading(false));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  // --- Action Handlers ---

  const handleDeleteLocation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    if (!window.confirm("Delete this location?")) return;
    
    try {
      await deleteDoc(doc(db, "locations", id));
      if (currentLocation.id === id) {
        setCurrentLocation(locations.find(l => l.id !== id) || DEFAULT_LOCATION);
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location.");
    }
  };

  const handleAddLocation = async () => {
    const name = prompt("Enter location name (e.g., Gym)");
    if (!name) return;

    // For simplicity, we randomize coordinates near Bangkok.
    // In a real app, integrate a Map picker or Google Places Autocomplete.
    const randomCoords = {
      lat: 13.7 + Math.random() * 0.1, 
      lng: 100.5 + Math.random() * 0.1 
    };

    try {
      await addDoc(collection(db, "locations"), {
        name,
        coords: randomCoords,
        type: 'other'
      });
      // No need to setLocations manually, onSnapshot will update it.
    } catch (error) {
      console.error("Error adding location:", error);
      alert("Failed to save location.");
    }
  };

  // --- Render Views ---

  const renderDashboard = () => (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-sky-600 to-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 text-sky-100/80 mb-1 cursor-pointer hover:text-white transition-colors" onClick={() => setActiveTab(AppTab.LOCATIONS)}>
               <MapPin size={16} />
               <span className="text-sm font-medium">{currentLocation.name}</span>
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tighter">
              {weather ? Math.round(weather.current.temperature) : '--'}°
            </h1>
            <p className="text-sky-100 font-medium text-lg mt-1">
              {weather ? getWeatherDescription(weather.current.weatherCode) : 'Loading...'}
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            {weather && weather.current.weatherCode > 50 ? (
               <CloudRain size={32} className="text-sky-200" />
            ) : (
               <Wind size={32} className="text-yellow-200" />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
          <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-sky-200/70 mb-1">
              <Umbrella size={14} />
              <span className="text-xs">Precip</span>
            </div>
            <span className="text-white font-semibold">
              {weather ? Math.max(...weather.hourly.precipitationProbability.slice(0, 3)) : 0}%
            </span>
          </div>
          <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-sky-200/70 mb-1">
              <Wind size={14} />
              <span className="text-xs">Wind</span>
            </div>
            <span className="text-white font-semibold">
              {weather ? weather.current.windSpeed : 0} <span className="text-xs font-normal">km/h</span>
            </span>
          </div>
          <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1 text-sky-200/70 mb-1">
              <Thermometer size={14} />
              <span className="text-xs">Feel</span>
            </div>
            <span className="text-white font-semibold">
               {weather ? Math.round(weather.current.temperature) : '--'}°
            </span>
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={48} />
        </div>
        <div className="flex items-center gap-2 mb-3 text-sky-400">
           <Sparkles size={18} />
           <h3 className="text-sm font-bold uppercase tracking-wider">Gemini Insight</h3>
        </div>
        
        {insightLoading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
            Analyzing satellite data...
          </div>
        ) : (
          <p className="text-slate-200 text-sm leading-relaxed italic">
            "{aiInsight || "No insights available."}"
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm">
        {weather && <RainChart data={weather.hourly} />}
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-4 pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">My Locations</h2>
        <button 
          onClick={handleAddLocation}
          className="bg-sky-500 hover:bg-sky-400 text-white p-2 rounded-full transition-colors shadow-lg shadow-sky-500/20"
        >
          <Plus size={24} />
        </button>
      </div>

      <button 
        onClick={handleUseCurrentLocation}
        className="w-full flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 text-left hover:bg-slate-750 transition-colors group"
      >
        <div className="bg-sky-500/10 p-3 rounded-full text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
          <NavIcon size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-white">Use Current Location</h3>
          <p className="text-slate-400 text-xs mt-1">Update Dashboard based on GPS</p>
        </div>
      </button>

      <div className="h-px bg-slate-800 my-4" />

      {locations.length === 0 ? (
        <p className="text-slate-500 text-center italic mt-10">No saved locations yet.</p>
      ) : (
        locations.map((loc) => (
          <div 
            key={loc.id} 
            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
              currentLocation.id === loc.id 
                ? 'bg-slate-800 border-sky-500/50 ring-1 ring-sky-500/20' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
            onClick={() => {
              setCurrentLocation(loc);
              setActiveTab(AppTab.DASHBOARD);
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium uppercase ${
                  loc.type === 'home' ? 'bg-purple-500/20 text-purple-300' :
                  loc.type === 'work' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {loc.type || 'other'}
                </span>
              </div>
              <h3 className="font-semibold text-white mt-1">{loc.name}</h3>
              <p className="text-slate-500 text-xs font-mono mt-0.5">
                {loc.coords.lat.toFixed(4)}, {loc.coords.lng.toFixed(4)}
              </p>
            </div>
            
            <button 
              onClick={(e) => handleDeleteLocation(loc.id, e)}
              className="p-3 text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4 pb-24 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Recent Alerts</h2>
        <button className="text-slate-400 hover:text-white transition-colors" title="Real-time updates active">
          <RefreshCw size={20} className={alerts.length > 0 ? "text-sky-400" : ""} />
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center mt-10 p-8 border border-dashed border-slate-700 rounded-xl">
           <p className="text-slate-500">No active alerts.</p>
        </div>
      ) : (
        alerts.map((alert) => (
          <div key={alert.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              alert.severity === 'critical' ? 'bg-red-500' : 
              alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-sky-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-2 pl-3">
               <div className="flex items-center gap-2">
                  {alert.severity === 'critical' && <AlertTriangle size={16} className="text-red-400" />}
                  <h3 className="font-semibold text-slate-200">{alert.title}</h3>
               </div>
               <span className="text-xs text-slate-500">{alert.timestamp}</span>
            </div>
            <p className="text-slate-400 text-sm pl-3 leading-relaxed">
              {alert.message}
            </p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-sky-500/30">
      
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-2 text-sky-400">
            <CloudRain size={24} />
            <span className="font-bold text-lg tracking-tight text-white">Rain<span className="text-sky-400">Alert</span></span>
         </div>
         <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
            {/* Status indicator: Green if DB/Alerts connected (mocked by array length logic or just static) */}
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
         </div>
      </div>

      <main className="p-6 max-w-lg mx-auto">
        {activeTab === AppTab.DASHBOARD && renderDashboard()}
        {activeTab === AppTab.LOCATIONS && renderLocations()}
        {activeTab === AppTab.ALERTS && renderAlerts()}
      </main>

      <Navigation currentTab={activeTab} setTab={setActiveTab} />
    </div>
  );
}

export default App;