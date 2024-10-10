import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-elements';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioContext } from '../App';
import SongListItem from '../components/SongListItem';
import SongDetailsModal from '../components/SongDetailsModal';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { handleSongSelect } = useContext(AudioContext);
  const [query, setQuery] = useState('');
  const [rankBy, setRankBy] = useState('trending');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const searchSongs = useCallback(
    async (resetResults = false) => {
      if (query.trim() === '') return;
      if (loading || (!hasMore && !resetResults)) return;

      setLoading(true);
      try {
        const activeSettings = await getActiveSettings();
        const response = await fetch(
          `https://suno.deno.dev/search?term=${encodeURIComponent(
            query
          )}&from_index=${resetResults ? 0 : page}&rank_by=${rankBy}`
        );
        const data = await response.json();

        if (data.songs.length === 0) {
          setHasMore(false);
        } else {
          setSearchResults((prevResults) =>
            resetResults ? data.songs : [...prevResults, ...data.songs]
          );
          setPage((prevPage) => (resetResults ? 20 : prevPage + 20));
        }
      } catch (error) {
        console.error('Error searching songs:', error);
      } finally {
        setLoading(false);
      }
    },
    [query, page, rankBy, loading, hasMore]
  );

  const handleSearch = useCallback(() => {
    setPage(0);
    setHasMore(true);
    searchSongs(true);
  }, [searchSongs]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      searchSongs();
    }
  };

  const handleSongPress = (song) => {
  const index = searchResults.findIndex(item => item.id === song.id);
  handleSongSelect(song, searchResults, index);
};

  const handleSongLongPress = (song) => {
    setSelectedSong(song);
    setDetailsModalVisible(true);
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <ActivityIndicator
        size="small"
        color={theme.colors.primary}
        style={styles.loaderContainer}
      />
    );
  };

  const getActiveSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('settings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        return parsedSettings.find((setting) => setting.isActive);
      }
    } catch (error) {
      console.error('Error getting active settings:', error);
    }
    return null;
  };

  const FilterButton = ({ title, value, icon }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        rankBy === value && styles.activeFilterButton,
      ]}
      onPress={() => {
        setRankBy(value);
        handleSearch();
      }}>
      <Ionicons
        name={icon}
        size={18}
        color={rankBy === value ? theme.colors.primary : theme.colors.text}
      />
      <Text
        style={[
          styles.filterButtonText,
          {
            color: rankBy === value ? theme.colors.primary : theme.colors.text,
          },
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={24}
          color={theme.colors.grey3}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.input,
            { color: theme.colors.text, backgroundColor: theme.colors.grey5 },
          ]}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={theme.colors.grey3}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={24}
              color={theme.colors.grey3}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
     <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <FilterButton
          title={t('trending')}
          value="trending"
          icon="trending-up"
        />
        <FilterButton
          title={t('mostRelevant')}
          value="most_relevant"
          icon="star"
        />
        <FilterButton 
          title={t('mostRecent')} 
          value="most_recent" 
          icon="time" 
        />
      </ScrollView>    
  </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongListItem
            song={item}
            onPress={() => handleSongPress(item)}
            onLongPress={() => handleSongLongPress(item)}
            theme={theme}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="musical-notes"
              size={64}
              color={theme.colors.grey3}
            />
            <Text style={[styles.emptyText, { color: theme.colors.grey3 }]}>
              {t('noResultsFound')}
            </Text>
          </View>
        )}
      />

      <SongDetailsModal
        visible={detailsModalVisible}
        song={selectedSong}
        onClose={() => setDetailsModalVisible(false)}
        navigation={navigation}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 25,
    overflow: 'hidden',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 40,
    borderRadius: 25,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10, // Add some space between buttons
  },
  activeFilterButton: {
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderColor: '#1DB954',
  },
  filterButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  loaderContainer: {
    marginVertical: 20,
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

export default SearchScreen;