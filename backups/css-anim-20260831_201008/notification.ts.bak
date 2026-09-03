export type NotificationType = 
  | 'welcome'
  | 'token_milestone'
  | 'chat'
  | 'project_update'
  | 'system'
  | 'task'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, any>
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  chat_notifications: boolean
  token_milestones: boolean
  project_updates: boolean
  system_notifications: boolean
  created_at: string
  updated_at: string
}

export interface TokenUsage {
  id: string
  user_id: string
  tokens_used: number
  last_milestone: number
  updated_at: string
}
