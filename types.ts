export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  coords: Coordinates;
  type: 'home' | 'work' | 'other';
}

export interface WeatherData {
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    isDay: boolean;
  };
  hourly: {
    time: string[];
    precipitationProbability: number[];
  };
  locationName?: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  LOCATIONS = 'LOCATIONS',
  ALERTS = 'ALERTS',
}
