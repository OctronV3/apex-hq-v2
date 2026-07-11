import { differenceInDays, isPast, isToday, parseISO } from "date-fns";
import type { NewsletterItem, Notification, SocialPost, Sponsor } from "@/types";

export interface NotificationInput {
  type: string;
  title: string;
  message: string;
  link?: string;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function daysUntil(date: Date, now: Date): number {
  return differenceInDays(date, now);
}

export function generateNotifications(
  newsletters: NewsletterItem[],
  sponsors: Sponsor[],
  socialPosts: SocialPost[],
  now: Date = new Date()
): NotificationInput[] {
  const notifications: NotificationInput[] = [];

  for (const n of newsletters) {
    const scheduled = parseDate(n.scheduledAt);
    const sent = parseDate(n.sentAt);

    if (scheduled && !isPast(scheduled) && n.stage !== "published" && n.stage !== "archived") {
      const days = daysUntil(scheduled, now);
      if (days <= 7) {
        notifications.push({
          type: "newsletter_deadline",
          title: "Newsletter deadline",
          message: `${n.title} is scheduled ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}.`,
          link: `/newsletter`,
        });
      }
    }

    if (scheduled && isPast(scheduled) && n.stage !== "published" && n.stage !== "archived") {
      notifications.push({
        type: "newsletter_overdue",
        title: "Newsletter overdue",
        message: `${n.title} was scheduled for ${scheduled.toDateString()} and is still in ${n.stage}.`,
        link: `/newsletter`,
      });
    }

    if (sent && isToday(sent) && n.stage === "published") {
      notifications.push({
        type: "newsletter_published",
        title: "Newsletter published",
        message: `${n.title} went out today.`,
        link: `/newsletter`,
      });
    }
  }

  for (const s of sponsors) {
    const end = parseDate(s.endDate);
    if (!end) continue;
    const days = daysUntil(end, now);

    if (!isPast(end) && days <= 14) {
      notifications.push({
        type: "sponsor_renewal",
        title: "Sponsor renewal",
        message: `${s.name} contract expires ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}.`,
        link: `/sponsors`,
      });
    }

    if (isPast(end) && days >= -7) {
      notifications.push({
        type: "sponsor_expired",
        title: "Sponsor expired",
        message: `${s.name} contract expired ${Math.abs(days)} days ago.`,
        link: `/sponsors`,
      });
    }
  }

  for (const p of socialPosts) {
    const scheduled = parseDate(p.scheduledAt);
    if (!scheduled) continue;

    if (!isPast(scheduled) && p.status === "scheduled") {
      const hours = (scheduled.getTime() - now.getTime()) / 36e5;
      if (hours <= 24) {
        notifications.push({
          type: "social_publish_reminder",
          title: "Social post going live",
          message: `${p.platform} post is scheduled ${hours <= 1 ? "in less than an hour" : "within 24 hours"}.`,
          link: `/social`,
        });
      }
    }

    if (isPast(scheduled) && p.status === "scheduled") {
      notifications.push({
        type: "social_overdue",
        title: "Social post overdue",
        message: `${p.platform} post was scheduled for ${scheduled.toDateString()} and is still pending.`,
        link: `/social`,
      });
    }
  }

  return notifications;
}

export function notificationToInput(
  n: NotificationInput,
  workspaceId: string,
  userId?: string
): Omit<Notification, "id" | "createdAt" | "updatedAt"> {
  return {
    workspaceId,
    userId,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    read: false,
    dismissed: false,
    isGenerated: true,
  };
}
