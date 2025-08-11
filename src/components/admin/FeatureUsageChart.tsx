import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';

interface FeatureUsageChartProps {
  data: { name: string; free: number; premium: number }[];
  isLoading: boolean;
}

export const FeatureUsageChart: React.FC<FeatureUsageChartProps> = ({ data, isLoading }) => (
  <Card>
    <CardHeader>
      <CardTitle>Feature Usage</CardTitle>
      <CardDescription>Breakdown of free vs. premium feature uses.</CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="w-full h-[350px]" />
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip wrapperClassName="!bg-background !border-border" cursor={{ fill: 'hsl(var(--accent))' }} />
            <Legend />
            <Bar dataKey="free" fill="hsl(var(--primary))" name="Free Tier" radius={[4, 4, 0, 0]} />
            <Bar dataKey="premium" fill="hsl(var(--secondary-foreground))" name="Premium (Credits)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
);