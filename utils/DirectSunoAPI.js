import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFreshJWT as getSharedJWT } from './getJWT';

const BASE_URL = "https://studio-api.suno.ai";
const MAX_RETRY_TIMES = 5;

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
async getFreshJWT() {
    const jwt = await getSharedJWT();
    if (jwt) this.headers.Authorization = `Bearer ${jwt}`;
    return jwt;
  }
  async refreshAuth() {
    await this.getFreshJWT();
  }

  async getNewJWTFromClerk() {
    return this.getFreshJWT();
  }

  async ensureAuth() {
    if (!this.headers.Authorization) {
      await this.refreshAuth();
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const JWT = await this.getFreshJWT();
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
    return this.getFreshJWT();
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