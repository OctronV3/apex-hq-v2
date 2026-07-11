import { parseISO } from "date-fns";
import type { CalendarEvent, NewsletterItem, SocialPost, Sponsor } from "@/types";

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function formatEventDate(d: Date): string {
  return d.toISOString();
}

export function generateCalendarEvents(
  newsletters: NewsletterItem[],
  sponsors: Sponsor[],
  socialPosts: SocialPost[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const n of newsletters) {
    const scheduled = parseDate(n.scheduledAt);
    const sent = parseDate(n.sentAt);

    if (scheduled) {
      events.push({
        id: `newsletter-scheduled-${n.id}`,
        type: "newsletter",
        title: n.title,
        date: formatEventDate(scheduled),
        status: n.stage,
        color: n.stage === "scheduled" ? "#ff1a1a" : "#ffffff",
        link: "/newsletter",
      });
    }

    if (sent) {
      events.push({
        id: `newsletter-published-${n.id}`,
        type: "newsletter",
        title: n.title,
        date: formatEventDate(sent),
        status: "published",
        color: "#ffffff",
        link: "/newsletter",
      });
    }
  }

  for (const s of sponsors) {
    const start = parseDate(s.startDate);
    const end = parseDate(s.endDate);

    if (start) {
      events.push({
        id: `sponsor-start-${s.id}`,
        type: "sponsor",
        title: `${s.name} starts`,
        date: formatEventDate(start),
        status: s.status,
        color: s.status === "active" ? "#ff1a1a" : "#888888",
        link: "/sponsors",
      });
    }

    if (end) {
      events.push({
        id: `sponsor-end-${s.id}`,
        type: "sponsor",
        title: `${s.name} renewal`,
        date: formatEventDate(end),
        endDate: formatEventDate(end),
        status: s.status,
        color: s.status === "active" ? "#ffffff" : "#888888",
        link: "/sponsors",
      });
    }
  }

  for (const p of socialPosts) {
    const scheduled = parseDate(p.scheduledAt);
    const published = parseDate(p.publishedAt);

    if (scheduled) {
      events.push({
        id: `social-scheduled-${p.id}`,
        type: "social",
        title: `${p.platform} post`,
        date: formatEventDate(scheduled),
        status: p.status,
        color: p.status === "scheduled" ? "#ff1a1a" : "#ffffff",
        link: "/social",
      });
    }

    if (published) {
      events.push({
        id: `social-published-${p.id}`,
        type: "social",
        title: `${p.platform} published`,
        date: formatEventDate(published),
        status: "published",
        color: "#ffffff",
        link: "/social",
      });
    }
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
