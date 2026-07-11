import {
  differenceInCalendarMonths,
  endOfMonth,
  endOfYear,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import type { KpiStats, NewsletterItem, RevenuePoint, Sponsor } from "@/types";

export interface RevenueTimeSeriesOptions {
  from?: Date;
  to?: Date;
  granularity?: "monthly" | "yearly";
}

function getSponsorMonthlyShare(sponsor: Sponsor): number {
  const dealValue = sponsor.dealValue || 0;
  if (!sponsor.startDate) return dealValue;
  if (!sponsor.endDate) return dealValue;

  const start = parseISO(sponsor.startDate);
  const end = parseISO(sponsor.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return dealValue;
  }

  const months = differenceInCalendarMonths(end, start) + 1;
  if (months <= 0) return dealValue;
  return Math.round(dealValue / months);
}

function isSponsorActiveInMonth(sponsor: Sponsor, month: Date): boolean {
  if (!sponsor.startDate) return false;
  const start = parseISO(sponsor.startDate);
  if (isNaN(start.getTime())) return false;
  const end = sponsor.endDate ? parseISO(sponsor.endDate) : undefined;
  if (end && isNaN(end.getTime())) return false;

  const startMonth = startOfMonth(month);
  const endMonth = endOfMonth(month);
  const activeEnd = end || endMonth;
  return start <= endMonth && activeEnd >= startMonth;
}

function isSponsorRevenueActiveInMonth(sponsor: Sponsor, month: Date): boolean {
  if (sponsor.status !== "active" && sponsor.status !== "expired") return false;
  return isSponsorActiveInMonth(sponsor, month);
}

function isSponsorCurrentlyActive(sponsor: Sponsor, month: Date): boolean {
  if (sponsor.status !== "active") return false;
  return isSponsorActiveInMonth(sponsor, month);
}

function sponsorRevenueForMonth(sponsors: Sponsor[], month: Date): number {
  return sponsors
    .filter((s) => isSponsorRevenueActiveInMonth(s, month))
    .reduce((sum, s) => sum + getSponsorMonthlyShare(s), 0);
}

function activeSponsorCountForMonth(sponsors: Sponsor[], month: Date): number {
  return sponsors.filter((s) => isSponsorCurrentlyActive(s, month)).length;
}

function newsletterRateForMonth(
  newsletters: NewsletterItem[],
  month: Date,
  key: "openRate" | "clickRate"
): number | null {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const rates = newsletters
    .filter(
      (n) =>
        n.stage === "published" &&
        n.sentAt &&
        isWithinInterval(parseISO(n.sentAt), { start, end }) &&
        n[key] != null
    )
    .map((n) => n[key] as number);

  if (!rates.length) return null;
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

function getEarliestSponsorStart(sponsors: Sponsor[]): Date | undefined {
  const dates = sponsors
    .map((s) => (s.startDate ? parseISO(s.startDate) : undefined))
    .filter((d): d is Date => !!d && !isNaN(d.getTime()));
  if (!dates.length) return undefined;
  return dates.reduce((earliest, d) => (d < earliest ? d : earliest));
}

function generateMonthlyInterval(from: Date, to: Date): Date[] {
  const months: Date[] = [];
  let current = startOfMonth(from);
  const end = startOfMonth(to);
  while (current <= end) {
    months.push(current);
    current = startOfMonth(subMonths(current, -1));
  }
  return months;
}

function generateYearlyInterval(from: Date, to: Date): Date[] {
  const years: Date[] = [];
  let current = startOfYear(from);
  const end = startOfYear(to);
  while (current <= end) {
    years.push(current);
    current = startOfYear(subMonths(current, -12));
  }
  return years;
}

export function computeRevenueTimeSeries(
  sponsors: Sponsor[],
  now: Date = new Date(),
  options: RevenueTimeSeriesOptions = {}
): RevenuePoint[] {
  const granularity = options.granularity || "monthly";
  const defaultFrom = getEarliestSponsorStart(sponsors) || startOfMonth(now);
  const from = startOfMonth(options.from || defaultFrom);
  const to = granularity === "yearly" ? startOfYear(options.to || now) : startOfMonth(options.to || now);

  if (from > to) return [];

  if (granularity === "yearly") {
    const years = generateYearlyInterval(from, to);
    return years.map((year) => {
      const yearStart = startOfYear(year);
      const yearEnd = endOfYear(year);
      const months = generateMonthlyInterval(yearStart, yearEnd);
      const sponsorsRevenue = months.reduce(
        (sum, month) => sum + sponsorRevenueForMonth(sponsors, month),
        0
      );
      return {
        date: format(year, "yyyy"),
        revenue: sponsorsRevenue,
        subscriptions: 0,
        ads: 0,
        sponsors: sponsorsRevenue,
      };
    });
  }

  const months = generateMonthlyInterval(from, to);
  return months.map((month) => {
    const sponsorsRevenue = sponsorRevenueForMonth(sponsors, month);
    return {
      date: format(month, "MMM yyyy"),
      revenue: sponsorsRevenue,
      subscriptions: 0,
      ads: 0,
      sponsors: sponsorsRevenue,
    };
  });
}

export function computeKpiStats(
  sponsors: Sponsor[],
  newsletters: NewsletterItem[],
  now: Date = new Date()
): KpiStats {
  const currentMonth = startOfMonth(now);
  const previousMonth = startOfMonth(subMonths(now, 1));

  const currentMrr = sponsorRevenueForMonth(sponsors, currentMonth);
  const previousMrr = sponsorRevenueForMonth(sponsors, previousMonth);

  const currentSponsors = activeSponsorCountForMonth(sponsors, currentMonth);
  const previousSponsors = activeSponsorCountForMonth(sponsors, previousMonth);

  const currentOpenRate = newsletterRateForMonth(
    newsletters,
    currentMonth,
    "openRate"
  );
  const previousOpenRate = newsletterRateForMonth(
    newsletters,
    previousMonth,
    "openRate"
  );

  return {
    mrr: currentMrr,
    mrrGrowth: computeGrowth(previousMrr, currentMrr),
    subscribers: null,
    subscriberGrowth: null,
    openRate: currentOpenRate ?? 0,
    openRateGrowth: computeGrowth(previousOpenRate ?? 0, currentOpenRate ?? 0),
    totalSponsors: currentSponsors,
    sponsorGrowth: computeGrowth(previousSponsors, currentSponsors),
  };
}

function computeGrowth(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}
