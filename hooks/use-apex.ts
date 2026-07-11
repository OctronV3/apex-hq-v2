import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  getNewsletters,
  addNewsletter,
  updateNewsletter,
  deleteNewsletter,
  getSponsors,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  getSocialPosts,
  addSocialPost,
  updateSocialPost,
  deleteSocialPost,
  getEmails,
  sendEmail,
  updateEmail,
  deleteEmail,
  getRevenueData,
  getTrafficData,
  getSocialMetrics,
  getKpiStats,
  getNotifications,
  syncNotifications,
  markNotification,
  getCalendarEvents,
} from "@/lib/data";
import {
  NewsletterItem,
  Sponsor,
  SocialPost,
  EmailMessage,
  EmailFolder,
  RevenuePoint,
  TrafficPoint,
  SocialMetric,
  Notification,
  CalendarEvent,
} from "@/types";

export const queryKeys = {
  newsletters: ["newsletters"] as const,
  sponsors: ["sponsors"] as const,
  socialPosts: ["social-posts"] as const,
  emails: ["emails"] as const,
  revenue: ["analytics", "revenue"] as const,
  traffic: ["analytics", "traffic"] as const,
  socialMetrics: ["analytics", "social-metrics"] as const,
  kpis: ["analytics", "kpis"] as const,
  notifications: ["notifications"] as const,
  calendar: ["calendar"] as const,
};

// Newsletter
export function useNewsletters(): UseQueryResult<NewsletterItem[]> {
  return useQuery({ queryKey: queryKeys.newsletters, queryFn: getNewsletters });
}

export function useAddNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addNewsletter,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.newsletters }),
  });
}

export function useUpdateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewsletterItem> }) =>
      updateNewsletter(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.newsletters }),
  });
}

export function useDeleteNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNewsletter,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.newsletters }),
  });
}

// Sponsors
export function useSponsors(): UseQueryResult<Sponsor[]> {
  return useQuery({ queryKey: queryKeys.sponsors, queryFn: getSponsors });
}

export function useAddSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addSponsor,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sponsors }),
  });
}

export function useUpdateSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Sponsor> }) =>
      updateSponsor(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sponsors }),
  });
}

export function useDeleteSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSponsor,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sponsors }),
  });
}

// Social
export function useSocialPosts(): UseQueryResult<SocialPost[]> {
  return useQuery({ queryKey: queryKeys.socialPosts, queryFn: getSocialPosts });
}

export function useAddSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addSocialPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.socialPosts }),
  });
}

export function useUpdateSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SocialPost> }) =>
      updateSocialPost(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.socialPosts }),
  });
}

export function useDeleteSocialPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSocialPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.socialPosts }),
  });
}

// Email
export function useEmails(folder?: EmailFolder): UseQueryResult<EmailMessage[]> {
  return useQuery({
    queryKey: folder ? [...queryKeys.emails, folder] : queryKeys.emails,
    queryFn: () => getEmails(folder),
  });
}

export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendEmail,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emails });
    },
  });
}

export function useUpdateEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<EmailMessage> }) =>
      updateEmail(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.emails }),
  });
}

export function useDeleteEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.emails }),
  });
}

// Analytics
export function useRevenue(
  params: { from?: string; to?: string; granularity?: string } = {}
) {
  return useQuery<RevenuePoint[]>({
    queryKey: [...queryKeys.revenue, params],
    queryFn: () => getRevenueData(params),
  });
}

export function useTraffic() {
  return useQuery<TrafficPoint[]>({
    queryKey: queryKeys.traffic,
    queryFn: getTrafficData,
  });
}

export function useSocialMetrics() {
  return useQuery<SocialMetric[]>({
    queryKey: queryKeys.socialMetrics,
    queryFn: getSocialMetrics,
  });
}

export function useKpis() {
  return useQuery({
    queryKey: queryKeys.kpis,
    queryFn: getKpiStats,
  });
}

// Notifications
export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: queryKeys.notifications,
    queryFn: getNotifications,
  });
}

export function useSyncNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: syncNotifications,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

export function useMarkNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Notification, "read" | "dismissed">> }) =>
      markNotification(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
}

// Calendar
export function useCalendarEvents() {
  return useQuery<CalendarEvent[]>({
    queryKey: queryKeys.calendar,
    queryFn: getCalendarEvents,
  });
}
