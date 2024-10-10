import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { AppState } from 'react-native';

class HybridAudioManager {
  constructor() {
    this.sound = null;
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
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.audio_url },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate
      );
      this.sound = sound;
    }
  }

  async playPause() {
    if (this.isBackgroundMode) {
      this.isPlaying ? this.pauseWebAudio() : this.playWebAudio(this.currentSong.audio_url);
    } else {
      if (this.sound) {
        this.isPlaying ? await this.sound.pauseAsync() : await this.sound.playAsync();
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
      await this.sound.playAsync();
    }
  }

  async pauseLocalAudio() {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      this.position = status.positionMillis;
      this.duration = status.durationMillis;
      this.isPlaying = status.isPlaying;
    }
  }

  // ... (other methods like setPosition, handleNext, handlePrevious, etc.)

  updateNotification() {
    // Update notification logic here
  }
}

export default new HybridAudioManager();