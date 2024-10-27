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



const BASE_URL = "https://studio-api.suno.ai";
const MAX_RETRY_TIMES = 5;



// Utility function to get fresh JWT from Clerk

const getFreshJWT = async () => {
  try {
    // Step 1: Fetch the Clerk session
    const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=5.26.1');
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


const __getFreshJWT = async () => {
  try {
    // First try to get session from Clerk
    const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8');
    const clerkData = await clerkResponse.json();
    
    const sessionId = clerkData.response.sessions[0].id;
    await AsyncStorage.setItem('sessionId', sessionId);
    
    // Get fresh JWT using session ID
    const touchResponse = await fetch(
      `https://clerk.suno.com/v1/client/sessions/${sessionId}/touch?_clerk_js_version=5.26.1`,
      { method: 'POST' }
    );
    const touchData = await touchResponse.json();
    const freshJWT = touchData.response.last_active_token.jwt;
    
    // Store the new JWT
    await AsyncStorage.setItem('@jwt', freshJWT);
    return freshJWT;
    
  } catch (error) {
    console.error('Error fetching fresh JWT:', error);
    // Fallback to stored JWT
    const storedJWT = await AsyncStorage.getItem('@jwt');
    if (storedJWT) {
      console.info('Using stored JWT');
      return storedJWT;
    }
    return null;
  }
};

// Utility function to create headers with JWT
const createHeaders = async () => {
  const jwt = await getFreshJWT();
  const headers = {
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  return headers;
};

// Get request with retry mechanism
const getWithRetry = async (url, retryTimes = 0) => {
  try {
    const headers = await createHeaders();
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (data.error && retryTimes < MAX_RETRY_TIMES) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getWithRetry(url, retryTimes + 1);
    }
    
    return data;
  } catch (error) {
    if (retryTimes < MAX_RETRY_TIMES) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getWithRetry(url, retryTimes + 1);
    }
    throw error;
  }
};

// POST request with retry mechanism
const postWithRetry = async (url, body, retryTimes = 0) => {
  try {
    const headers = await createHeaders();
    headers['Content-Type'] = 'application/json';
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.error && retryTimes < MAX_RETRY_TIMES) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return postWithRetry(url, body, retryTimes + 1);
    }
    
    return data;
  } catch (error) {
    if (retryTimes < MAX_RETRY_TIMES) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return postWithRetry(url, body, retryTimes + 1);
    }
    throw error;
  }
};

// Main API Functions
export const fetchSongs = async () => {
  try {
    const data = await getWithRetry(`${BASE_URL}/api/feed/`);
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

export const generateSong = async (payload) => {
  try {
    const requestIds = await postWithRetry(`${BASE_URL}/api/generate/v2/`, payload);
    if (!requestIds || !requestIds.length) {
      throw new Error('Failed to generate song request IDs');
    }
    
    // Wait for song generation to complete
    let retryTimes = 0;
    while (retryTimes <= MAX_RETRY_TIMES) {
      const metadata = await getWithRetry(`${BASE_URL}/api/feed/?ids=${requestIds.join(',')}`);
      if (metadata.some(item => item.id)) {
        return metadata;
      }
      retryTimes++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    throw new Error('Failed to retrieve song metadata');
  } catch (error) {
    console.error('Error generating song:', error);
    throw error;
  }
};

export const getSongMetadata = async (ids) => {
console.log("###ids=  ",ids)
  try {
    //const params = ids.length ? `?ids=${ids.join(",")}` : "";
const params =  `?ids=${ids}`
    return await getWithRetry(`${BASE_URL}/api/feed/${params}`);
  } catch (error) {
    console.error('Error getting song metadata:', error);
    throw error;
  }
};

export const searchSongs = async (term, fromIndex = 0, rankBy = "trending") => {
  try {
    const payload = {
      search_queries: [{
        name: `public_song${term}`,
        search_type: "public_song",
        term,
        from_index: fromIndex,
        rank_by: rankBy
      }]
    };
    
    const data = await postWithRetry(`${BASE_URL}/api/search/`, payload);
    const result = data?.result[`public_song${term}`] || {};
    return {
      from_index: result.from_index || 0,
      page_size: result.page_size || 20,
      songs: result.songs || []
    };
  } catch (error) {
    console.error('Error searching songs:', error);
    throw error;
  }
};

export const generateLyrics = async (prompt) => {
  try {
    // Request lyrics generation
    const response = await postWithRetry(`${BASE_URL}/api/generate/lyrics/`, { prompt });
    const id = response?.id;
    if (!id) throw new Error('Failed to start lyrics generation');

    // Poll for results
    let retryTimes = 0;
    while (retryTimes <= MAX_RETRY_TIMES) {
      const result = await getWithRetry(`${BASE_URL}/api/generate/lyrics/${id}`);
      if (result.status === "complete") return result;
      retryTimes++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Lyrics generation timed out');
  } catch (error) {
    console.error('Error generating lyrics:', error);
    throw error;
  }
};

export const fetchPlaylist = async (playlistId, page = 1, showTrashed = false) => {
  try {
    const data = await getWithRetry(
      `${BASE_URL}/api/playlist/${playlistId}?page=${page}&show_trashed=${showTrashed}`
    );
    
    if (playlistId === 'me') {
      return {
        playlists: data.playlists,
        num_total_results: data.num_total_results,
        current_page: data.current_page
      };
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      user_display_name: data.user_display_name,
      playlist_clips: data.playlist_clips
    };
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
};

// Additional utility functions if needed
export const getLimitLeft = async () => {
  try {
    const data = await getWithRetry(`${BASE_URL}/api/billing/info/`);
    return Math.floor(data.total_credits_left / 10);
  } catch (error) {
    console.error('Error getting limit:', error);
    throw error;
  }
};

 