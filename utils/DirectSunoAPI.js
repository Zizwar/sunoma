import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "https://studio-api.suno.ai";
const MAX_RETRY_TIMES = 5;
const VERSION_CLERK = "5.15.0";

class DirectSunoAPI {
  constructor() {
    this.headers = {
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    };
    this.retryTime = 0;
    this.authUpdateTime = null;
  }

  async init() {
    await this.refreshAuth();
  }
async getFreshJWT()  {
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
    this.headers.Authorization = `Bearer ${freshJWT}`;
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
  async refreshAuth() {
    // First, try to get the stored JWT
    const storedJWT = await AsyncStorage.getItem('@jwt');
    if (storedJWT) {
      this.headers.Authorization = `Bearer ${storedJWT}`;
      console.info('Using stored JWT');
      return;
    }

    // If no stored JWT, then try to get from Clerk
    await this.getNewJWTFromClerk();
  }

  async getNewJWTFromClerk() {
    try {
      // First attempt to get Clerk session
      const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8');
      const clerkData = await clerkResponse.json();
      
      // Extract and store session ID
      const sessionId = clerkData.response.sessions[0].id;
      await AsyncStorage.setItem('sunoSession', sessionId);
      
      console.info("Got session ID:", sessionId);

      // Get JWT using the session ID
      const touchResponse = await fetch(
        `https://clerk.suno.com/v1/client/sessions/${sessionId}/touch?_clerk_js_version=5.26.1`,
        {
          method: "POST",
        }
      );
      const touchData = await touchResponse.json();
      
      const newJWT = touchData.response.last_active_token.jwt;
      if (newJWT) {
        this.headers.Authorization = `Bearer ${newJWT}`;
        await AsyncStorage.setItem('@jwt', newJWT);
        console.info('Got new JWT from Clerk');
      } else {
        throw new Error('No JWT in Clerk response');
      }
    } catch (error) {
      console.error("Error getting new JWT from Clerk:", error);
      throw error;
    }
  }

  async ensureAuth() {
    if (!this.headers.Authorization) {
      await this.refreshAuth();
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
        const JWT = this.getFreshJWT();
    //await this.ensureAuth();
    this.headers.Authorization = `Bearer ${JWT}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // If unauthorized, try to refresh the token once
      await this.getNewJWTFromClerk();
      
      // Retry the request with the new token
      return await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });
    }

    return response;
  }

  async touch() {
    try {
      // First attempt to get Clerk session
      const clerkResponse = await fetch('https://clerk.suno.com/v1/client?_clerk_js_version=4.73.8');
      const clerkData = await clerkResponse.json();
      const sessionId = clerkData.response.sessions[0].id;

      const touchResponse = await fetch(
        `https://clerk.suno.com/v1/client/sessions/${sessionId}/touch?_clerk_js_version=5.26.1`,
        {
          method: "POST",
        }
      );
      
      if (!touchResponse.ok) throw new Error("Failed to get touch clerk");
      const data = await touchResponse.json();
      
      // Store JWT from touch response
      const jwt = data.response.last_active_token.jwt;
      if (jwt) {
        await AsyncStorage.setItem('@jwt', jwt);
      }
      
      return data;
    } catch (error) {
      console.error("Error in touch:", error);
      throw error;
    }
  }

  async playlist(id, page = 1, show_trashed = false) {
    const response = await this.makeAuthenticatedRequest(
      `${BASE_URL}/api/playlist/${id}?page=${page}&show_trashed=${show_trashed}`
    );
    const data = await response.json();
    
    if (id === 'me') {
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
  }

  async getCreatorInfo(id) {
    const response = await this.makeAuthenticatedRequest(
      `${BASE_URL}/api/user/get-creator-info/${id}`
    );
    return await response.json();
  }

  async getLimitLeft() {
    const response = await this.makeAuthenticatedRequest(`${BASE_URL}/api/billing/info/`);
    const data = await response.json();
    return Math.floor(data.total_credits_left / 10);
  }

  async getRequestIds(payload) {
    if (!payload) throw new Error("Payload is required");
    const response = await this.makeAuthenticatedRequest(`${BASE_URL}/api/generate/v2/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Error response ${response.status}`);
    return await response.json();
  }

  async getMetadata(ids = []) {
    const params = ids.length ? `?ids=${ids.join(",")}` : "";
    let retryTimes = 0;

    while (retryTimes <= MAX_RETRY_TIMES) {
      const response = await this.makeAuthenticatedRequest(`${BASE_URL}/api/feed/${params}`);
      const data = await response.json();
      if (data.some((item) => item.id)) {
        return data;
      }

      retryTimes += 1;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("Failed to retrieve song metadata");
  }

  async generateSongs(payload) {
    const requestIds = await this.getRequestIds(payload);
    return await this.getMetadata(requestIds);
  }

  async getAllSongs() {
    return await this.getMetadata();
  }

  async search(payload) {
    const { term = "", from_index = 0, rank_by = "trending", search_type = "public_song" } = payload;
    const name = search_type + term;
    
    const processedPayload = {
      search_queries: [{
        name,
        search_type,
        term,
        from_index,
        rank_by
      }]
    };

    const response = await this.makeAuthenticatedRequest(`${BASE_URL}/api/search/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(processedPayload),
    });

    const data = await response.json();
    const { result } = data;
    const searchResult = result[name] || {};
    const { from_index: resultFromIndex = 0, page_size = 20, songs = [] } = searchResult;

    return { from_index: resultFromIndex, page_size, songs };
  }

  async generateLyrics(prompt) {
    const response = await this.makeAuthenticatedRequest(`${BASE_URL}/api/generate/lyrics/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    
    const data = await response.json();
    const id = data?.id;
    if (!id) throw new Error('No lyrics generation ID received');

    while (true) {
      const response = await this.makeAuthenticatedRequest(`${BASE_URL}/api/generate/lyrics/${id}`);
      const result = await response.json();
      if (result.status === "complete") return result;
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  async getSongBuffer(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download file from ${url}`);
    return await response.arrayBuffer();
  }
}

export default new DirectSunoAPI();