import { getAppSettings } from './storage';

// Storage key for tracking last notification timestamp
const LAST_NOTIFICATION_KEY = 'lastNotificationTimestamp';

/**
 * Check if notification permission has been granted, and request if not
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  // If permission is already granted or denied, return it
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Send a notification if permission is granted
 */
function sendNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png', // Optional: add app icon
        badge: '/icon-192x192.png',
        tag: 'reminder', // Use tag to prevent duplicate notifications
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

/**
 * Get the current day of week (0 = Sunday, 1 = Monday, etc.)
 */
function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Get current time in HH:mm format
 */
function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if a notification should be sent based on current time and settings
 */
function shouldSendNotification(): boolean {
  const settings = getAppSettings();
  
  // Don't send if notifications are disabled
  if (!settings.notifications.enabled) {
    return false;
  }

  // Don't send if no reminder time is set
  if (!settings.notifications.reminderTime) {
    return false;
  }

  // Don't send if no reminder days are set
  if (!settings.notifications.reminderDays || settings.notifications.reminderDays.length === 0) {
    return false;
  }

  // Check if today is one of the reminder days
  const currentDay = getCurrentDayOfWeek();
  if (!settings.notifications.reminderDays.includes(currentDay)) {
    return false;
  }

  // Check if current time matches reminder time
  const currentTime = getCurrentTime();
  if (currentTime !== settings.notifications.reminderTime) {
    return false;
  }

  // Check if we've already sent a notification in this minute
  const lastNotification = localStorage.getItem(LAST_NOTIFICATION_KEY);
  if (lastNotification) {
    const lastTimestamp = parseInt(lastNotification, 10);
    const now = Date.now();
    // Only send if at least 60 seconds have passed since last notification
    // This prevents duplicates if the interval runs multiple times in the same minute
    if (now - lastTimestamp < 60000) {
      return false;
    }
  }

  return true;
}

/**
 * Check and send notification if conditions are met
 */
function checkAndSendNotification(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  // Only proceed if permission is granted
  if (Notification.permission !== 'granted') {
    return;
  }

  if (shouldSendNotification()) {
    sendNotification(
      'MyPothesis Reminder',
      "Don't forget to log your data today!"
    );
    
    // Store timestamp to prevent duplicates
    localStorage.setItem(LAST_NOTIFICATION_KEY, Date.now().toString());
  }
}

let intervalId: NodeJS.Timeout | null = null;

/**
 * Start the notification scheduler
 * Checks every minute if a notification should be sent
 */
export function startNotificationScheduler(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Clear any existing interval
  if (intervalId) {
    clearInterval(intervalId);
  }

  const settings = getAppSettings();
  
  // Don't start scheduler if notifications are disabled
  if (!settings.notifications.enabled) {
    return;
  }

  // Request permission first
  requestNotificationPermission().then((permission) => {
    if (permission === 'granted') {
      // Check immediately (in case the time matches right now)
      checkAndSendNotification();
      
      // Then check every minute
      intervalId = setInterval(() => {
        checkAndSendNotification();
      }, 60000); // Check every 60 seconds (1 minute)
    }
  });
}

/**
 * Stop the notification scheduler
 */
export function stopNotificationScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Restart the notification scheduler (useful when settings change)
 */
export function restartNotificationScheduler(): void {
  stopNotificationScheduler();
  
  const settings = getAppSettings();
  // Only start scheduler if notifications are enabled
  if (settings.notifications.enabled) {
    startNotificationScheduler();
  }
}

