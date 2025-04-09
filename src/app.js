import express from 'express';
import httpFetch from 'node-fetch';
import corsMiddleware from 'cors';
import securityHeaders from 'helmet';
import cacheProvider from './cache.js';
import compressResponses from 'compression';
import expressStatusMonitor from 'express-status-monitor';
import morgan from 'morgan';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const server = express();

const channelNameRegex = /"owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[.*?\]},"title":{"runs":\[{"text":"(.+?)"/;
const streamUrlRegex = /(?<=hlsManifestUrl":").*\.m3u8/;
const channelLogoRegex = /(?<=owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[{"url":")[^=]*/;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_TTL = 300;
const DEFAULT_PORT = 8080;
const CONFIG_FILE_PATH = path.join(__dirname, 'config', 'channels.json');


let channelConfig = {};

async function loadChannelConfig() {
  try {
    console.log(`Loading channel config from ${CONFIG_FILE_PATH}`);
    const data = await fs.readFile(CONFIG_FILE_PATH, 'utf8');
    channelConfig = JSON.parse(data);
    console.log(`Loaded channel config: ${JSON.stringify(channelConfig)}`);
    return channelConfig;
  } catch (error) {
    console.error(`Error loading channel config: ${error.message}`);
    return null;
  }
}

async function fetchStreamData(targetUrl) {
  const cachedData = await cacheProvider?.get(targetUrl);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const streamData = {};

  try {
    const response = await httpFetch(targetUrl);

    if (!response.ok) {
      console.error(`Request failed: ${targetUrl} - Status: ${response.status}`);
      return streamData;
    }

    const responseText = await response.text();
    const streamUrl = responseText.match(streamUrlRegex)?.[0];
    const channelName = channelNameRegex.exec(responseText)?.[1];
    const channelLogo = responseText.match(channelLogoRegex)?.[0];

    Object.assign(streamData, {
      name: channelName,
      stream: streamUrl,
      logo: channelLogo
    });

    await cacheProvider?.set(targetUrl, JSON.stringify(streamData), { EX: CACHE_TTL });
  } catch (error) {
    console.error(`Error fetching stream data: ${error.message}`);
  }

  return streamData;
}

function configureServerMiddlewares() {
  server.use(expressStatusMonitor());
  server.use(corsMiddleware());
  server.use(securityHeaders());
  server.use(compressResponses());
  server.use(handleServerErrors);
  server.use(morgan('combined'));
  server.use(async(req, res, next) => {
    if (Object.keys(channelConfig).length === 0) {
      await loadChannelConfig();
    }
    next();
  })
}

function handleServerErrors(error, req, res, next) {
  console.error(`Server Error: ${error.stack}`);
  res.status(500).json({ error: 'Internal Server Error' });
}

function initializeRoutes() {
  server.get('/health', (req, res) => {
    res.json({ status: 'operational', timestamp: new Date().toISOString() });
  });

  server.get('/channel/:id.m3u8', corsMiddleware(), handleChannelRequest);
  server.get('/live/:id.m3u8', corsMiddleware(), handleVideoRequest);
  server.get('/cache', corsMiddleware(), handleCacheRequest);
}

async function handleChannelRequest(req, res, next) {
  try {
    const channelUrl = `https://www.youtube.com/channel/${req.params.id}/live`;
    const { stream } = await fetchStreamData(channelUrl);

    stream ? res.redirect(stream) : res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

async function handleVideoRequest(req, res, next) {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${req.params.id}`;
    const { stream } = await fetchStreamData(videoUrl);

    stream ? res.redirect(stream) : res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

async function handleCacheRequest(req, res, next) {
  try {
    const cacheKeys = await cacheProvider?.keys('*');
    const cachedItems = [];

    for (const key of cacheKeys) {
      const cachedData = JSON.parse(await cacheProvider?.get(key));
      if (cachedData) {
        cachedItems.push({
          url: key,
          name: cachedData.name,
          logo: cachedData.logo
        });
      }
    }

    res.json(cachedItems);
  } catch (error) {
    next(error);
  }
}

configureServerMiddlewares();
initializeRoutes();

const port = process.env.PORT || DEFAULT_PORT;
server.get('/channels', (req, res) => {
  const channels = Object.entries(channelConfig).map(([slug, config]) => ({
    slug,
    name: config.name,
    logo: config.logo
  }));
  res.json(channels);
});


server.listen(port, () => {
  console.log(`Stream server operational on port ${port} (Node ${process.version})`);
});
