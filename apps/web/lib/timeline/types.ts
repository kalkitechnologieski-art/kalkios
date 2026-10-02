// == KALKI B3 COMMAND ==
// Timeline post domain types.
// -----------------------------------------------------------------------------

export type TimelinePostType =
  | 'system'
  | 'milestone'
  | 'deliverable'
  | 'question'
  | 'client_file'
  | 'note'
  | 'update';

export type TimelineVisibility = 'client' | 'admin';

export interface TimelineMediaItem {
  id: string;
  url: string;
  media_type: string | null;
  order_index: number;
}

export interface TimelinePost {
  id: string;
  project_id: string | null;
  order_id: string | null;
  author_id: string | null;
  post_type: TimelinePostType;
  content: string;
  visibility: TimelineVisibility;
  milestone_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  media?: TimelineMediaItem[];
  reactions?: Array<{ emoji: string; count: number }>;
}

export interface TimelineAuthor {
  id: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

export interface TimelinePostWithAuthor extends TimelinePost {
  author?: TimelineAuthor | null;
}
