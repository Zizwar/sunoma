import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites';

export const toggleFavorite = async (song) => {
  try {
    const favorites = await getFavorites();
    const index = favorites.findIndex(fav => fav.id === song.id);
    
    if (index !== -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push({
        id: song.id,
        title: song.title,
        artist: song.artist,
        audio_url: song.audio_url,
        image_url: song.image_url,
        duration: song.duration,
        // Add any other necessary fields here
      });
    }

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return index === -1;
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

export const getFavorites = async () => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? JSON.parse(favoritesJson) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const removeFavorite = async (id) => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
};

export const updateFavoritesOrder = async (newOrder) => {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newOrder));
  } catch (error) {
    console.error('Error updating favorites order:', error);
  }
};