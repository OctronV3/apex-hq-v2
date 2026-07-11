export type PipelineStage =
  | "idea"
  | "research"
  | "writing"
  | "editing"
  | "review"
  | "graphics"
  | "scheduled"
  | "published"
  | "archived";

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

export type SocialPlatform =
  | "twitter"
  | "x"
  | "linkedin"
  | "instagram"
  | "threads"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "bluesky";
export type SocialStatus = "draft" | "scheduled" | "published";

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: SocialStatus;
  connectionId?: string;
  metrics?: {
    likes: number;
    shares: number;
    comments: number;
    impressions: number;
  };
}

export interface SocialConnection {
  id: string;
  workspaceId: string;
  userId?: string;
  platform: SocialPlatform;
  accountName?: string;
  accountHandle?: string;
  externalId?: string;
  profileUrl?: string;
  connectionMethod: "api" | "webview";
  status: "pending" | "connected" | "error" | "disconnected";
  metrics?: {
    followers?: number;
    reach?: number;
    views?: number;
    engagement?: number;
  };
  recentPosts?: {
    id: string;
    content: string;
    publishedAt: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
  }[];
  profile?: Record<string, unknown>;
  connectedAt?: string;
  disconnectedAt?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Notification {
  id: string;
  workspaceId: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  dismissed: boolean;
  isGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  type: "newsletter" | "sponsor" | "social";
  title: string;
  date: string;
  endDate?: string;
  status?: string;
  color: string;
  link: string;
}
