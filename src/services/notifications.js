export const notificationService = {
  async requestPermissions() {
    return { success: false, disabled: true };
  },
  async configureChannels() {
    return { success: false, disabled: true };
  },
  async sendLocalNotification() {
    return { success: false, disabled: true };
  },
  async sendPushNotification() {
    return { success: false, disabled: true };
  },
  handleNotificationResponse() {
    return { action: 'none' };
  },
  getNotificationListeners() {
    return { received: null, response: null };
  },
};

// Notifications are intentionally disabled for Expo Go workflow.
export const requestNotificationPermissions = async () => {
  return { success: false, disabled: true };
};