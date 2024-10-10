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

const PlaylistDetailsScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentSong, isPlaying, handleSongSelect } = useContext(AudioContext);
  const { playlistId } = route.params;

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPlaylistDetails();
  }, []);

  const loadPlaylistDetails = async (nextPage = 1) => {
    try {
      setLoading(true);
      const data = await fetchPlaylist(playlistId, nextPage);
      if (data) {
        setPlaylist(data);
        if (nextPage === 1) {
          setSongs(data.playlist_clips?.map(clip => clip.clip));
        } else {
          setSongs(prevSongs => [...prevSongs, ...data.playlist_clips?.map(clip => clip.clip)]);
        }
        setHasMore(data.playlist_clips.length > 0);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading playlist details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPlaylistDetails(page + 1);
    }
  };

  const renderHeader = () => {
    if (!playlist) return null;
    return (
      <View style={styles.header}>
        <Image source={{ uri: playlist.image_url }} style={styles.playlistImage} />
        <View style={styles.playlistInfo}>
          <Text style={[styles.playlistName, { color: theme.colors.text }]}>{playlist.name}</Text>
          <Text style={[styles.playlistCreator, { color: theme.colors.grey3 }]}>
            {t('createdBy', { name: playlist.user_display_name || t('unknownUser') })}
          </Text>
          <Text style={[styles.playlistDescription, { color: theme.colors.grey3 }]}>
            {playlist.description}
          </Text>
          <Text style={[styles.playlistTracks, { color: theme.colors.grey3 }]}>
            {playlist.num_clips} {t('tracks')}
          </Text>
        </View>
      </View>
    );
  };

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
        data={songs}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            onPress={() => handleSongSelect(item, songs, songs.indexOf(item))}
            isPlaying={currentSong && currentSong.id === item.id && isPlaying}
            theme={theme}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
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
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 16,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playlistCreator: {
    fontSize: 14,
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  playlistTracks: {
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default PlaylistDetailsScreen;