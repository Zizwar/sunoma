import { AudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

class AudioManager {
  constructor() {
    this.sound = null;
    this.statusSubscription = null;
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

  async isLocalAudio(audioUrl) {
    return await this.isLocalUri(audioUrl);
  }

  async setWebAudioMode(isWebAudioMode) {
    if (this.isWebAudioMode !== isWebAudioMode) {
      const previousMode = this.isWebAudioMode;
      this.isWebAudioMode = isWebAudioMode;
      if (this.currentSong) {
        await this.checkAndSwitchAudioMode(this.currentSong.audio_url);
      }
      if (this.isWebAudioMode !== previousMode) {
        this.emitChange();
      }
    }
  }

  async checkAndSwitchAudioMode(audioUrl) {
    const isLocal = await this.isLocalAudio(audioUrl);
    if (isLocal && this.isWebAudioMode) {
      this.isWebAudioMode = false;
      Alert.alert(
        "تم التبديل إلى الوضع العادي",
        "تم التبديل تلقائياً إلى وضع التشغيل العادي لأن المقطع الصوتي مخزن محلياً."
      );
      await this.loadAudio(this.currentSong);
    } else if (!isLocal && this.isWebAudioMode) {
      await this.unloadCurrentAudio();
      await this.loadWebAudio(this.currentSong);
    } else {
      await this.loadAudio(this.currentSong);
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
    await setAudioModeAsync({
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      allowsRecordingIOS: false,
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
        if (this.statusSubscription) {
          this.statusSubscription.remove();
          this.statusSubscription = null;
        }
        this.sound.remove();
        this.sound = null;
      }

      if (!song || (!song.audio_url && !song.localUri)) {
        throw new Error('Invalid song data: missing audio URL');
      }

      let uri;
      if (this.isLocalUri(song.audio_url)) {
        uri = song.audio_url;
      } else if (song.localUri) {
        uri = song.localUri;
      } else {
        uri = song.audio_url;
      }

      const player = new AudioPlayer({ uri });
      this.statusSubscription = player.addListener('playbackStatusUpdate', this.onPlaybackStatusUpdate);

      this.sound = player;
      this.currentSong = song;
      this.isPlaying = false;
      this.position = 0;
      this.duration = 0;

      this.emitChange();
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  }

  onPlaybackStatusUpdate(status) {
    if (status.isLoaded) {
      this.position = Math.round((status.currentTime ?? 0) * 1000);
      this.duration = Math.round((status.duration ?? 0) * 1000);
      this.isPlaying = status.playing ?? false;

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
      this.emitChange();
    } catch (error) {
      console.error('Error loading web audio:', error);
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
      this.sound.play();
    }
    this.isPlaying = true;
    this.emitChange();
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
      this.sound.pause();
    }
    this.isPlaying = false;
    this.emitChange();
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
      this.sound.pause();
      this.sound.seekTo(0);
    }
    this.isPlaying = false;
    this.position = 0;
    this.emitChange();
  }

  async unloadCurrentAudio() {
    if (this.statusSubscription) {
      this.statusSubscription.remove();
      this.statusSubscription = null;
    }
    if (this.sound) {
      this.sound.remove();
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
      this.sound.seekTo(position / 1000);
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
      this.sound.volume = volume;
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
      this.sound.seekTo(0);
      this.sound.play();
    }
    this.isPlaying = true;
    this.emitChange();
  }

}

export default new AudioManager();
