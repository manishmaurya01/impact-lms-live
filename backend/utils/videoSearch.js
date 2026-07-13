/**
 * Video Search Utility
 * Finds YouTube videos for a given topic via HTML scraping.
 * 
 * NOTE: YouTube HTML scraping is fragile and may break when YouTube changes
 * their page structure. Consider using the official YouTube Data API v3 for
 * production reliability. DuckDuckGo scraping may also break over time.
 */

const SEARCH_TIMEOUT_MS = 8000; // 8 second timeout for search requests

/**
 * Fetch with a timeout to prevent hanging requests.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = SEARCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getRealYouTubeVideo(topic) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " tutorial")}`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const regex = /\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g;
    let match;
    if ((match = regex.exec(html)) !== null) {
      const id = match[1];
      return {
        title: `${topic} - YouTube Tutorial`,
        url: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        platform: 'YouTube'
      };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error("YouTube search timed out for:", topic);
    } else {
      console.error("YouTube search error:", err.message);
    }
  }
  return null;
}

async function getOtherPlatformVideo(topic) {
  try {
    const query = `site:vimeo.com OR site:dailymotion.com ${topic} tutorial`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
    const vimeoRegex = /vimeo\.com\/([0-9]{8,12})/g;
    const dmRegex = /dailymotion\.com\/video\/([a-zA-Z0-9]{6,8})/g;
    
    let match;
    if ((match = vimeoRegex.exec(html)) !== null) {
      const id = match[1];
      return {
        title: `${topic} - Vimeo`,
        url: `https://vimeo.com/${id}`,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        platform: 'Vimeo'
      };
    }
    
    if ((match = dmRegex.exec(html)) !== null) {
      const id = match[1];
      return {
        title: `${topic} - Dailymotion`,
        url: `https://www.dailymotion.com/video/${id}`,
        embedUrl: `https://www.dailymotion.com/embed/video/${id}`,
        platform: 'Dailymotion'
      };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error("DuckDuckGo search timed out for:", topic);
    } else {
      console.error("DuckDuckGo search error:", err.message);
    }
  }
  return null;
}

async function getVerifiedVideos(topic) {
  try {
    const [yt, other] = await Promise.all([
      getRealYouTubeVideo(topic),
      getOtherPlatformVideo(topic)
    ]);
    
    const list = [];
    if (yt) list.push(yt);
    if (other) list.push(other);
    
    return list;
  } catch (err) {
    console.error("Video search aggregation error:", err.message);
    return [];
  }
}

module.exports = { getVerifiedVideos };
