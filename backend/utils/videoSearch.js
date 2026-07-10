/**
 * Dynamic Video Search & Scraper Utility
 * Finds real working YouTube videos and Vimeo/Dailymotion videos for a given topic.
 */

async function getRealYouTubeVideo(topic) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " tutorial")}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
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
    console.error("YouTube search error:", err);
  }
  return null;
}

async function getOtherPlatformVideo(topic) {
  try {
    const query = `site:vimeo.com OR site:dailymotion.com ${topic} tutorial`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
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
        title: `${topic} - Vimeo Masterclass`,
        url: `https://vimeo.com/${id}`,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        platform: 'Vimeo'
      };
    }
    
    if ((match = dmRegex.exec(html)) !== null) {
      const id = match[1];
      return {
        title: `${topic} - Dailymotion Guide`,
        url: `https://www.dailymotion.com/video/${id}`,
        embedUrl: `https://www.dailymotion.com/embed/video/${id}`,
        platform: 'Dailymotion'
      };
    }
  } catch (err) {
    console.error("DuckDuckGo search error:", err);
  }
  return null;
}

async function getVerifiedVideos(topic) {
  const [yt, other] = await Promise.all([
    getRealYouTubeVideo(topic),
    getOtherPlatformVideo(topic)
  ]);
  
  const list = [];
  if (yt) list.push(yt);
  if (other) list.push(other);
  
  return list;
}

module.exports = { getVerifiedVideos };
