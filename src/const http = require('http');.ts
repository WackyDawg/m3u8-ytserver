const http = require('http');
const https = require('https');
const fs = require('fs');

const proxyServer = http.createServer((clientReq, clientRes) => {
  const options = {
    method: 'GET',
    headers: {
      "accept": "*/*",
      "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "Referer": "https://livepush.io/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  };

  // Modify the target URL as needed
  const targetUrl = 'https://dai.google.com/linear/hls/pa/event/_Ath2237RR2QfYlKfSa9hQ/stream/673e90b9-51f4-42c7-a5c6-d3bf6439ad9f:BRU/variant/1c68c645871d699bb7068686e38fce65/bandwidth/464544.m3u8';

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe the response from the target server to the client
    proxyRes.pipe(clientRes, { end: true });

    // Save the response to a local file (change the filename as needed)
    const fileStream = fs.createWriteStream('downloadedStream.m3u8');
    proxyRes.pipe(fileStream);
  });

  // Handle errors
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    clientRes.writeHead(500, { 'Content-Type': 'text/plain' });
    clientRes.end('Internal Server Error');
  });

  // End the proxy request
  proxyReq.end();
});

const PORT = 3000; // Change the port as needed

proxyServer.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
