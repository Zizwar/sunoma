import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Text, useTheme } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { getOfflineSongs, deleteOfflineSong } from '../utils/offlineUtils';
import SongListItem from '../components/SongListItem';
import { AudioContext } from '../App';

const OfflineScreen = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [offlineSongs, setOfflineSongs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { handleSongSelect } = useContext(AudioContext);

  const loadOfflineSongs = useCallback(async () => {
    const songs = await getOfflineSongs();
    setOfflineSongs(songs);
  }, []);

  useEffect(() => {
    loadOfflineSongs();
  }, [loadOfflineSongs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOfflineSongs();
    setRefreshing(false);
  }, [loadOfflineSongs]);

  const handleDeleteSong = async (songId) => {
    try {
      const updatedSongs = await deleteOfflineSong(songId);
      setOfflineSongs(updatedSongs);
    } catch (error) {
      console.error('Error deleting song:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleSongPress = (song) => {
    handleSongSelect(song, offlineSongs, offlineSongs.indexOf(song));
  };

  const renderSongItem = ({ item }) => (
    <SongListItem
      song={item}
      onPress={() => handleSongPress(item)}
      onDelete={() => handleDeleteSong(item.id)}
      isOffline={true}
      theme={theme}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text h4 style={[styles.title, { color: theme.colors.text }]}>{t('offlineSongs')}</Text>
      <FlatList
        data={offlineSongs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.colors.grey3 }]}>
            {t('noOfflineSongs')}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default OfflineScreen;