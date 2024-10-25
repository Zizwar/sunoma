import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "https://studio-api.suno.ai";
const PROXY_URL = "https://suno.deno.dev";

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

const getFreshJWT = async () => {
  try {
    const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8');
    const clerkData = await clerkResponse.json();
    
    // Extract the JWT directly from the first response
    const freshJWT = clerkData.response.sessions[0].last_active_token.jwt;
    
    // Store the fresh JWT
    await AsyncStorage.setItem('@jwt', freshJWT);
    console.info('New JWT stored');
    
    return freshJWT;
  } catch (error) {
    console.error('Error fetching fresh JWT:', error);
    
    const storedJWT = await AsyncStorage.getItem('@jwt');
    if (storedJWT) {
      console.info('Using stored JWT');
      return storedJWT;
    }
    
    return null;
  }
};

const createHeaders = async () => {
  const jwt = await getFreshJWT();
  return {
    'Accept-Encoding': 'gzip, deflate, br',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Authorization': jwt ? `Bearer ${jwt}` : undefined
  };
};

const makeRequest = async (endpoint, options = {}) => {
  const headers = await createHeaders();
  const activeSettings = await getActiveSettings();
  
  // Add settings to query parameters
  const queryParams = new URLSearchParams();
  if (activeSettings?.sess) queryParams.append('sess', activeSettings.sess);
  if (activeSettings?.cookie) queryParams.append('cookie', activeSettings.cookie);
  if (headers.Authorization) {
    queryParams.append('jwt', headers.Authorization.replace('Bearer ', ''));
  }
  
  // Build the URL
  const url = `${PROXY_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const fetchSongs = async () => {
  try {
    const data = await makeRequest('/all-songs');
    return data.songs.map(song => ({
      id: song.id,
      title: song.title || song.metadata.prompt || 'Untitled',
      artist: song.display_name,
      subtitle: song.metadata.tags,
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

export const generateSong = async (requestData) => {
  try {
    return await makeRequest('/generate', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  } catch (error) {
    console.error('Error generating song:', error);
    throw error;
  }
};

export const getSongMetadata = async (ids) => {
  try {
    // Using direct API URL for metadata
    const response = await fetch(`${BASE_URL}/api/feed/?ids=${ids}`, {
      headers: await createHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { metadata: data };
  } catch (error) {
    console.error('Error getting metadata:', error);
    throw error;
  }
};

export const searchSongs = async (query, style) => {
  try {
    const searchQuery = {
      search_queries: [{
        name: 'public_song',
        search_type: 'public_song',
        term: query,
        style: style,
      }]
    };

    return await makeRequest('/search', {
      method: 'POST',
      body: JSON.stringify(searchQuery)
    });
  } catch (error) {
    console.error('Error searching songs:', error);
    throw error;
  }
};

export const generateLyrics = async (prompt) => {
  try {
    // Start lyrics generation
    const initResponse = await makeRequest('/generate-lyrics', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });

    // Poll for results
    if (initResponse?.id) {
      let retries = 0;
      while (retries < 10) {
        const statusResponse = await makeRequest(`/lyrics-status/${initResponse.id}`);
        if (statusResponse.status === 'complete') {
          return statusResponse;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries++;
      }
      throw new Error('Lyrics generation timed out');
    }
    
    throw new Error('Failed to start lyrics generation');
  } catch (error) {
    console.error('Error generating lyrics:', error);
    throw error;
  }
};

export const fetchPlaylist = async (playlistId, page = 1) => {
  try {
    // Using direct API URL for playlists
    const response = await fetch(
      `${BASE_URL}/api/playlist/${playlistId}?page=${page}`,
      { headers: await createHeaders() }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (playlistId === 'me') {
      return {
        playlists: data.playlists || [],
        num_total_results: data.num_total_results || 0,
        current_page: data.current_page || page
      };
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      user_display_name: data.user_display_name,
      playlist_clips: data.playlist_clips || []
    };
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
};

// Additional utility functions
export const getLimitLeft = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/billing/info/`, {
      headers: await createHeaders()
    });
    const data = await response.json();
    return Math.floor(data.total_credits_left / 10);
  } catch (error) {
    console.error('Error getting limit:', error);
    return 0;
  }
};