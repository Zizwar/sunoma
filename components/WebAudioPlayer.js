// components/WebAudioPlayer.js

import React, { useRef, useEffect, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { AudioContext } from '../App';
import AudioManager from '../utils/AudioManager';

const WebAudioPlayer = ({ onReady }) => {
  const webViewRef = useRef(null);
  const { handleNext, isWebAudioMode } = useContext(AudioContext);

  useEffect(() => {
    if (onReady) {
      onReady(webViewRef);
    }
    if (webViewRef.current) {
      AudioManager.setWebViewRef(webViewRef);
    }
  }, [onReady, webViewRef]);

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'ended' && isWebAudioMode) {
      handleNext();
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body>
        <audio id="audioPlayer" style="display: none;"></audio>
        <script>
          var audio = document.getElementById('audioPlayer');
          var playlist = [];
          var currentIndex = 0;
          
          audio.onloadedmetadata = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded', duration: audio.duration }));
          };
          
          audio.ontimeupdate = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'timeupdate', currentTime: audio.currentTime }));
          };
          
          audio.onended = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ended' }));
          };

          window.setPlaylist = function(newPlaylist) {
            playlist = newPlaylist;
            currentIndex = 0;
          };

          window.changeSong = function(url) {
            audio.src = url;
            audio.load();
          };

          window.playSong = function() {
            audio.play().catch(error => console.error('Playback failed:', error));
          };

          window.pauseSong = function() {
            audio.pause();
          };

          window.seekSong = function(time) {
            audio.currentTime = time;
          };

          window.playNext = function() {
            if (currentIndex < playlist.length - 1) {
              currentIndex++;
              changeSong(playlist[currentIndex]);
              playSong();
            }
          };

          window.playPrevious = function() {
            if (currentIndex > 0) {
              currentIndex--;
              changeSong(playlist[currentIndex]);
              playSong();
            }
          };
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 0,
    height: 0,
  },
  webview: {
    opacity: 0,
  },
});

export default WebAudioPlayer;