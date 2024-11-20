// utils/NotificationManager.js
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let currentNotificationId = null;

export const createPlayerNotification = async (song, isPlaying) => {
      return;
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled !== 'true') return;

  // Cancel previous notification if it exists
  if (currentNotificationId) {
    await Notifications.dismissNotificationAsync(currentNotificationId);
  }

  // Create new notification
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: song.title,
      body: song.artist,
      data: { currentSong: song },
      actions: [
        {
          text: isPlaying ? 'Pause' : 'Play',
          identifier: 'PLAY_PAUSE'
        },
        {
          text: 'Next',
          identifier: 'NEXT'
        }
      ]
    },
    trigger: null
  });

  currentNotificationId = notificationId;
};