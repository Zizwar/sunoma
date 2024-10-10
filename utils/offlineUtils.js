import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const OFFLINE_SONGS_KEY = '@offline_songs';
const OFFLINE_DIRECTORY = `${FileSystem.documentDirectory}offline_songs/`;

export const downloadSong = async (song) => {
  try {
    await FileSystem.makeDirectoryAsync(OFFLINE_DIRECTORY, { intermediates: true });
    const fileName = `${song.id}.mp3`;
    const fileUri = `${OFFLINE_DIRECTORY}${fileName}`;
    const downloadResult = await FileSystem.downloadAsync(song.audio_url, fileUri);

    if (downloadResult.status !== 200) {
      throw new Error('Failed to download file');
    }

    const songMetadata = {
      id: song.id,
      title: song.title || 'Untitled',
      artist: song.artist || song.display_name || 'Unknown Artist',
      image_url: song.image_url,
      localUri: fileUri,
      prompt: song.metadata?.prompt || '',
      tags: song.metadata?.tags || '',
      downloadDate: new Date().toISOString(),
    };

    const existingOfflineSongs = await getOfflineSongs();
    const updatedOfflineSongs = [...existingOfflineSongs, songMetadata];
    await AsyncStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(updatedOfflineSongs));

    Alert.alert('Success', 'Song downloaded successfully');
    return songMetadata;
  } catch (error) {
    console.error('Error downloading song:', error);
    Alert.alert('Error', 'Failed to download song. Please try again.');
    throw error;
  }
};

export const deleteOfflineSong = async (songId) => {
  try {
    const offlineSongs = await getOfflineSongs();
    const songToDelete = offlineSongs.find(song => song.id === songId);
    
    if (!songToDelete) {
      throw new Error('Song not found in offline storage');
    }

    await FileSystem.deleteAsync(songToDelete.localUri);
    const updatedOfflineSongs = offlineSongs.filter(song => song.id !== songId);
    await AsyncStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(updatedOfflineSongs));

    Alert.alert('Success', 'Song deleted from offline storage');
    return updatedOfflineSongs;
  } catch (error) {
    console.error('Error deleting offline song:', error);
    Alert.alert('Error', 'Failed to delete song. Please try again.');
    throw error;
  }
};

export const getOfflineSongs = async () => {
  try {
    const offlineSongsJson = await AsyncStorage.getItem(OFFLINE_SONGS_KEY);
    return offlineSongsJson ? JSON.parse(offlineSongsJson) : [];
  } catch (error) {
    console.error('Error getting offline songs:', error);
    return [];
  }
};

export const isSongDownloaded = async (songId) => {
  const offlineSongs = await getOfflineSongs();
  return offlineSongs.some(song => song.id === songId);
};