export type PipelineStage = "idea" | "writing" | "scheduled" | "sent";

export interface NewsletterItem {
  id: string;
  title: string;
  author: string;
  stage: PipelineStage;
  scheduledAt?: string;
  sentAt?: string;
  openRate?: number;
  clickRate?: number;
  tags: string[];
}

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze";
export type SponsorStatus = "active" | "pending" | "expired" | "negotiating";

export interface Sponsor {
  id: string;
  name: string;
  tier: SponsorTier;
  dealValue: number;
  status: SponsorStatus;
  startDate: string;
  endDate?: string;
  contact: string;
  logo?: string;
}

export type SocialPlatform = "twitter" | "linkedin" | "instagram" | "threads";
export type SocialStatus = "draft" | "scheduled" | "published";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: SocialStatus;
  metrics?: {
    likes: number;
    shares: number;
    comments: number;
    impressions: number;
  };
}

export type EmailFolder = "inbox" | "sent" | "draft" | "trash";

export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  folder: EmailFolder;
  read: boolean;
  starred: boolean;
  labels: string[];
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  subscriptions: number;
  ads: number;
  sponsors: number;
}

export interface TrafficPoint {
  date: string;
  visitors: number;
  pageViews: number;
}

export interface SocialMetric {
  platform: string;
  followers: number;
  growth: number;
}

export interface KpiStats {
  mrr: number;
  mrrGrowth: number;
  subscribers: number | null;
  subscriberGrowth: number | null;
  openRate: number;
  openRateGrowth: number;
  totalSponsors: number;
  sponsorGrowth: number;
}
