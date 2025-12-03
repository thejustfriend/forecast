import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { WeatherData } from '../types';

interface RainChartProps {
  data: WeatherData['hourly'];
}

const RainChart: React.FC<RainChartProps> = ({ data }) => {
  const chartData = data.time.map((time, index) => ({
    time: new Date(time).getHours() + ':00',
    prob: data.precipitationProbability[index],
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg text-xs">
          <p className="font-bold text-slate-200">{label}</p>
          <p className="text-sky-400">Rain Chance: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-48 w-full mt-4">
      <h3 className="text-sm font-semibold text-slate-400 mb-2 px-2">24h Rain Probability</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 5,
            right: 0,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            interval={3}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#94a3b8', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#38bdf8', strokeWidth: 1 }} />
          <Area 
            type="monotone" 
            dataKey="prob" 
            stroke="#38bdf8" 
            fillOpacity={1} 
            fill="url(#colorProb)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RainChart;
