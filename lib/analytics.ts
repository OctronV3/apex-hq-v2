import {
  differenceInCalendarMonths,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import type { KpiStats, NewsletterItem, RevenuePoint, Sponsor } from "@/types";

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
        n.stage === "sent" &&
        n.sentAt &&
        isWithinInterval(parseISO(n.sentAt), { start, end }) &&
        n[key] != null
    )
    .map((n) => n[key] as number);

  if (!rates.length) return null;
  return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
}

function activeSponsorCountForMonth(sponsors: Sponsor[], month: Date): number {
  return sponsors.filter((s) => isSponsorCurrentlyActive(s, month)).length;
}

function sponsorRevenueForMonth(sponsors: Sponsor[], month: Date): number {
  return sponsors
    .filter((s) => isSponsorRevenueActiveInMonth(s, month))
    .reduce((sum, s) => sum + getSponsorMonthlyShare(s), 0);
}

export function computeRevenueTimeSeries(
  sponsors: Sponsor[],
  now: Date = new Date()
): RevenuePoint[] {
  const months: Date[] = [];
  for (let i = 11; i >= 0; i--) {
    months.push(startOfMonth(subMonths(now, i)));
  }

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
