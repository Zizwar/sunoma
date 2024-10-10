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

const appendAuthParams = (url, settings) => {
  const params = new URLSearchParams();
  if (settings.sess) params.append('sess', settings.sess);
  if (settings.cookie) params.append('cookie', settings.cookie);
  if (settings.bearerToken) params.append('jwt', settings.bearerToken);
  return url + (url.includes('?') ? '&' : '?') + params.toString();
};

export const fetchSongs = async () => {
  try {
    const activeSettings = await getActiveSettings();
    let url = 'https://suno.deno.dev/all-songs';
    url = appendAuthParams(url, activeSettings);
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
    url = appendAuthParams(url, activeSettings);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeSettings.bearerToken}`
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
    url = appendAuthParams(url, activeSettings);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${activeSettings.bearerToken}`
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
    url = appendAuthParams(url, activeSettings);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${activeSettings.bearerToken}`
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
    url = appendAuthParams(url, activeSettings);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeSettings.bearerToken}`
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
    url = appendAuthParams(url, activeSettings);
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${activeSettings.bearerToken}`
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

