import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface CloudSyncRecord {
  userId: string;
  encryptedPayload: string;
  iv: string;
  salt: string;
  checksum: string;
  version: number;
  timestamp: number;
  clientInfo?: string;
}

// In-memory cloud sync vault storage
const cloudSyncVault: Map<string, CloudSyncRecord> = new Map();
const syncHistory: Map<string, CloudSyncRecord[]> = new Map();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      os: "ObsidianOS Cloud Backend",
      version: "2.4.0",
      timestamp: Date.now(),
      vaultCount: cloudSyncVault.size,
    });
  });

  // Cloud Sync: Push encrypted vault data
  app.post("/api/sync/push", (req, res) => {
    try {
      const { userId, encryptedPayload, iv, salt, checksum, clientInfo } = req.body;

      if (!userId || !encryptedPayload) {
        return res.status(400).json({ error: "Missing required sync payload parameters (userId, encryptedPayload)" });
      }

      const existing = cloudSyncVault.get(userId);
      const version = existing ? existing.version + 1 : 1;
      const record: CloudSyncRecord = {
        userId,
        encryptedPayload,
        iv: iv || "",
        salt: salt || "",
        checksum: checksum || "",
        version,
        timestamp: Date.now(),
        clientInfo: clientInfo || "ObsidianOS Web Client",
      };

      cloudSyncVault.set(userId, record);

      // Keep last 10 history points for backup restore
      const userHistory = syncHistory.get(userId) || [];
      userHistory.unshift(record);
      if (userHistory.length > 10) userHistory.pop();
      syncHistory.set(userId, userHistory);

      return res.json({
        success: true,
        message: "Cloud-Synchronisation erfolgreich verschlüsselt gespeichert",
        version,
        timestamp: record.timestamp,
        payloadSize: encryptedPayload.length,
      });
    } catch (err: any) {
      console.error("Sync push error:", err);
      return res.status(500).json({ error: "Cloud sync push failed", details: err?.message });
    }
  });

  // Cloud Sync: Pull encrypted vault data
  app.get("/api/sync/pull/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const record = cloudSyncVault.get(userId);

      if (!record) {
        return res.status(404).json({
          found: false,
          message: "Keine Cloud-Sicherungsdaten für diesen Benutzer gefunden",
        });
      }

      return res.json({
        found: true,
        record,
      });
    } catch (err: any) {
      console.error("Sync pull error:", err);
      return res.status(500).json({ error: "Cloud sync pull failed", details: err?.message });
    }
  });

  // Cloud Sync: Get sync history & restore points
  app.get("/api/sync/history/:userId", (req, res) => {
    const { userId } = req.params;
    const history = syncHistory.get(userId) || [];
    res.json({
      userId,
      count: history.length,
      history: history.map((h) => ({
        version: h.version,
        timestamp: h.timestamp,
        size: h.encryptedPayload.length,
        checksum: h.checksum.substring(0, 12) + "...",
      })),
    });
  });

  // Safe Web Proxy Endpoint for the OS Web Browser
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Parameter 'url' is required.");
    }

    try {
      let formattedUrl = targetUrl;
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl;
      }

      const parsed = new URL(formattedUrl);
      // Disallow local loopback access
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname.startsWith("192.168.")) {
        return res.status(403).send("Zugriff auf lokale Netzwerkadressen blockiert.");
      }

      const response = await fetch(formattedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 ObsidianOS/2.4",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        },
      });

      const contentType = response.headers.get("content-type") || "text/html";
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-Frame-Options", "ALLOWALL");

      if (contentType.includes("text/html")) {
        let html = await response.text();
        // Rewrite base href so relative links and assets load properly
        const baseTag = `<base href="${parsed.origin}${parsed.pathname}">`;
        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head>${baseTag}`);
        } else if (html.includes("<HEAD>")) {
          html = html.replace("<HEAD>", `<HEAD>${baseTag}`);
        } else {
          html = baseTag + html;
        }
        return res.send(html);
      } else {
        const buffer = await response.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }
    } catch (err: any) {
      console.error("Proxy fetch error:", err);
      return res.status(502).json({
        error: "Webseite konnte nicht geladen werden",
        details: err?.message || "Netzwerkfehler oder blockierte Anfrage",
      });
    }
  });

  // ==========================================
  // YouTube Data API v3 Secure Server-side Proxy
  // ==========================================
  const getYouTubeKey = (req?: express.Request): string => {
    const customHeaderKey = req?.headers["x-youtube-api-key"] as string | undefined;
    const queryKey = req?.query?.apiKey as string | undefined;
    if (customHeaderKey && customHeaderKey.trim()) return customHeaderKey.trim();
    if (queryKey && queryKey.trim()) return queryKey.trim();
    return process.env.YOUTUBE_API_KEY || "AIzaSyDzIw-FDjiwKxSfOc1IGcS08VdgOtfOiZg";
  };

  // Helper to diagnose YouTube API errors
  const parseYouTubeError = (status: number, data: any) => {
    const errObj = data?.error || {};
    const message = errObj.message || "Unbekannter YouTube API-Fehler";
    const reason = errObj.errors?.[0]?.reason || "";
    const isInvalidKey =
      status === 400 ||
      status === 401 ||
      reason === "keyInvalid" ||
      reason === "badRequest" ||
      message.toLowerCase().includes("api key not valid") ||
      message.toLowerCase().includes("api_key_invalid");
    const isQuotaExceeded =
      status === 403 &&
      (reason === "quotaExceeded" ||
        reason === "dailyLimitExceeded" ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("limit"));
    const isForbidden =
      status === 403 &&
      (reason === "accessNotConfigured" ||
        reason === "ipRefererBlocked" ||
        message.toLowerCase().includes("not enabled"));

    return {
      status,
      message,
      reason,
      isInvalidKey,
      isQuotaExceeded,
      isForbidden,
    };
  };

  // Helper: Enrich raw video items with channel avatars & thumbnails
  async function enrichItemsWithChannelAvatars(items: any[], apiKey: string) {
    if (!items || items.length === 0 || !apiKey) return items;
    try {
      const channelIds = Array.from(
        new Set(
          items
            .map((item: any) => item.snippet?.channelId || item.channelId)
            .filter(Boolean)
        )
      );

      if (channelIds.length === 0) return items;

      const avatarMap = new Map<string, string>();
      // Batch in chunks of up to 50 channel IDs
      for (let i = 0; i < channelIds.length; i += 50) {
        const chunk = channelIds.slice(i, i + 50).join(",");
        const chRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${encodeURIComponent(
            chunk
          )}&key=${apiKey}`
        );
        if (chRes.ok) {
          const chData = await chRes.json();
          for (const ch of chData.items || []) {
            const avatar =
              ch.snippet?.thumbnails?.medium?.url ||
              ch.snippet?.thumbnails?.default?.url ||
              ch.snippet?.thumbnails?.high?.url;
            if (avatar) {
              avatarMap.set(ch.id, avatar);
            }
          }
        }
      }

      return items.map((item: any) => {
        const cId = item.snippet?.channelId || item.channelId;
        const avatar = cId ? avatarMap.get(cId) : undefined;
        return {
          ...item,
          channelAvatarUrl: avatar || item.channelAvatarUrl || undefined,
        };
      });
    } catch (e) {
      console.warn("Could not enrich items with channel avatars:", e);
      return items;
    }
  }

  // 0. Test YouTube API Key
  app.post("/api/youtube/test-key", async (req, res) => {
    try {
      const testKey = (req.body?.apiKey as string)?.trim() || getYouTubeKey(req);
      if (!testKey) {
        return res.status(400).json({
          valid: false,
          error: "Kein API-Key angegeben",
          message: "Bitte gib einen YouTube API-Key ein.",
        });
      }

      const testUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${encodeURIComponent(
        testKey
      )}`;
      const response = await fetch(testUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(200).json({
          valid: false,
          diagnostics: diag,
          error: diag.message,
          status: response.status,
        });
      }

      return res.json({
        valid: true,
        message: "YouTube API-Key ist gültig und einsatzbereit!",
        videoSample: data.items?.[0]?.snippet?.title || "OK",
      });
    } catch (err: any) {
      return res.status(500).json({
        valid: false,
        error: "Verbindungsfehler",
        message: err?.message || "Fehler beim Testen des API-Keys",
      });
    }
  });

  // 1. Trending / Most Popular Videos
  app.get("/api/youtube/trending", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const regionCode = (req.query.regionCode as string) || "DE";
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "24", 10));
      const videoCategoryId = req.query.videoCategoryId as string;

      let apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=${encodeURIComponent(
        regionCode
      )}&maxResults=${maxResults}&key=${apiKey}`;

      if (videoCategoryId && videoCategoryId !== "0") {
        apiUrl += `&videoCategoryId=${encodeURIComponent(videoCategoryId)}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      if (data.items && data.items.length > 0) {
        data.items = await enrichItemsWithChannelAvatars(data.items, apiKey);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("YouTube Trending Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden von Trending-Videos", details: err?.message });
    }
  });

  // 2. Search Videos, Channels & Playlists
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const query = (req.query.q as string) || "";
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "24", 10));
      const order = (req.query.order as string) || "relevance";
      const pageToken = (req.query.pageToken as string) || "";

      if (!query.trim()) {
        return res.status(400).json({ error: "Suchbegriff (q) ist erforderlich." });
      }

      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=${maxResults}&order=${encodeURIComponent(order)}&key=${apiKey}`;

      if (pageToken) {
        searchUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchRes.ok) {
        const diag = parseYouTubeError(searchRes.status, searchData);
        return res.status(searchRes.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: searchData,
        });
      }

      const videoIds = (searchData.items || [])
        .map((item: any) => item.id?.videoId)
        .filter(Boolean)
        .join(",");

      // Fetch statistics and contentDetails for search results
      if (videoIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const detailsMap = new Map((detailsData.items || []).map((v: any) => [v.id, v]));

          const enrichedItems = searchData.items.map((item: any) => {
            const vId = item.id?.videoId;
            const full = detailsMap.get(vId);
            return full || item;
          });

          searchData.items = await enrichItemsWithChannelAvatars(enrichedItems, apiKey);
          return res.json(searchData);
        }
      }

      if (searchData.items && searchData.items.length > 0) {
        searchData.items = await enrichItemsWithChannelAvatars(searchData.items, apiKey);
      }

      return res.json(searchData);
    } catch (err: any) {
      console.error("YouTube Search Error:", err);
      return res.status(500).json({ error: "Fehler bei der YouTube Suche", details: err?.message });
    }
  });

  // 3. Single Video Details & Statistics
  app.get("/api/youtube/video/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;

      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(
        id
      )}&key=${apiKey}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ error: "Video nicht gefunden" });
      }

      const enriched = await enrichItemsWithChannelAvatars([data.items[0]], apiKey);
      return res.json(enriched[0]);
    } catch (err: any) {
      console.error("YouTube Video Detail Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden des Videos", details: err?.message });
    }
  });

  // 4. Video Comments
  app.get("/api/youtube/comments/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "20", 10));

      const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${encodeURIComponent(
        id
      )}&maxResults=${maxResults}&order=relevance&key=${apiKey}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      return res.json(data);
    } catch (err: any) {
      console.error("YouTube Comments Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden der Kommentare", details: err?.message });
    }
  });

  // 5. Channel Details (Avatar, Banner, Statistics, Description)
  app.get("/api/youtube/channel/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;

      let channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${encodeURIComponent(
        id
      )}&key=${apiKey}`;

      let response = await fetch(channelUrl);
      let data = await response.json();

      // If not found by ID, try searching by handle/custom URL
      if ((!data.items || data.items.length === 0) && id.startsWith("@")) {
        const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&forHandle=${encodeURIComponent(
          id
        )}&key=${apiKey}`;
        const handleRes = await fetch(handleUrl);
        if (handleRes.ok) {
          const handleData = await handleRes.json();
          if (handleData.items && handleData.items.length > 0) {
            data = handleData;
          }
        }
      }

      if (!response.ok && (!data.items || data.items.length === 0)) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status || 404).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      const item = data.items?.[0];
      if (!item) {
        return res.status(404).json({ error: "Kanal nicht gefunden" });
      }

      const snippet = item.snippet || {};
      const stats = item.statistics || {};
      const branding = item.brandingSettings || {};

      const channelObj = {
        id: item.id,
        title: snippet.title || "YouTube Kanal",
        description: snippet.description || "",
        customUrl: snippet.customUrl || `@${(snippet.title || "channel").toLowerCase().replace(/\s+/g, "")}`,
        publishedAt: snippet.publishedAt || "",
        avatarUrl:
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        bannerUrl:
          branding.image?.bannerExternalUrl ||
          branding.image?.bannerTvHighImageUrl ||
          branding.image?.bannerMobileHdImageUrl ||
          undefined,
        subscriberCount: stats.subscriberCount || undefined,
        videoCount: stats.videoCount || undefined,
        viewCount: stats.viewCount || undefined,
        country: snippet.country || undefined,
      };

      return res.json(channelObj);
    } catch (err: any) {
      console.error("YouTube Channel Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden des Kanals", details: err?.message });
    }
  });

  // 6. Channel Latest Videos & Playlists
  app.get("/api/youtube/channel-videos/:id", async (req, res) => {
    try {
      const apiKey = getYouTubeKey(req);
      const { id } = req.params;
      const maxResults = Math.min(50, parseInt((req.query.maxResults as string) || "30", 10));

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
        id
      )}&order=date&type=video&maxResults=${maxResults}&key=${apiKey}`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!response.ok) {
        const diag = parseYouTubeError(response.status, data);
        return res.status(response.status).json({
          error: diag.message,
          diagnostics: diag,
          raw: data,
        });
      }

      const videoIds = (data.items || [])
        .map((item: any) => item.id?.videoId)
        .filter(Boolean)
        .join(",");

      if (videoIds) {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          const detailsMap = new Map((detailsData.items || []).map((v: any) => [v.id, v]));

          const enrichedItems = data.items.map((item: any) => {
            const vId = item.id?.videoId;
            const full = detailsMap.get(vId);
            return full || item;
          });

          data.items = await enrichItemsWithChannelAvatars(enrichedItems, apiKey);
          return res.json(data);
        }
      }

      if (data.items && data.items.length > 0) {
        data.items = await enrichItemsWithChannelAvatars(data.items, apiKey);
      }

      return res.json(data);
    } catch (err: any) {
      console.error("YouTube Channel Videos Error:", err);
      return res.status(500).json({ error: "Fehler beim Laden der Kanal-Videos", details: err?.message });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ObsidianOS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
