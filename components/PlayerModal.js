import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, SafeAreaView } from 'react-native';
import { useTheme } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { AudioContext } from '../App';
import { toggleFavorite, getFavorites } from '../utils/favoriteUtils';
import { downloadSong, isSongDownloaded } from '../utils/offlineUtils';
import SongDetailsModal from './SongDetailsModal';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

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
    setPosition
  } = useContext(AudioContext);

  const [isFavoriteSong, setIsFavoriteSong] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const translateX = useRef(new Animated.Value(0)).current;
  const sliderRef = useRef(null);

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    Dimensions.addEventListener('change', updateOrientation);
    updateOrientation();

    return () => {
      Dimensions.removeEventListener('change', updateOrientation);
    };
  }, []);

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
      } catch (error) {
        console.error('Error downloading song:', error);
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
        if (await Sharing.isAvailableAsync()) {
          const localUri = FileSystem.documentDirectory + 'temp_audio.mp3';
          const downloadResumable = FileSystem.createDownloadResumable(
            currentSong.audio_url,
            localUri,
            {}
          );
          
          const { uri } = await downloadResumable.downloadAsync();
          
          await Sharing.shareAsync(uri);
          
          await FileSystem.deleteAsync(uri);
        } else {
          console.log('Sharing is not available on this platform');
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      if (translationX > 100) {
        handlePrevious();
      } else if (translationX < -100) {
        handleNext();
      }
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7
      }).start();
    }
  };

  const handleSliderChange = (value) => {
    if (sliderRef.current) {
      clearTimeout(sliderRef.current);
    }
    setPosition(value);
    sliderRef.current = setTimeout(() => {
      setPosition(value);
    }, 100);
  };

  if (!visible || !currentSong) return null;

  const imageSize = orientation === 'portrait' ? SCREEN_WIDTH : SCREEN_HEIGHT * 0.6;

  const renderContent = () => (
    <>
     <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: currentSong.image_url }} 
          style={styles.thumbnail}
        />
      </View>

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
          onValueChange={handleSliderChange}
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
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={25} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownload}>
          <Ionicons name={isDownloaded ? "cloud-done" : "cloud-download"} size={25} color="#fff" />
        </TouchableOpacity>
      </View>
    </>
  );

  if (isIOS) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Image source={{ uri: currentSong.image_url }} style={styles.backgroundImage} blurRadius={20} />
        <View style={styles.overlay} />
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={() => setDetailsModalVisible(true)}>
          <Ionicons name="information-circle-outline" size={30} color="#fff" />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          {renderContent()}
        </View>

        <SongDetailsModal
          visible={detailsModalVisible}
          onClose={() => setDetailsModalVisible(false)}
          song={currentSong}
          theme={theme}
        />
      </SafeAreaView>
    );
  }

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
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={[
          styles.albumArtContainer,
          { transform: [{ translateX }] },
          orientation === 'landscape' && styles.landscapeAlbumArt
        ]}>
          <Image 
            source={{ uri: currentSong.image_url }} 
            style={[styles.albumArt, { width: imageSize, height: imageSize }]} 
          />
        </Animated.View>
      </PanGestureHandler>
      
      {renderContent()}

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
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  infoButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  albumArtContainer: {
    alignSelf: 'center',
    marginTop: 60,
  },
  landscapeAlbumArt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  albumArt: {
    borderRadius: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  playPauseButton: {
    marginHorizontal: 40,
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  thumbnail: {
    width: 250,
    height: 250,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },

});

export default PlayerModal;