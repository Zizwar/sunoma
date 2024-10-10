import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, useTheme } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fetchPlaylist } from '../utils/fetchSongs';
import { AudioContext } from '../App';
import SongListItem from '../components/SongListItem';

const MeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentSong, isPlaying, handleSongSelect } = useContext(AudioContext);

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async (nextPage = 1) => {
    try {
      setLoading(true);
      const data = await fetchPlaylist('me', nextPage);
      if (data && data.playlists) {
        if (nextPage === 1) {
          setPlaylists(data.playlists);
        } else {
          setPlaylists(prevPlaylists => [...prevPlaylists, ...data.playlists]);
        }
        setHasMore(data.playlists.length > 0);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPlaylists(page + 1);
    }
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PlaylistDetails', { playlistId: item.id })}
      style={[
        styles.playlistItem,
        { backgroundColor: theme.colors.background, borderColor: theme.colors.grey3 },
      ]}
    >
      <Image source={{ uri: item.image_url }} style={styles.playlistImage} />
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistName, { color: theme.colors.text }]}>{item.name}</Text>
        <Text style={[styles.playlistTracks, { color: theme.colors.grey3 }]}>
          {item.playlist_clips?.length || 0} {t('tracks')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={playlists}
        renderItem={renderPlaylistItem}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playlistItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playlistTracks: {
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default MeScreen;