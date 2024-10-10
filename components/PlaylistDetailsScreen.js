import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, useTheme } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fetchPlaylist } from '../utils/fetchSongs';
import { AudioContext } from '../App';
import SongListItem from '../components/SongListItem';
import SongDetailsModal from '../components/SongDetailsModal';

const PlaylistDetailsScreen = ({ route, navigation }) => {
  const { playlistId } = route.params;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentSong, isPlaying, handleSongSelect } = useContext(AudioContext);

  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const loadPlaylist = async () => {
    try {
      setRefreshing(true);
      const data = await fetchPlaylist(playlistId);
      if (data) {
        setPlaylistInfo({
          id: data.id,
          name: data.name,
          description: data.description,
          image_url: data.image_url,
          user_display_name: data.user_display_name,
          num_clips: data.playlist_clips?.length,
        });
        setSongs(data.playlist_clips?data.playlist_clips.map((item) => item.clip):{});
      } else {
        console.error('Invalid playlist data:', data);
        Alert.alert(t('error'), t('invalidPlaylistData'));
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      Alert.alert(t('error'), t('playlistLoadFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSongPress = (song) => {
    handleSongSelect(song, songs, songs.indexOf(song));
  };

  const handleSongLongPress = (song) => {
    setSelectedSong(song);
    setDetailsModalVisible(true);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Image source={{ uri: playlistInfo?.image_url }} style={styles.playlistImage} />
      <View style={styles.playlistInfoContainer}>
        <Text style={[styles.playlistName, { color: theme.colors.text }]}>{playlistInfo?.name}</Text>
        <Text style={[styles.playlistDescription, { color: theme.colors.grey3 }]}>
          {playlistInfo?.description}
        </Text>
        <Text style={[styles.playlistCreator, { color: theme.colors.grey3 }]}>
          {t('createdBy', { name: playlistInfo?.user_display_name || t('unknownUser') })}
        </Text>
        <Text style={[styles.playlistTracks, { color: theme.colors.grey3 }]}>
          {playlistInfo?.num_clips} {t('tracks')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={songs}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            onPress={() => handleSongPress(item)}
            onLongPress={() => handleSongLongPress(item)}
            isPlaying={currentSong && currentSong.id === item.id && isPlaying}
            theme={theme}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadPlaylist}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="musical-notes"
              size={64}
              color={theme.colors.grey3}
            />
            <Text style={[styles.emptyText, { color: theme.colors.grey3 }]}>
              {t('noSongsInPlaylist')}
            </Text>
          </View>
        )}
      />

      <SongDetailsModal
        visible={detailsModalVisible}
        song={selectedSong}
        onClose={() => setDetailsModalVisible(false)}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  playlistImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  playlistInfoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  playlistCreator: {
    fontSize: 14,
    marginBottom: 4,
  },
  playlistTracks: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
  },
});

export default PlaylistDetailsScreen;