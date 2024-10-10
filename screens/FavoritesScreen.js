import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { Icon, useTheme } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AudioManager from '../utils/AudioManager';
import { getFavorites, removeFavorite, updateFavoritesOrder } from '../utils/favoriteUtils';
import { AudioContext } from '../App';

const FavoritesScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const { handleSongSelect, currentSong, isPlaying } = useContext(AudioContext);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const favoriteSongs = await getFavorites();
    setFavorites(favoriteSongs);
  };

  const handleRemoveFavorite = async (id) => {
    await removeFavorite(id);
    loadFavorites();
  };

  const handlePlayPause = (song, index) => {
    if (currentSong && currentSong.id === song.id) {
      AudioManager.playPause();
    } else {
      handleSongSelect(song, favorites, index);
    }
  };

  const renderItem = ({ item, index, drag, isActive }: RenderItemParams<any>) => {
    const isCurrentSong = currentSong && currentSong.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.songItem,
          { backgroundColor: isActive ? theme.colors.grey5 : theme.colors.background }
        ]}
        onLongPress={drag}
      >
        <TouchableOpacity onPressIn={drag}>
          <Icon name="drag-handle" type="material" color={theme.colors.grey3} />
        </TouchableOpacity>
        <Image source={{ uri: item.image_url }} style={styles.songImage} />
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.songArtist, { color: theme.colors.grey3 }]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handlePlayPause(item, index)}>
          <Icon
            name={isCurrentSong && isPlaying ? "pause" : "play-arrow"}
            type="material"
            color={theme.colors.primary}
            size={30}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)}>
          <Icon name="delete" type="material" color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const onDragEnd = ({ data }) => {
    setFavorites(data);
    updateFavoritesOrder(data);
    AudioManager.setPlaylist(data);
  };



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.header, { color: theme.colors.text }]}>{t('favorites')}</Text>
        {favorites.length > 0 ? (
          <DraggableFlatList
            data={favorites}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onDragEnd={onDragEnd}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon
              name="favorite-border"
              type="material"
              size={64}
              color={theme.colors.grey3}
            />
            <Text style={[styles.emptyText, { color: theme.colors.grey3 }]}>{t('noFavorites')}</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    flexGrow: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  songArtist: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
  },
});

export default FavoritesScreen;