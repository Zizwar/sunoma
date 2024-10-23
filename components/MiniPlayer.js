import React, { useContext, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioContext } from '../App';
import { useTheme } from 'react-native-elements';
import { toggleFavorite, getFavorites } from '../utils/favoriteUtils';

const ScrollingText = ({ text, style }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    let animation;
    if (containerRef.current && textRef.current) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -100,
            duration: 8000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      );
      animation.start();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [text]);

  return (
    <View ref={containerRef} style={{ width: '100%', overflow: 'hidden' }}>
      <Animated.Text
       ref={textRef} style={[ style,
        { transform: [{ translateX }], 
      width: 200,
      
        }, 
        ]} 
        ellipsizeMode='clip'   
        numberOfLines={1}     
        > 
        {text}
         </Animated.Text>
    </View>
  );
};

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
          <ScrollingText
            text={currentSong.title}
            style={[styles.title, { color: theme.colors.text }]}
          />
          <Text style={[styles.artist, { color: theme.colors.grey3 }]} numberOfLines={1}>
            {currentSong.artist || 'Unknown'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={handleToggleFavorite} style={styles.iconButton}>
          <Ionicons name={isFavoriteSong ? "heart" : "heart-outline"} size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrevious} style={styles.iconButton}>
          <Ionicons name="play-skip-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause} style={styles.iconButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.iconButton}>
          <Ionicons name="play-skip-forward" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setMiniPlayerVisible(false)} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={theme.colors.text} />
      </TouchableOpacity>
      {isWebAudioMode && (
        <View style={styles.webAudioBadge}>
          <Ionicons name="globe-outline" size={14} color={theme.colors.text} />
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
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    height: 56, // Fixed height
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: '40%', // Limit text container width
    overflow: 'hidden',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  artist: {
    fontSize: 11,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  closeButton: {
    padding: 4,
    marginLeft: 2,
  },
  webAudioBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 2,
  },
});

export default MiniPlayer;