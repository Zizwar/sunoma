import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

import { Text, Button, useTheme, Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fetchPlaylist } from '../utils/fetchSongs';
import { AudioContext } from '../App';

const LibraryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { currentSong, isPlaying, handleSongSelect } = useContext(AudioContext);
const route = useRoute();
  const playlistId = route.params?.id;

  
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (playlistId) {
            fetchPlaylist(playlistId).then(playlist => {
             });
    }
  }, [playlistId]);
  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const savedPlaylists = await AsyncStorage.getItem('playlists');
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists));
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      Alert.alert(t('error'), t('errorLoadingPlaylists'));
    }
  };

  const extractPlaylistId = (url) => {
    try {
      const parsedUrl = new URL(url);
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      return pathParts[pathParts.length - 1];
    } catch (error) {
      return url.trim(); // If it's not a valid URL, assume it's already an ID
    }
  };

  const addPlaylist = async () => {
    if (!newPlaylistUrl.trim()) {
      Alert.alert(t('error'), t('emptyPlaylistUrl'));
      return;
    }

    setLoading(true);
    try {
      const playlistId = extractPlaylistId(newPlaylistUrl);
      const playlistData = await fetchPlaylist(playlistId);

      if (playlistData && playlistData.id) {
        const newPlaylist = {
          id: playlistId,
          name: playlistData.name || `Playlist ${playlists.length + 1}`,
          description: playlistData.description,
          user_display_name: playlistData.user_display_name,
          image_url: playlistData.image_url,
          num_clips: playlistData.playlist_clips ? playlistData.playlist_clips.length : 0,
        };

        const updatedPlaylists = [...playlists, newPlaylist];
        await AsyncStorage.setItem('playlists', JSON.stringify(updatedPlaylists));
        setPlaylists(updatedPlaylists);
        setNewPlaylistUrl('');
        Alert.alert(t('success'), t('playlistAddedSuccess'));
      } else {
        throw new Error('Invalid playlist data');
      }
    } catch (error) {
      console.error('Error adding playlist:', error);
      Alert.alert(t('error'), t('playlistAddFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistPress = (playlist) => {
    navigation.navigate('PlaylistDetails', { playlistId: playlist.id });
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handlePlaylistPress(item)}
      style={[
        styles.playlistItem,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.grey3,
        },
      ]}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.playlistImage} />
      ) : (
        <Ionicons
          name="musical-notes"
          size={24}
          color={theme.colors.primary}
          style={styles.playlistIcon}
        />
      )}
      <View style={styles.playlistTextContainer}>
        <Text style={[styles.playlistName, { color: theme.colors.text }]}>
          {item.name || t('untitledPlaylist')}
        </Text>
        {item.num_clips !== undefined && (
          <Text style={[styles.playlistSubtext, { color: theme.colors.grey3 }]}>
            {item.num_clips} {t('tracks')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.addPlaylistContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.grey3,
            },
          ]}
          placeholder={t('enterPlaylistUrlOrId')}
          placeholderTextColor={theme.colors.grey3}
          value={newPlaylistUrl}
          onChangeText={setNewPlaylistUrl}
        />
        <TouchableOpacity
          onPress={addPlaylist}
          disabled={loading}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="add" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {playlists.length > 0 ? (
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playlistsContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="musical-notes"
            size={64}
            color={theme.colors.grey3}
          />
          <Text style={[styles.emptyText, { color: theme.colors.grey3 }]}>
            {t('noPlaylistsYet')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  addPlaylistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginRight: 8,
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
  },
  addButton: {
    padding: 10,
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistsContainer: {
    flexGrow: 1,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  playlistIcon: {
    marginRight: 12,
  },
  playlistTextContainer: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playlistSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LibraryScreen;