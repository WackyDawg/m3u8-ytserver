const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const HLSServer = require('hls-server');
const http = require('http');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const outputDir = path.join(__dirname, 'hls-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const server = http.createServer();
const hls = new HLSServer(server, {
  path: '/streams',
  dir: outputDir
});

async function convertToHLS(videoUrl) {
  if (!ytdl.validateURL(videoUrl)) {
    throw new Error('Invalid YouTube URL');
  }

  const videoStream = ytdl(videoUrl, {
    quality: 'highest',
    highWaterMark: 1 << 25
  });

  const outputPath = path.join(outputDir, 'stream.m3u8');

  return new Promise((resolve, reject) => {
    ffmpeg(videoStream)
      .outputOptions([
        '-c:v h264',
        '-c:a aac',
        '-hls_time 10',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

// Add root route to serve a simple HTML page
server.on('request', async (req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>YouTube to HLS</h1>
      <form method="POST" action="/convert">
        <input name="url" placeholder="YouTube URL" size="40"/>
        <button type="submit">Convert & Stream</button>
      </form>
      <p>Example: <a href="/streams/stream.m3u8">Watch example stream</a></p>
    `);
  } else if (req.url === '/convert' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      const url = new URLSearchParams(body).get('url');
      try {
        await convertToHLS(url);
        res.writeHead(302, { Location: '/streams/stream.m3u8' });
        res.end();
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error: ' + err.message);
      }
    });
  }
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
