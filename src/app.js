const express = require('express')
const fetch = require('node-fetch')
const morgan = require('morgan')

const cache = require('./cache')

const app = express()

// Logging HTTP requests
app.use(morgan('dev'))

const reChannelName = /"owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[.*?\]},"title":{"runs":\[{"text":"(.+?)"/

const getLiveStream = async (url) => {
  console.log(`[INFO] Checking cache for URL: ${url}`)

  let data = await cache?.get(url)

  if (data) {
    console.log(`[CACHE HIT] Found cached data for ${url}`)
    return JSON.parse(data)
  } else {
    console.log(`[CACHE MISS] Fetching live stream for: ${url}`)
    data = {}

    try {
      const response = await fetch(url)
      console.log(`[FETCH] ${url} - Status: ${response.status}`)

      if (response.ok) {
        const text = await response.text()
        const stream = text.match(/(?<=hlsManifestUrl":").*\.m3u8/)?.[0]
        const name = reChannelName.exec(text)?.[1]
        const logo = text.match(/(?<=owner":{"videoOwnerRenderer":{"thumbnail":{"thumbnails":\[{"url":")[^=]*/)?.[0]

        data = { name, stream, logo }

        console.log(`[SUCCESS] Extracted stream info for: ${url}`, data)
      } else {
        console.error(`[ERROR] Failed to fetch ${url} - Status: ${response.status}`)
      }
    } catch (error) {
      console.error(`[ERROR] Exception while fetching ${url}:`, error)
    }

    await cache?.set(url, JSON.stringify(data), { EX: 300 })

    return data
  }
}

app.use(require('express-status-monitor')())

app.get('/', (req, res, nxt) => {
  try {
    res.json({ message: 'Status OK' })
  } catch (err) {
    nxt(err)
  }
})

app.get('/channel/:id.m3u8', async (req, res, nxt) => {
  try {
    const url = `https://www.youtube.com/channel/${req.params.id}/live`
    const { stream } = await getLiveStream(url)

    if (stream) {
      console.log(`[REDIRECT] Redirecting to stream for channel: ${req.params.id}`)
      res.redirect(stream)
    } else {
      console.log(`[NO STREAM] No live stream found for channel: ${req.params.id}`)
      res.sendStatus(204)
    }
  } catch (err) {
    console.error(`[ERROR] /channel/:id.m3u8`, err)
    nxt(err)
  }
})

app.get('/video/:id.m3u8', async (req, res, nxt) => {
  try {
    const url = `https://www.youtube.com/watch?v=${req.params.id}`
    const { stream } = await getLiveStream(url)

    if (stream) {
      console.log(`[REDIRECT] Redirecting to stream for video: ${req.params.id}`)
      res.redirect(stream)
    } else {
      console.log(`[NO STREAM] No live stream found for video: ${req.params.id}`)
      res.sendStatus(204)
    }
  } catch (err) {
    console.error(`[ERROR] /video/:id.m3u8`, err)
    nxt(err)
  }
})

app.get('/cache', async (req, res, nxt) => {
  try {
    const keys = await cache?.keys('*')

    const items = []

    for (const key of keys) {
      const data = JSON.parse(await cache?.get(key))

      if (data) {
        items.push({
          url: key,
          name: data.name,
          logo: data.logo
        })
      }
    }

    console.log(`[CACHE LIST] Returning ${items.length} items`)
    res.json(items)
  } catch (err) {
    console.error(`[ERROR] /cache`, err)
    nxt(err)
  }
})

const port = process.env.PORT || 8080

app.listen(port, () => {
  console.log(`express app (node ${process.version}) is running on port ${port}`)
})
