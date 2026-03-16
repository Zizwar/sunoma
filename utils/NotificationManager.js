import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// expo-notifications push tokens are not supported in Expo Go since SDK 53
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export const setupNotifications = async () => {
  if (isExpoGo) return;
  await Notifications.requestPermissionsAsync();
};

export const createPlayerNotification = async (song, isPlaying) => {
  if (isExpoGo) return;

  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');

  if (notificationsEnabled === 'true') {
    return;
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
  if (isExpoGo) return;

  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled !== 'true') {
    return;
  }

  await createPlayerNotification(song, isPlaying);
};
