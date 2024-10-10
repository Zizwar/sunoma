import React, { useContext, useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Icon, useTheme } from 'react-native-elements';
import { AudioContext } from '../App';
import SongListItem from '../components/SongListItem';
import SongDetailsModal from '../components/SongDetailsModal';
import { fetchSongs } from '../utils/fetchSongs';
import { useRoute } from '@react-navigation/native';

import { getSongMetadata } from '../utils/fetchSongs';
const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { handleSongSelect } = useContext(AudioContext);
  const [songs, setSongs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
const route = useRoute();
  const songId = route.params?.id;
  const { setCurrentSong, setMiniPlayerVisible, togglePlayerModal } = useContext(AudioContext);

  useEffect(() => {
    if (songId) {
      getSongMetadata(songId).then(metadata => {
        if (metadata) {
          setCurrentSong(metadata);
          setMiniPlayerVisible(true);
          togglePlayerModal();
        }
      });
    }
  }, [songId]);
  
  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      setRefreshing(true);
      const data = await fetchSongs();
      setSongs(data);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading songs:', error);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadSongs();
  };

  const handleSongPress = (song, index) => {
    handleSongSelect(song, songs, index);
  };

  const handleSongLongPress = (song) => {
    setSelectedSong(song);
    setDetailsModalVisible(true);
  };

  const renderSongItem = ({ item, index }) => (
    <SongListItem
      song={item}
      onPress={() => handleSongPress(item, index)}
      onLongPress={() => handleSongLongPress(item)}
      theme={theme}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={songs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      />

      <SongDetailsModal
        visible={detailsModalVisible}
        song={selectedSong}
        onClose={() => setDetailsModalVisible(false)}
        navigation={navigation}
        theme={theme}
      />

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('Create')}
      >
        <Icon name="add" color="#fff" />
        <Text style={styles.createButtonText}>Create New Song</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  createButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default HomeScreen;