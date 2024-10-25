import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = "https://studio-api.suno.ai";
const MAX_RETRY_TIMES = 5;

// Simple logging for requests and responses only
const logRequest = (method, url, headers, body) => {
  console.warn('🌐 Request:', { method, url, headers, body });
};

const logResponse = (url, data) => {
  console.log('📥 Response:', { url, data });
};

// Get active settings with bearer token
const getActiveSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem('settings');
    const bearerToken = await AsyncStorage.getItem('@bearer');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      const activeSetting = parsedSettings.find(setting => setting.isActive);
      if (activeSetting) {
        return { ...activeSetting, bearerToken };
      }
    }
    return { bearerToken };
  } catch (error) {
    console.error('Error getting active settings:', error);
    return null;
  }
};

const getDefaultHeaders = (jwt = null) => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': Platform.select({
    android: 'okhttp/4.9.2',
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
  }),
  ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
});

const getFreshJWT = async () => {
  try {
    // First get the session ID
    const clerkResponse = await fetch(
      'https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8',
      { headers: getDefaultHeaders() }
    );
    
    if (!clerkResponse.ok) {
      throw new Error(`Clerk response not OK: ${clerkResponse.status}`);
    }
    
    const clerkData = await clerkResponse.json();
    const sessionId = clerkData.response.sessions[0].id;
    await AsyncStorage.setItem('sessionId', sessionId);
    
    // Then get the JWT
    const touchResponse = await fetch(
      `https://clerk.suno.com/v1/client/sessions/${sessionId}/touch?_clerk_js_version=5.26.1`,
      {
        method: 'POST',
        headers: getDefaultHeaders()
      }
    );
    
    if (!touchResponse.ok) {
      throw new Error(`Touch response not OK: ${touchResponse.status}`);
    }
    
    const touchData = await touchResponse.json();
    const jwt = touchData.response.last_active_token.jwt;
    
    await AsyncStorage.setItem('@jwt', jwt);
    return jwt;
    
  } catch (error) {
    console.error('Error getting fresh JWT:', error);
    const storedJWT = await AsyncStorage.getItem('@jwt');
    if (storedJWT) return storedJWT;
    return null;
  }
};

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

// ... [Rest of the API functions remain the same]

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