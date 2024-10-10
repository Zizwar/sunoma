import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import AudioManager from './AudioManager';

const BACKGROUND_AUDIO_TASK = 'BACKGROUND_AUDIO_TASK';

TaskManager.defineTask(BACKGROUND_AUDIO_TASK, async () => {
  try {
    if (AudioManager.isPlaying) {
      await AudioManager.playPause();
    }
    return TaskManager.BackgroundFetch.Result.NewData;
  } catch (error) {
    return TaskManager.BackgroundFetch.Result.Failed;
  }
});

export const startBackgroundAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
    });

    if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUDIO_TASK))) {
      await TaskManager.registerTaskAsync(BACKGROUND_AUDIO_TASK, {
        minimumInterval: 1,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch (err) {
    console.log('Failed to start background audio', err);
  }
};