import AsyncStorage from '@react-native-async-storage/async-storage';

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



// Updated function to get fresh JWT from Clerk or use stored JWT
const getFreshJWT = async () => {
  try {
    // Step 1: Fetch the Clerk session
    const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8');
    const clerkData = await clerkResponse.json();
    
    // Extract the session ID
    const sessionId = clerkData.response.sessions[0].id;
const freshJWT = clerkData.response.sessions[0].last_active_token.jwt;
    // Step 2: Use the session ID to fetch user data and get fresh JWT
    /*
    const touchResponse = await fetch(`https://clerk.suno.com/v1/client/sessions/${sessionId}/touch?_clerk_js_version=5.26.1`, {
      method: 'POST',
    });
    const touchData = await touchResponse.json();
    
    // Extract JWT
    const freshJWT = touchData.response.last_active_token.jwt;
  */  
    // Store the fresh JWT
    await AsyncStorage.setItem('@jwt', freshJWT);
    
    return freshJWT;
  } catch (error) {
    console.error('Error fetching fresh JWT:', error);
    
    // If fetching fresh JWT fails, try to get the stored JWT
    const storedJWT = await AsyncStorage.getItem('@jwt');
    if (storedJWT) {
      console.info('Using stored JWT');
      return storedJWT;
    }
    
    return null;
  }
};

const appendAuthParams = async (url, settings) => {
  const params = new URLSearchParams();
  if (settings.sess) params.append('sess', settings.sess);
  if (settings.cookie) params.append('cookie', settings.cookie);
  
  // Get fresh JWT or use stored JWT
  const jwt = await getFreshJWT();
  if (jwt) {
    params.append('jwt', jwt);
  }
  
  return url + (url.includes('?') ? '&' : '?') + params.toString();
};

export const fetchSongs = async () => {
  try {
    const activeSettings = await getActiveSettings();
    let url = 'https://suno.deno.dev/all-songs';
    url = await appendAuthParams(url, activeSettings || {});
    const response = await fetch(url);
    const data = await response.json();
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
    const activeSettings = await getActiveSettings();
    let url = 'https://suno.deno.dev/generate';
    url = await appendAuthParams(url, activeSettings || {});
    const jwt = await getFreshJWT();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(requestData),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const getSongMetadata = async (ids) => {
  try {
    const activeSettings = await getActiveSettings();
    let url = `https://suno.deno.dev/metadata?ids=${ids}`;
    url = await appendAuthParams(url, activeSettings || {});
    const jwt = await getFreshJWT();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const searchSongs = async (query, style) => {
  try {
    const activeSettings = await getActiveSettings();
    let url = `https://suno.deno.dev/search?query=${encodeURIComponent(query)}&style=${encodeURIComponent(style)}`;
    url = await appendAuthParams(url, activeSettings || {});
    const jwt = await getFreshJWT();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error searching songs:', error);
    throw error;
  }
};

export const generateLyrics = async (prompt) => {
  try {
    const activeSettings = await getActiveSettings();
    let url = `https://suno.deno.dev/generate-lyrics`;
    url = await appendAuthParams(url, activeSettings || {});
    const jwt = await getFreshJWT();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({ prompt }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating lyrics:', error);
    throw error;
  }
};

export const fetchPlaylist = async (playlistId, page = 1) => {
  try {
    const activeSettings = await getActiveSettings();
    let url = `https://suno.deno.dev/playlist?id=${playlistId}&page=${page}`;
    url = await appendAuthParams(url, activeSettings || {});
    const jwt = await getFreshJWT();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    const data = await response.json();
    
    if (playlistId === 'me') {
      return {
        playlists: data.playlists,
        num_total_results: data.num_total_results,
        current_page: data.current_page
      };
    } else {
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        image_url: data.image_url,
        user_display_name: data.user_display_name,
        playlist_clips: data.playlist_clips
      };
    }
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
};

// Comment: The main changes are in the getFreshJWT function.
// We now store the JWT in AsyncStorage after fetching it from Clerk.
// If fetching from Clerk fails, we attempt to use the stored JWT as a fallback.
// This ensures we always have a JWT to use, improving reliability and performance.