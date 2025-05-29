const express = require('express');
const fetch = require('node-fetch');
<<<<<<< HEAD
const cors = require('cors');
const helmet = require('helmet');
const cache = require('./cache');

const app = express();

const reChannelName = /"owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[.*?\]},"title":{"runs":\[{"text":"(.+?)"/;
=======
const morgan = require('morgan');

const cache = require('./cache');

const app = express();

// Enable request logging
app.use(morgan('dev'));
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40

// Regex to extract channel name
const reChannelName = /"owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[.*?\]},"title":{"runs":\[{"text":"(.+?)"/;

// Function to fetch live stream info
const getLiveStream = async (url) => {
<<<<<<< HEAD
  let data = await cache?.get(url);

  if (data) {
    return JSON.parse(data);
  } else {
    data = {};

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'VLC/3.0.16 LibVLC/3.0.16',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (response.ok) {
        const text = await response.text();
        const stream = text.match(/(?<=hlsManifestUrl":").*\.m3u8/)?.[0];
        console.log(`[STREAM URL]`, stream);

        const name = reChannelName.exec(text)?.[1];
        const logo = text.match(/(?<=owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[{"url":")[^=]*/)?.[0];

        data = { name, stream, logo };
      } else {
        console.log(JSON.stringify({
          url,
          status: response.status
        }));
      }
    } catch (error) {
      console.log(error);
    }

    await cache?.set(url, JSON.stringify(data), { EX: 300 });
    return data;
  }
};

app.use(require('express-status-monitor')());
app.use(cors());
app.use(helmet());
=======
  console.log(`[INFO] Checking cache for URL: ${url}`);
  let data = await cache?.get(url);

  if (data) {
    console.log(`[CACHE HIT] Found cached data for ${url}`);
    return JSON.parse(data);
  }

  console.log(`[CACHE MISS] Fetching live stream for: ${url}`);
  data = {};

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    console.log(`[FETCH] ${url} - Status: ${response.status}`);

    if (response.ok) {
      const text = await response.text();

      const stream = text.match(/(?<=hlsManifestUrl":").*?\.m3u8/)?.[0];
      const name = reChannelName.exec(text)?.[1];
      const logo = text.match(
        /(?<=owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[{"url":")[^=]*/
      )?.[0];

      if (!stream) {
        console.warn(`[WARN] No stream found in HTML for URL: ${url}`);
      }

      data = { name, stream, logo };
      console.log(`[SUCCESS] Extracted stream info for: ${url}`, data);
    } else {
      console.error(`[ERROR] Failed to fetch ${url} - Status: ${response.status}`);
    }
  } catch (error) {
    console.error(`[ERROR] Exception while fetching ${url}:`, error);
  }

  await cache?.set(url, JSON.stringify(data), { EX: 300 });
  return data;
};
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40

// Health check
app.get('/', (req, res, next) => {
  try {
    res.json({ message: 'Status OK' });
  } catch (err) {
<<<<<<< HEAD
    nxt(err);
=======
    next(err);
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40
  }
});

// Channel livestream redirect
app.get('/channel/:id.m3u8', async (req, res, next) => {
  try {
<<<<<<< HEAD
    console.log(`[REQUEST HEADERS - CHANNEL]`, req.headers); // <--- Logs client headers
=======
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40
    const url = `https://www.youtube.com/channel/${req.params.id}/live`;
    const { stream } = await getLiveStream(url);

    if (stream) {
<<<<<<< HEAD
      res.redirect(stream);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    nxt(err);
=======
      console.log(`[REDIRECT] Redirecting to stream for channel: ${req.params.id}`);
      res.redirect(stream);
    } else {
      console.log(`[NO STREAM] No live stream found for channel: ${req.params.id}`);
      res.sendStatus(204);
    }
  } catch (err) {
    console.error(`[ERROR] /channel/:id.m3u8`, err);
    next(err);
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40
  }
});

// Video livestream redirect
app.get('/video/:id.m3u8', async (req, res, next) => {
  try {
<<<<<<< HEAD
    console.log(`[REQUEST HEADERS - VIDEO]`, req.headers); // <--- Logs client headers
=======
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40
    const url = `https://www.youtube.com/watch?v=${req.params.id}`;
    const { stream } = await getLiveStream(url);

    if (stream) {
<<<<<<< HEAD
      res.redirect(stream);
    } else {
      res.sendStatus(204);
    }
  } catch (err) {
    nxt(err);
=======
      console.log(`[REDIRECT] Redirecting to stream for video: ${req.params.id}`);
      res.redirect(stream);
    } else {
      console.log(`[NO STREAM] No live stream found for video: ${req.params.id}`);
      res.sendStatus(204);
    }
  } catch (err) {
    console.error(`[ERROR] /video/:id.m3u8`, err);
    next(err);
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40
  }
});

// List cached items
app.get('/cache', async (req, res, next) => {
  try {
    const keys = await cache?.keys('*');
<<<<<<< HEAD

    const items = [];

    for (const key of keys) {
      const data = JSON.parse(await cache?.get(key));
=======
    const items = [];

    for (const key of keys) {
      const raw = await cache?.get(key);
      if (!raw) continue;
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40

      const data = JSON.parse(raw);
      if (data) {
        items.push({
          url: key,
          name: data.name,
          logo: data.logo
        });
      }
    }

<<<<<<< HEAD
    res.json(items);
  } catch (err) {
    nxt(err);
  }
});

=======
    console.log(`[CACHE LIST] Returning ${items.length} items`);
    res.json(items);
  } catch (err) {
    console.error(`[ERROR] /cache`, err);
    next(err);
  }
});

// Start server
>>>>>>> ec2335077e59c17c15f381ad44595572d079bc40
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`express app (node ${process.version}) is running on port ${port}`);
});
