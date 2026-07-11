"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipContentProps,
} from "recharts";
import { useRevenue } from "@/hooks/use-apex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths } from "date-fns";

function formatCurrency(value: number) {
  return `$${(value / 1000).toFixed(0)}k`;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (active && payload && payload.length) {
    const value = payload[0].value as number | undefined;
    return (
      <div className="rounded border border-[#222222] bg-[#0a0a0a] p-2 shadow">
        <p className="text-xs text-[#888888]">{label}</p>
        <p className="text-sm font-medium text-white">
          {formatCurrency(value ?? 0)}
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart() {
  const from = format(subMonths(new Date(), 11), "yyyy-MM-dd");
  const { data, isLoading } = useRevenue({ from });

  if (isLoading) {
    return (
      <Card className="border-[#222222] bg-[#0a0a0a]">
        <CardHeader>
          <CardTitle className="text-white text-base">Revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-64 animate-pulse rounded bg-[#111111]" />
      </Card>
    );
  }

  return (
    <Card className="border-[#222222] bg-[#0a0a0a]">
      <CardHeader>
        <CardTitle className="text-white text-base">Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff1a1a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ff1a1a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#888888"
                tick={{ fill: "#888888", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                tick={{ fill: "#888888", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={ChartTooltip} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ff1a1a"
                strokeWidth={2}
                fill="url(#revenueRed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
