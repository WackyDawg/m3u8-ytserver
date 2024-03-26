const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  // Parse the incoming request URL
  const parsedUrl = url.parse(req.url);

  // Define the default hostname and port
  let hostname = 'wazobia.live';
  const port = 8333;

  // Check the path and update hostname accordingly
  if (parsedUrl.pathname.startsWith('/channel/')) {
    // If the path starts with '/channel/', use 'wazobia.live'
    hostname = 'wazobia.live';
  } else if (parsedUrl.pathname.startsWith('/chnel/')) {
    // If the path starts with '/chnel/', use 'wazobia.net'
    hostname = 'wazobia.net';
  }

  // Set up options for the proxy request
  const options = {
    hostname: hostname,
    port: port,
    path: parsedUrl.path,
    method: req.method,
    headers: {
      ...req.headers,
      host: hostname,
    },
  };


  // Enable CORS - Add the following headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Check for preflight CORS request (OPTIONS method)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Perform the proxy request
  const proxyReq = https.request(options, (proxyRes) => {
    // Set the appropriate headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe the response from the proxied server to the client
    proxyRes.pipe(res, { end: true });
  });

  // Pipe the incoming request body (if any) to the proxied request
  req.pipe(proxyReq, { end: true });

  // Handle errors
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  });

  // End the proxied request
  proxyReq.end();
});

const PORT = 8333;

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
