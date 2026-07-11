"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  type TooltipContentProps,
} from "recharts";
import {
  useRevenue,
  useTraffic,
  useSocialMetrics,
  useKpis,
} from "@/hooks/use-apex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subMonths, startOfYear } from "date-fns";

function formatCurrency(value: number) {
  return `$${(value / 1000).toFixed(0)}k`;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (active && payload && payload.length) {
    const value = payload[0].value as number | undefined;
    return (
      <div className="rounded border border-[#222222] bg-[#0a0a0a] p-2 shadow">
        <p className="text-xs text-[#888888]">{label}</p>
        <p className="text-sm font-medium text-white">{value ?? 0}</p>
      </div>
    );
  }
  return null;
}

const PIE_COLORS = ["#ff1a1a", "#ffffff", "#888888", "#444444"];

function formatChange(value: number | null) {
  if (value == null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value}%`;
}

function KpiCards() {
  const { data, isLoading } = useKpis();

  const cards = [
    { label: "MRR", value: data ? formatCurrency(data.mrr) : "—" },
    { label: "Subscribers", value: data ? data.subscribers?.toLocaleString() ?? "—" : "—" },
    { label: "Open Rate", value: data ? `${data.openRate}%` : "—" },
    { label: "Sponsors", value: data ? data.totalSponsors.toString() : "—" },
  ];

  const changes = [
    data ? formatChange(data.mrrGrowth) : "—",
    data ? formatChange(data.subscriberGrowth) : "—",
    data ? formatChange(data.openRateGrowth) : "—",
    data ? formatChange(data.sponsorGrowth) : "—",
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card key={card.label} className="border-[#222222] bg-[#0a0a0a]">
          <CardContent className="p-4">
            <p className="text-xs text-[#888888]">{card.label}</p>
            <p className="mt-1 text-xl font-semibold text-white font-mono">
              {isLoading ? "—" : card.value}
            </p>
            <p className="text-xs text-[#ff1a1a]">{isLoading ? "—" : changes[idx]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type RangePreset = "all" | "12m" | "6m" | "ytd" | "yearly" | "custom";

function RevenueTab() {
  const [preset, setPreset] = useState<RangePreset>("all");
  const [granularity, setGranularity] = useState<"monthly" | "yearly">("monthly");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const now = new Date();
  const params: { from?: string; to?: string; granularity?: string } = { granularity };

  if (preset === "12m") {
    params.from = format(subMonths(now, 11), "yyyy-MM-dd");
  } else if (preset === "6m") {
    params.from = format(subMonths(now, 5), "yyyy-MM-dd");
  } else if (preset === "ytd") {
    params.from = format(startOfYear(now), "yyyy-MM-dd");
  } else if (preset === "yearly") {
    params.from = format(startOfYear(subMonths(now, 59)), "yyyy-MM-dd");
    params.granularity = "yearly";
  } else if (preset === "custom") {
    if (customFrom) params.from = customFrom;
    if (customTo) params.to = customTo;
  }

  const { data } = useRevenue(params);

  return (
    <div className="space-y-6">
      <KpiCards />
      <Card className="border-[#222222] bg-[#0a0a0a]">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-white text-base">Revenue by Source</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={preset} onValueChange={(v) => {
                const next = v as RangePreset;
                setPreset(next);
                if (next === "yearly") {
                  setGranularity("yearly");
                } else if (granularity === "yearly" && next !== "custom") {
                  setGranularity("monthly");
                }
              }}>
                <SelectTrigger className="h-8 w-36 bg-[#111111] border-[#222222] text-white text-xs">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
                  <SelectItem value="all" className="text-white">All</SelectItem>
                  <SelectItem value="12m" className="text-white">Last 12 months</SelectItem>
                  <SelectItem value="6m" className="text-white">Last 6 months</SelectItem>
                  <SelectItem value="ytd" className="text-white">Year to date</SelectItem>
                  <SelectItem value="yearly" className="text-white">Yearly</SelectItem>
                  <SelectItem value="custom" className="text-white">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Select value={granularity} onValueChange={(v) => setGranularity(v as "monthly" | "yearly")}>
                <SelectTrigger className="h-8 w-28 bg-[#111111] border-[#222222] text-white text-xs">
                  <SelectValue placeholder="Granularity" />
                </SelectTrigger>
                <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
                  <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                  <SelectItem value="yearly" className="text-white">Yearly</SelectItem>
                </SelectContent>
              </Select>
              {preset === "custom" && (
                <>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-8 w-36 bg-[#111111] border-[#222222] text-white text-xs"
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-8 w-36 bg-[#111111] border-[#222222] text-white text-xs"
                    placeholder="To"
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="subscriptions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff1a1a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ff1a1a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sponsors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#888888" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#888888" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" tick={{ fill: "#888888", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" tick={{ fill: "#888888", fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={ChartTooltip} />
                <Area type="monotone" dataKey="subscriptions" stackId="1" stroke="#ff1a1a" fill="url(#subscriptions)" />
                <Area type="monotone" dataKey="ads" stackId="1" stroke="#ffffff" fill="url(#ads)" />
                <Area type="monotone" dataKey="sponsors" stackId="1" stroke="#888888" fill="url(#sponsors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TrafficTab() {
  const { data } = useTraffic();

  return (
    <Card className="border-[#222222] bg-[#0a0a0a]">
      <CardHeader>
        <CardTitle className="text-white text-base">30-Day Traffic</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis dataKey="date" stroke="#888888" tick={{ fill: "#888888", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" tick={{ fill: "#888888", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={ChartTooltip} />
              <Bar dataKey="visitors" fill="#ff1a1a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pageViews" fill="#444444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialTab() {
  const { data } = useSocialMetrics();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-[#222222] bg-[#0a0a0a]">
        <CardHeader>
          <CardTitle className="text-white text-base">Audience by Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={ChartTooltip} />
                <Pie data={data} dataKey="followers" nameKey="platform" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={{ fill: "#ffffff", fontSize: 12 }}>
                  {data?.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#222222] bg-[#0a0a0a]">
        <CardHeader>
          <CardTitle className="text-white text-base">Platform Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.map((metric) => (
            <div key={metric.platform} className="flex items-center justify-between rounded border border-[#222222] bg-[#111111] p-3">
              <div>
                <p className="text-sm font-medium text-white">{metric.platform}</p>
                <p className="text-xs text-[#888888]">{metric.followers.toLocaleString()} followers</p>
              </div>
              <span className="text-xs font-medium text-[#ff1a1a]">+{metric.growth}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsDashboard() {
  return (
    <Tabs defaultValue="revenue" className="w-full">
      <TabsList className="bg-[#111111] border border-[#222222] text-[#888888]">
        <TabsTrigger value="revenue" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Revenue</TabsTrigger>
        <TabsTrigger value="traffic" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Traffic</TabsTrigger>
        <TabsTrigger value="social" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Social</TabsTrigger>
      </TabsList>
      <TabsContent value="revenue" className="mt-4">
        <RevenueTab />
      </TabsContent>
      <TabsContent value="traffic" className="mt-4">
        <TrafficTab />
      </TabsContent>
      <TabsContent value="social" className="mt-4">
        <SocialTab />
      </TabsContent>
    </Tabs>
  );
}
