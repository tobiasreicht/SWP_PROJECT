import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card } from '../ui';

interface RatingChartProps {
  data: { month: string; averageRating: number }[];
}

export const RatingChart: React.FC<RatingChartProps> = ({ data }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-white mb-4">Rating Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis stroke="#666" />
          <YAxis stroke="#666" domain={[0, 10]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="averageRating"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

interface GenreChartProps {
  data: { name: string; value: number }[];
}

export const GenreChart: React.FC<GenreChartProps> = ({ data }) => {
  const COLORS = ['#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-white mb-4">Genre Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#ef4444"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            labelStyle={{ color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

interface ActivityChartProps {
  data: { month: string; count: number }[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-white mb-4">Monthly Activity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
