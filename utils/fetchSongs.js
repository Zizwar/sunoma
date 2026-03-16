import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFreshJWT } from './getJWT';

const BASE_URL = "https://studio-api.suno.ai";
const MAX_RETRY_TIMES = 5;

const getActiveSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem('settings');
    const bearerToken = await AsyncStorage.getItem('@bearer');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      const activeSetting = parsedSettings.find(setting => setting.isActive);
      if (activeSetting) return { ...activeSetting, bearerToken };
    }
    return { bearerToken };
  } catch (error) {
    return null;
  }
};

const getDefaultHeaders = (jwt = null) => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': Platform.select({
    android: 'okhttp/4.9.2',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  }),
  ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
});

const makeRequest = async (url, options = {}) => {
  const settings = await getActiveSettings();
  const jwt = await getFreshJWT();
  const headers = getDefaultHeaders(jwt);
  
  if (settings?.sess) headers.sess = settings.sess;
  if (settings?.cookie) headers.cookie = settings.cookie;
  
  const config = {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  };
  
  logRequest(options.method || 'GET', url, config.headers, options.body);
  
  let retryCount = 0;
  while (retryCount <= MAX_RETRY_TIMES) {
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Unexpected response format');
      }
      
      const text = await response.text();
      const data = JSON.parse(text);
      
      logResponse(url, data);
      return data;
      
    } catch (error) {
      if (retryCount === MAX_RETRY_TIMES) throw error;
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
};

export const fetchSongs = async () => {
  try {
    const data = await makeRequest(`${BASE_URL}/api/feed/`);
    return data.map(song => ({
      id: song.id,
      title: song.title || song.metadata?.prompt || 'Untitled',
      artist: song.display_name,
      subtitle: song.metadata?.tags,
      image_url: song.image_url,
      audio_url: song.audio_url,
      video_url: song.video_url,
      metadata: song.metadata,
    }));
  } catch (error) {
    console.error('Error fetching songs:', error);
    throw error;
  }
};

export const generateLyrics = async (prompt) => {
  const initData = await makeRequest(`${BASE_URL}/api/generate/lyrics/`, {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
  const id = initData?.id;
  if (!id) throw new Error('Failed to start lyrics generation');

  let retries = 0;
  while (retries < 10) {
    const result = await makeRequest(`${BASE_URL}/api/generate/lyrics/${id}`);
    if (result.status === 'complete') return result;
    retries++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Lyrics generation timed out');
};

export const generateSong = async (payload) => {
  return await makeRequest(`${BASE_URL}/api/generate/v2/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const getSongMetadata = async (ids) => {
  const params = ids.length ? `?ids=${ids.join(",")}` : "";
  return await makeRequest(`${BASE_URL}/api/feed/${params}`);
};

export const searchSongs = async (term, fromIndex = 0, rankBy = "trending") => {
  const payload = {
    search_queries: [{
      name: `public_song${term}`,
      search_type: "public_song",
      term,
      from_index: fromIndex,
      rank_by: rankBy
    }]
  };
  
  const data = await makeRequest(`${BASE_URL}/api/search/`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  const result = data?.result[`public_song${term}`] || {};
  return {
    from_index: result.from_index || 0,
    page_size: result.page_size || 20,
    songs: result.songs || []
  };
};

export const fetchPlaylist = async (playlistId, page = 1) => {
  const data = await makeRequest(
    `${BASE_URL}/api/playlist/${playlistId}?page=${page}`
  );
  
  return playlistId === 'me' 
    ? {
        playlists: data.playlists,
        num_total_results: data.num_total_results,
        current_page: data.current_page
      }
    : {
        id: data.id,
        name: data.name,
        description: data.description,
        image_url: data.image_url,
        user_display_name: data.user_display_name,
        playlist_clips: data.playlist_clips
      };
};

export const fetchNotifications = async () => {
  try {
    const data = await makeRequest(`${BASE_URL}/api/notifications`);
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await makeRequest(`${BASE_URL}/api/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};