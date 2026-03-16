import { setAudioModeAsync } from 'expo-audio';

export const startBackgroundAudio = async () => {
  try {
    await setAudioModeAsync({
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  } catch (err) {
    console.log('Failed to start background audio', err);
  }
};
