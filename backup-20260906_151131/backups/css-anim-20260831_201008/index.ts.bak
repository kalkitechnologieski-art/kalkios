import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type NotificationType = 'task' | 'chat' | 'project' | 'meeting' | 'system' | 'bug'
type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'

export interface NotificationPayload {
  userId: string
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  link?: string
  metadata?: any
  senderId?: string
}

const supabase = createClient()

export async function sendNotification(payload: NotificationPayload) {
  const {
    userId,
    title,
    message,
    type,
    priority = 'normal',
    link,
    metadata,
    senderId,
  } = payload

  const { data, error } = await supabase.from('notifications').insert({
    user_id: userId,
    title,
    message,
    type,
    priority,
    link,
    metadata,
    sender_id: senderId,
    read: false,
    created_at: new Date().toISOString(),
  }).select().single()

  if (error) {
    console.error('Failed to send notification:', error)
    throw error
  }
  return data
}

export async function sendBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: NotificationType,
  priority?: NotificationPriority,
  link?: string,
  metadata?: any,
  senderId?: string
) {
  const notifications = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    type,
    priority: priority || 'normal',
    link,
    metadata,
    sender_id: senderId,
    read: false,
    created_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase.from('notifications').insert(notifications).select()
  if (error) {
    console.error('Failed to send bulk notifications:', error)
    throw error
  }
  return data
}

export async function notifyAdmins(title: string, message: string, type: NotificationType, priority?: NotificationPriority, link?: string, metadata?: any) {
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['ceo', 'admin', 'manager'])
  if (admins) {
    await sendBulkNotifications(
      admins.map((a: any) => a.id),
      title,
      message,
      type,
      priority,
      link,
      metadata
    )
  }
}

export async function notifyEmployees(title: string, message: string, type: NotificationType, priority?: NotificationPriority, link?: string, metadata?: any) {
  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['employee', 'developer', 'support', 'hr'])
  if (employees) {
    await sendBulkNotifications(
      employees.map((e: any) => e.id),
      title,
      message,
      type,
      priority,
      link,
      metadata
    )
  }
}

// Real-time subscription hook
export function useNotificationsSubscription() {
  // This is handled in the useNotifications hook
}
