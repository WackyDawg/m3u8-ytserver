const express = require('express');
const { spawn } = require('child_process');

const app = express();

function streamYouTube(videoUrl, res, req) {
  // Step 1: Get direct stream URL with yt-dlp
  const ytDlp = spawn('yt-dlp', ['-g', videoUrl]);

  let streamUrl = '';

  ytDlp.stdout.on('data', (data) => {
    streamUrl += data.toString();
  });

  ytDlp.stderr.on('data', (data) => {
    console.error('yt-dlp error:', data.toString());
  });

  ytDlp.on('close', (code) => {
    if (code !== 0 || !streamUrl) {
      res.status(500).send('Failed to get stream URL');
      return;
    }

    streamUrl = streamUrl.trim();
    console.log('Stream URL:', streamUrl);

    // Step 2: Use ffmpeg to stream to client
    const ffmpeg = spawn('ffmpeg', [
      '-i', streamUrl,
      '-c', 'copy',
      '-f', 'mpegts',
      'pipe:1',
    ]);

    res.setHeader('Content-Type', 'video/MP2T');

    ffmpeg.stdout.pipe(res);

    ffmpeg.stderr.on('data', (data) => {
      console.error('FFmpeg error:', data.toString());
    });

    ffmpeg.on('close', () => {
      res.end();
    });

    req.on('close', () => {
      ffmpeg.kill('SIGINT');
    });
  });
}

app.get('/', (req, res) => {
  res.status(200).json({
    message: "Hello world"
  })
});

app.get('/stream/:videoId', (req, res) => {
  const videoUrl = `https://www.youtube.com/watch?v=${req.params.videoId}`;
  streamYouTube(videoUrl, res, req);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
