import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioContext } from '../App';
import { useTheme } from 'react-native-elements';
import { toggleFavorite, getFavorites } from '../utils/favoriteUtils';

const MiniPlayer = () => {
  const { theme } = useTheme();
  const { 
    currentSong, 
    isPlaying, 
    handlePlayPause, 
    handleNext, 
    handlePrevious, 
    togglePlayerModal,
    setMiniPlayerVisible,
    isWebAudioMode
  } = useContext(AudioContext);

  const [isFavoriteSong, setIsFavoriteSong] = useState(false);

  useEffect(() => {
    if (currentSong) {
      checkFavoriteStatus();
    }
  }, [currentSong]);

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

  if (!currentSong) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.contentContainer} onPress={togglePlayerModal}>
        <Image source={{ uri: currentSong.image_url }} style={styles.image} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={[styles.artist, { color: theme.colors.grey3 }]} numberOfLines={1}>{currentSong.artist || 'Unknown'}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Ionicons name={isFavoriteSong ? "heart" : "heart-outline"} size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrevious}>
          <Ionicons name="play-skip-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext}>
          <Ionicons name="play-skip-forward" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setMiniPlayerVisible(false)} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      {isWebAudioMode && (
        <View style={styles.webAudioBadge}>
          <Ionicons name="globe-outline" size={16} color={theme.colors.text} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 150,
  },
  closeButton: {
    marginLeft: 10,
  },
  webAudioBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 2,
  },
});

export default MiniPlayer;