import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, Overlay, useTheme } from 'react-native-elements';
import { AudioContext } from '../App';
import { useNavigation } from '@react-navigation/native';
import { toggleFavorite, isFavorite } from '../utils/favoriteUtils';
import { downloadSong, isSongDownloaded, deleteOfflineSong } from '../utils/offlineUtils';
const SongListItem = ({ song, onPress, onLongPress, isOffline, onDelete }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { currentSong, isPlaying, handlePlayPause } = useContext(AudioContext);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [isFavoriteSong, setIsFavoriteSong] = useState(false);

  const isCurrentSong = currentSong && currentSong.id === song.id;

  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    checkFavoriteStatus();
    checkDownloadStatus();
  }, [song]);

  const checkDownloadStatus = async () => {
    const downloaded = await isSongDownloaded(song.id);
    setIsDownloaded(downloaded);
  };

  const handleDownload = async () => {
    try {
      if (!isDownloaded) {
        await downloadSong(song);
        setIsDownloaded(true);
      } else {
        await deleteOfflineSong(song.id);
        setIsDownloaded(false);
        if (onDelete) onDelete();
      }
    } catch (error) {
      console.error('Error handling download/delete:', error);
    }
    setOptionsVisible(false);
  };

  const checkFavoriteStatus = async () => {
    const favoriteStatus = await isFavorite(song.id);
    setIsFavoriteSong(favoriteStatus);
  };

  const toggleOptions = () => {
    setOptionsVisible(!optionsVisible);
  };

  const handlePlay = async () => {
    if (isCurrentSong) {
      await handlePlayPause();
    } else {
      await onPress();
    }
    setOptionsVisible(false);
  };

  const handleShare = () => {
    // Implement share functionality
    console.log('Share song:', song.title);
    setOptionsVisible(false);
  };

  const handleEdit = () => {
    navigation.navigate('Create', { song: song });
    setOptionsVisible(false);
  };

  const handleInfo = () => {
    // Navigate to song details or show details modal
    console.log('Show info for:', song.title);
    setOptionsVisible(false);
  };

  const handleContinue = () => {
    navigation.navigate('Create', {
      song: song,
      continueClip: {
        id: song.id,
        time: Math.floor(song.metadata?.duration || 0),
        audioUrl: song.audio_url
      }
    });
    setOptionsVisible(false);
  };

  const handleToggleFavorite = async () => {
    const newFavoriteStatus = await toggleFavorite(song);
    setIsFavoriteSong(newFavoriteStatus);
    setOptionsVisible(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setOptionsVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity style={styles.songInfo} onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: song.image_url }} style={styles.image} />
          <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
            <Icon
              name={isCurrentSong && isPlaying ? "pause" : "play-arrow"}
              type="material"
              color={theme.colors.white}
              size={30}
              containerStyle={styles.playIcon}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {song.title || 'Untitled'}
          </Text>
          <Text style={[styles.artist, { color: theme.colors.grey3 }]} numberOfLines={1}>
            {song.artist || song.display_name || 'Unknown Artist'}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionsButton} onPress={toggleOptions}>
        <Icon
          name="more-vert"
          type="material"
          color={theme.colors.text}
          size={24}
        />
      </TouchableOpacity>

      <Overlay
        isVisible={optionsVisible}
        onBackdropPress={toggleOptions}
        overlayStyle={[styles.optionsOverlay, { backgroundColor: theme.colors.background }]}
      >
        <TouchableOpacity style={styles.optionItem} onPress={handlePlay}>
          <Icon name={isCurrentSong && isPlaying ? "pause" : "play-arrow"} type="material" color={theme.colors.text} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>{isCurrentSong && isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionItem} onPress={handleToggleFavorite}>
          <Icon name={isFavoriteSong ? "favorite" : "favorite-border"} type="material" color={theme.colors.text} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>{isFavoriteSong ? 'Remove from Favorites' : 'Add to Favorites'}</Text>
        </TouchableOpacity>
             <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
        <Icon
          name={isDownloaded ? "cloud-done" : "cloud-download"}
          type="material"
          color={theme.colors.primary}
          size={24}
        />
      </TouchableOpacity>
        <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
          <Icon name="share" type="material" color={theme.colors.text} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Share</Text>
        </TouchableOpacity>
        {!isOffline && (
          <TouchableOpacity style={styles.optionItem} onPress={handleEdit}>
            <Icon name="edit" type="material" color={theme.colors.text} />
            <Text style={[styles.optionText, { color: theme.colors.text }]}>Edit</Text>
          </TouchableOpacity>
        )}
        {!isOffline && (
          <TouchableOpacity style={styles.optionItem} onPress={handleContinue}>
            <Icon name="playlist-add" type="material" color={theme.colors.text} />
            <Text style={[styles.optionText, { color: theme.colors.text }]}>Continue Song</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.optionItem} onPress={handleInfo}>
          <Icon name="info" type="material" color={theme.colors.text} />
          <Text style={[styles.optionText, { color: theme.colors.text }]}>Info</Text>
        </TouchableOpacity>
        {isOffline && (
          <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
            <Icon name="delete" type="material" color={theme.colors.error} />
            <Text style={[styles.optionText, { color: theme.colors.error }]}>Delete from Offline</Text>
          </TouchableOpacity>
        )}
      </Overlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  playIcon: {
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
  },
  optionsButton: {
    padding: 5,
  },
  optionsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  optionText: {
    marginLeft: 20,
    fontSize: 16,
  },
  downloadButton: {
    padding: 5,
    marginLeft: 10,
  },
});

export default SongListItem;