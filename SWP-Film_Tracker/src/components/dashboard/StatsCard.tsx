import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../ui';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  color?: 'red' | 'blue' | 'green' | 'purple';
}

const colorStyles = {
  red: 'from-red-600/20 to-red-600/10',
  blue: 'from-blue-600/20 to-blue-600/10',
  green: 'from-green-600/20 to-green-600/10',
  purple: 'from-purple-600/20 to-purple-600/10',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  color = 'red',
}) => {
  return (
    <Card className={`p-6 bg-gradient-to-br ${colorStyles[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-white/10">
          <Icon className="text-red-600" size={24} />
        </div>
        {trend && (
          <span className={`text-sm font-semibold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </Card>
  );
};
