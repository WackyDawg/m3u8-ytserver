const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const helmet = require('helmet');
const { spawn } = require('child_process');
const cache = require('./cache');

const app = express();

const reChannelName = /"owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[.*?\]},"title":{"runs":\[{"text":"(.+?)"/;

const getLiveStream = async (url) => {
  let data = await cache?.get(url);
  if (data) return JSON.parse(data);

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
      const stream = text.match(/(?<=hlsManifestUrl":").*?\.m3u8/)?.[0];
      const name = reChannelName.exec(text)?.[1];
      const logo = text.match(/(?<=owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[{"url":")[^=]*/)?.[0];
      data = { name, stream, logo };
    } else {
      console.log(JSON.stringify({ url, status: response.status }));
    }
  } catch (error) {
    console.log(error);
  }

  await cache?.set(url, JSON.stringify(data), { EX: 300 });
  return data;
};

const streamWithFFmpeg = (streamUrl, req, res) => {
  const headers = [
    'User-Agent: VLC/3.0.16 LibVLC/3.0.16',
    'Referer: https://www.youtube.com',
    'Origin: https://www.youtube.com',
    'Accept-Language: en-US,en;q=0.9'
  ].join('\r\n');

  const ffmpeg = spawn('ffmpeg', [
    '-headers', headers,
    '-i', streamUrl,
    '-c', 'copy',
    '-f', 'mpegts',
    'pipe:1'
  ]);

  res.setHeader('Content-Type', 'video/MP2T');
  ffmpeg.stdout.pipe(res);

  ffmpeg.stderr.on('data', (data) => {
    console.error('[FFmpeg stderr]', data.toString());
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg exited with code ${code}`);
    res.end();
  });

  req.on('close', () => {
    ffmpeg.kill('SIGINT');
  });
};

app.use(require('express-status-monitor')());
app.use(cors());
app.use(helmet());

app.get('/', (req, res) => {
  res.json({ message: 'Status OK' });
});

app.get(['/channel/:id.m3u8', '/video/:id.m3u8'], async (req, res, next) => {
  try {
    const isChannel = req.path.includes('/channel/');
    const id = req.params.id;
    const url = isChannel
      ? `https://www.youtube.com/channel/${id}/live`
      : `https://www.youtube.com/watch?v=${id}`;

    const { stream } = await getLiveStream(url);
    if (!stream) return res.sendStatus(204);

    streamWithFFmpeg(stream, req, res);
  } catch (err) {
    next(err);
  }
});

app.get('/cache', async (req, res, next) => {
  try {
    const keys = await cache?.keys('*');
    const items = [];

    for (const key of keys) {
      const data = JSON.parse(await cache?.get(key));
      if (data) {
        items.push({ url: key, name: data.name, logo: data.logo });
      }
    }

    res.json(items);
  } catch (err) {
    next(err);
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Express app running on port ${port}`);
});
