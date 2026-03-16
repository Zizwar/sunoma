import { AudioPlayer } from 'expo-audio';
import { AppState } from 'react-native';

class HybridAudioManager {
  constructor() {
    this.sound = null;
    this.statusSubscription = null;
    this.webView = null;
    this.currentSong = null;
    this.isPlaying = false;
    this.position = 0;
    this.duration = 0;
    this.isBackgroundMode = false;

    AppState.addEventListener('change', this.handleAppStateChange);
  }

  setWebView(webViewRef) {
    this.webView = webViewRef;
  }

  handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'background') {
      this.switchToBackgroundMode();
    } else if (nextAppState === 'active') {
      this.switchToForegroundMode();
    }
  }

  async switchToBackgroundMode() {
    if (this.isPlaying && this.currentSong) {
      this.isBackgroundMode = true;
      await this.pauseLocalAudio();
      this.playWebAudio(this.currentSong.audio_url);
    }
  }

  async switchToForegroundMode() {
    if (this.isPlaying && this.currentSong) {
      this.isBackgroundMode = false;
      this.pauseWebAudio();
      await this.playLocalAudio();
    }
  }

  async loadAudio(song) {
    this.currentSong = song;
    if (!this.isBackgroundMode) {
      if (this.statusSubscription) {
        this.statusSubscription.remove();
        this.statusSubscription = null;
      }
      if (this.sound) {
        this.sound.remove();
        this.sound = null;
      }
      const player = new AudioPlayer({ uri: song.audio_url });
      this.statusSubscription = player.addListener('playbackStatusUpdate', this.onPlaybackStatusUpdate);
      this.sound = player;
    }
  }

  async playPause() {
    if (this.isBackgroundMode) {
      this.isPlaying ? this.pauseWebAudio() : this.playWebAudio(this.currentSong.audio_url);
    } else {
      if (this.sound) {
        this.isPlaying ? this.sound.pause() : this.sound.play();
      }
    }
    this.isPlaying = !this.isPlaying;
    this.updateNotification();
  }

  playWebAudio(url) {
    if (this.webView) {
      this.webView.injectJavaScript(`
        var audio = new Audio('${url}');
        audio.play();
      `);
    }
  }

  pauseWebAudio() {
    if (this.webView) {
      this.webView.injectJavaScript(`
        if (audio) {
          audio.pause();
        }
      `);
    }
  }

  async playLocalAudio() {
    if (this.sound) {
      this.sound.play();
    }
  }

  async pauseLocalAudio() {
    if (this.sound) {
      this.sound.pause();
    }
  }

  onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      this.position = Math.round((status.currentTime ?? 0) * 1000);
      this.duration = Math.round((status.duration ?? 0) * 1000);
      this.isPlaying = status.playing ?? false;
    }
  }

  // ... (other methods like setPosition, handleNext, handlePrevious, etc.)

  updateNotification() {
    // Update notification logic here
  }
}

export default new HybridAudioManager();
