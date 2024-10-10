import { Audio } from 'expo-av';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';

const BACKGROUND_AUDIO_TASK = 'BACKGROUND_AUDIO_TASK';

class AudioManager {
  constructor() {
    this.sound = null;
    this.currentSong = null;
    this.isPlaying = false;
    this.position = 0;
    this.duration = 0;
    this.playlist = [];
    this.currentIndex = -1;
    this.repeatMode = 'none'; // 'none', 'one', 'all'
    this.isShuffled = false;
    this.listeners = new Set();
    this.webViewRef = null;
    this.isWebAudioMode = false;
    this.loadAudio = this.loadAudio.bind(this);
    this.onPlaybackStatusUpdate = this.onPlaybackStatusUpdate.bind(this);
    
  }

  setWebViewRef(ref) {
    this.webViewRef = ref;
  }

  setWebAudioMode(isWebAudioMode) {
    if (this.isWebAudioMode !== isWebAudioMode) {
      this.isWebAudioMode = isWebAudioMode;
      if (this.isWebAudioMode) {
        this.unloadCurrentAudio();
        if (this.webViewRef?.current && this.playlist.length > 0) {
          const playlistUrls = this.playlist.map(song => song.audio_url);
          this.webViewRef.current.injectJavaScript(`
            if (typeof setPlaylist === 'function') {
              setPlaylist(${JSON.stringify(playlistUrls)});
              ${this.currentSong ? `changeSong("${this.currentSong.audio_url}");` : ''}
              ${this.isPlaying ? 'playSong();' : ''}
            }
            true;
          `);
        }
      } else {
        this.stopWebAudio();
      }
      this.emitChange();
    }
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async initAudioMode() {
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
    });
  }

  async handleSongSelect(song, playlist, index) {
    this.setPlaylist(playlist, index);
    this.currentSong = song;
    if (this.isWebAudioMode) {
      this.loadWebAudio(song);
    } else {
      await this.unloadCurrentAudio();
      await this.loadAudio(song);
    }
    await this.play();
  }

  

isLocalUri(uri) {
    if (!uri) return false;
    return uri.startsWith(FileSystem.documentDirectory) || uri.startsWith('file://');
  }

  async loadAudio(song) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      let source;
      if (!song || (!song.audio_url && !song.localUri)) {
        throw new Error('Invalid song data: missing audio URL');
      }

      if (this.isLocalUri(song.audio_url)) {
        source = { uri: song.audio_url };
      } else if (song.localUri) {
        source = { uri: song.localUri };
      } else {
        source = { uri: song.audio_url };
      }

      const soundObject = new Audio.Sound();
      await soundObject.loadAsync(source, { shouldPlay: false });
      soundObject.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);

      this.sound = soundObject;
      this.currentSong = song;
      this.isPlaying = false;
      this.position = 0;
      this.duration = 0;

      await this.registerBackgroundTask();
      await this.updateNotification();
      this.emitChange();
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  }
  onPlaybackStatusUpdate(status) {
    if (status.isLoaded) {
      this.position = status.positionMillis;
      this.duration = status.durationMillis;
      this.isPlaying = status.isPlaying;

      if (status.didJustFinish) {
        this.handleSongEnd();
      }

      this.emitChange();
    }
  }

  async getAudioSource(song) {
    if (this.isLocalUri(song.audio_url)) {
      try {
        const base64 = await FileSystem.readAsStringAsync(song.audio_url, { encoding: FileSystem.EncodingType.Base64 });
        return { isLocal: true, data: base64 };
      } catch (error) {
        console.error('Error reading local file:', error);
        throw new Error('Unable to read local file');
      }
    } else {
      return { isLocal: false, data: song.audio_url };
    }
  }

  async loadWebAudio(song) {
    try {
      const audioSource = await this.getAudioSource(song);
      
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          (function() {
            if (typeof changeSong === 'function') {
              const source = ${JSON.stringify(audioSource)};
              if (source.isLocal) {
                const blob = new Blob([Uint8Array.from(atob(source.data), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                changeSong(url);
              } else {
                changeSong(source.data);
              }
            }
            return true;
          })();
        `);
      }
      
      this.currentSong = song;
      this.isPlaying = false;
      this.position = 0;
      this.duration = 0;
      this.updateNotification();
      this.emitChange();
    } catch (error) {
      console.error('Error loading web audio:', error);
    }
  }


  
  onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      this.position = status.positionMillis;
      this.duration = status.durationMillis;
      this.isPlaying = status.isPlaying;

      if (status.didJustFinish) {
        this.handleSongEnd();
      }

      this.emitChange();
    }
  }

  async handleSongEnd() {
    switch (this.repeatMode) {
      case 'one':
        await this.replay();
        break;
      case 'all':
        await this.playNext();
        break;
      case 'none':
      default:
        if (this.currentIndex < this.playlist.length - 1) {
          await this.playNext();
        } else {
          await this.stop();
        }
        break;
    }
  }

  async updateNotification() {
  	return;
    if (this.currentSong) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: this.currentSong.title,
          body: this.currentSong.artist,
          data: { currentSong: this.currentSong },
        },
        trigger: null,
      });
    }
  }

  async play() {
    if (this.isWebAudioMode) {
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          if (typeof playSong === 'function') {
            playSong();
          }
          true;
        `);
      }
    } else if (this.sound) {
      await this.sound.playAsync();
    }
    this.isPlaying = true;
    this.emitChange();
    this.updateNotification();
  }

  async pause() {
    if (this.isWebAudioMode) {
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          if (typeof pauseSong === 'function') {
            pauseSong();
          }
          true;
        `);
      }
    } else if (this.sound) {
      await this.sound.pauseAsync();
    }
    this.isPlaying = false;
    this.emitChange();
    this.updateNotification();
  }

  async playPause() {
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async stop() {
    if (this.isWebAudioMode) {
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          if (typeof pauseSong === 'function' && typeof audio !== 'undefined') {
            pauseSong();
            audio.currentTime = 0;
          }
          true;
        `);
      }
    } else if (this.sound) {
      await this.sound.stopAsync();
    }
    this.isPlaying = false;
    this.position = 0;
    this.emitChange();
    this.updateNotification();
  }

  async unloadCurrentAudio() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    this.isPlaying = false;
    this.position = 0;
    this.duration = 0;
    this.emitChange();
  }

  stopWebAudio() {
    if (this.webViewRef?.current) {
      this.webViewRef.current.injectJavaScript(`
        if (typeof pauseSong === 'function' && typeof audio !== 'undefined') {
          pauseSong();
          audio.src = '';
        }
        true;
      `);
    }
    this.isPlaying = false;
    this.position = 0;
    this.duration = 0;
    this.emitChange();
  }

  async setPosition(position) {
    if (this.isWebAudioMode) {
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          if (typeof seekSong === 'function') {
            seekSong(${position / 1000});
          }
          true;
        `);
      }
    } else if (this.sound) {
      await this.sound.setPositionAsync(position);
    }
    this.position = position;
    this.emitChange();
  }

  async setVolume(volume) {
    if (this.isWebAudioMode) {
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          if (typeof audio !== 'undefined') {
            audio.volume = ${volume};
          }
          true;
        `);
      }
    } else if (this.sound) {
      await this.sound.setVolumeAsync(volume);
    }
  }

  setRepeatMode(mode) {
    this.repeatMode = mode;
    this.emitChange();
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    if (this.isShuffled) {
      this.shufflePlaylist();
    } else {
      this.playlist = [...this.originalPlaylist];
      this.currentIndex = this.originalPlaylist.findIndex(song => song.id === this.currentSong.id);
    }
    this.emitChange();
  }

  shufflePlaylist() {
    this.originalPlaylist = [...this.playlist];
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
    }
    this.currentIndex = this.playlist.findIndex(song => song.id === this.currentSong.id);
  }

  setPlaylist(songs, startIndex = 0) {
    this.playlist = songs;
    this.originalPlaylist = [...songs];
    this.currentIndex = startIndex;
    if (this.isShuffled) {
      this.shufflePlaylist();
    }
    this.emitChange();
  }

  async playNext() {
    if (this.currentIndex < this.playlist.length - 1) {
      this.currentIndex++;
      await this.handleSongSelect(this.playlist[this.currentIndex], this.playlist, this.currentIndex);
    } else if (this.repeatMode === 'all') {
      this.currentIndex = 0;
      await this.handleSongSelect(this.playlist[this.currentIndex], this.playlist, this.currentIndex);
    } else {
      await this.stop();
    }
  }

  async playPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      await this.handleSongSelect(this.playlist[this.currentIndex], this.playlist, this.currentIndex);
    } else if (this.repeatMode === 'all') {
      this.currentIndex = this.playlist.length - 1;
      await this.handleSongSelect(this.playlist[this.currentIndex], this.playlist, this.currentIndex);
    } else {
      await this.stop();
    }
  }

  async replay() {
    if (this.isWebAudioMode) {
      if (this.webViewRef?.current) {
        this.webViewRef.current.injectJavaScript(`
          if (typeof audio !== 'undefined') {
            audio.currentTime = 0;
            playSong();
          }
          true;
        `);
      }
    } else if (this.sound) {
      await this.sound.replayAsync();
    }
    this.isPlaying = true;
    this.emitChange();
  }

  async registerBackgroundTask() {
    TaskManager.defineTask(BACKGROUND_AUDIO_TASK, async () => {
      try {
        if (this.isPlaying) {
          // Here you can add logic to update notification or other background operations
        }
        return BackgroundFetch.Result.NewData;
      } catch (error) {
        return BackgroundFetch.Result.Failed;
      }
    });

    await BackgroundFetch.registerTaskAsync(BACKGROUND_AUDIO_TASK, {
      minimumInterval: 1,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}

export default new AudioManager();