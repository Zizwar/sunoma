import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { AudioContext } from '../App';
import { toggleFavorite, getFavorites } from '../utils/favoriteUtils';
import { downloadSong, isSongDownloaded } from '../utils/offlineUtils';
import SongDetailsModal from './SongDetailsModal';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get('window');

const PlayerModal = ({ visible, onClose }) => {

  const { theme } = useTheme();
  const { 
    currentSong, 
    isPlaying, 
    position, 
    duration,
    handlePlayPause, 
    handleNext, 
    handlePrevious,
    setPosition,
    setRepeatMode,
    toggleShuffle,
    repeatMode,
    isShuffled
  } = useContext(AudioContext);

  const [isFavoriteSong, setIsFavoriteSong] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (currentSong) {
      checkFavoriteStatus();
      checkDownloadStatus();
    }
  }, [currentSong]);

  const checkDownloadStatus = async () => {
    if (currentSong) {
      const downloaded = await isSongDownloaded(currentSong.id);
      setIsDownloaded(downloaded);
    }
  };

  const handleDownload = async () => {
    if (currentSong && !isDownloaded) {
      try {
        await downloadSong(currentSong);
        setIsDownloaded(true);
        // You might want to show a success message here
      } catch (error) {
        console.error('Error downloading song:', error);
        // Show an error message to the user
      }
    }
  };

  const checkFavoriteStatus = async () => {
    if (currentSong) {
      try {
        const favorites = await getFavorites();
        const isFavorite = favorites.some(fav => fav.id === currentSong.id);
        setIsFavoriteSong(isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (currentSong) {
      try {
        const newStatus = await toggleFavorite(currentSong);
        setIsFavoriteSong(newStatus);
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    }
  };

  const handleShare = async () => {
    if (currentSong && currentSong.audio_url) {
      try {
        await Sharing.shareAsync(currentSong.audio_url);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!visible || !currentSong) return null;

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Image source={{ uri: currentSong.image_url }} style={styles.backgroundImage} blurRadius={20} />
      <View style={styles.overlay} />
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="chevron-down" size={30} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.infoButton} onPress={() => setDetailsModalVisible(true)}>
        <Ionicons name="information-circle-outline" size={30} color="#fff" />
      </TouchableOpacity>
      
      <Image source={{ uri: currentSong.image_url }} style={styles.albumArt} />
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onValueChange={setPosition}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#fff"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={handlePrevious}>
          <Ionicons name="play-skip-back" size={35} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={styles.playPauseButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={50} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Ionicons name="play-skip-forward" size={35} color="#fff" />
        </TouchableOpacity>
      </View>
      
       <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Ionicons name={isFavoriteSong ? "heart" : "heart-outline"} size={25} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleShuffle}>
          <Ionicons name="shuffle" size={25} color={isShuffled ? "#1DB954" : "#fff"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRepeatMode(repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none')}>
          <Ionicons 
            name={repeatMode === 'one' ? "repeat-one" : "repeat"} 
            size={25} 
            color={repeatMode !== 'none' ? "#1DB954" : "#fff"} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={25} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownload}>
          <Ionicons name={isDownloaded ? "cloud-done" : "cloud-download"} size={25} color="#fff" />
        </TouchableOpacity>
      </View>

      <SongDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        song={currentSong}
        theme={theme}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  albumArt: {
    width: width - 80,
    height: width - 80,
    alignSelf: 'center',
    borderRadius: 10,
    marginTop: 60,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  artist: {
    fontSize: 18,
    color: '#ddd',
    marginTop: 5,
    textAlign: 'center',
  },
  sliderContainer: {
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    marginHorizontal: 40,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
});

export default PlayerModal;