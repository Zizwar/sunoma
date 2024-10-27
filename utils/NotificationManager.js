import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const setupNotifications = async () => {
  await Notifications.requestPermissionsAsync();
};

export const createPlayerNotification = async (song, isPlaying) => {
//	return;
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  
  if (notificationsEnabled === 'true') {
    return; // Don't create notification if disabled
  }

  const buttons = [
    {
      text: isPlaying ? 'Pause' : 'Play',
      onPress: () => console.log('Play/Pause pressed'),
    },
    {
      text: 'Next',
      onPress: () => console.log('Next pressed'),
    },
  ];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: song.title,
      body: song.artist,
      data: { currentSong: song },
      actions: buttons,
    },
    trigger: null,
  });
};

export const updateNotificationForBackground = async (song, isPlaying) => {
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  //return;
  if (notificationsEnabled !== 'true') {
    return; // Don't update notification if disabled
  }

  await createPlayerNotification(song, isPlaying);
};