import React from 'react';
import { MapPin, Bell, LayoutDashboard } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  currentTab: AppTab;
  setTab: (tab: AppTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab }) => {
  const getButtonClass = (tab: AppTab) => {
    const isActive = currentTab === tab;
    return `flex flex-col items-center justify-center w-full h-full transition-colors ${
      isActive ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-slate-900 border-t border-slate-800 flex justify-around items-center z-50 pb-safe">
      <button 
        className={getButtonClass(AppTab.DASHBOARD)} 
        onClick={() => setTab(AppTab.DASHBOARD)}
      >
        <LayoutDashboard size={24} />
        <span className="text-[10px] mt-1 font-medium">Dashboard</span>
      </button>

      <button 
        className={getButtonClass(AppTab.LOCATIONS)} 
        onClick={() => setTab(AppTab.LOCATIONS)}
      >
        <MapPin size={24} />
        <span className="text-[10px] mt-1 font-medium">Locations</span>
      </button>

      <button 
        className={getButtonClass(AppTab.ALERTS)} 
        onClick={() => setTab(AppTab.ALERTS)}
      >
        <Bell size={24} />
        <span className="text-[10px] mt-1 font-medium">Alerts</span>
      </button>
    </div>
  );
};

export default Navigation;
