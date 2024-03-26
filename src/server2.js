const http = require('http');
const https = require('https');
const url = require('url');
const serverConfig = require('./config'); // Update the path if needed

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const identifierMatch = parsedUrl.pathname.match(/^\/?(\d+)\/(.*)/);

  const identifier = identifierMatch ? identifierMatch[1] : null;

  if (identifier) {
    const config = serverConfig[identifier] || serverConfig['default'];
    hostname = config.hostname;
    port = config.port;
    headers = { ...config.headers };
  }
  const query = parsedUrl.query ? `?${parsedUrl.query}` : '';

  const currentDate = new Date().toUTCString();

  const options = {
    hostname: hostname,
    port: port,
    path: '/' + (identifierMatch ? identifierMatch[2] : '') + query,
    method: req.method,
    headers: headers,
  };

  console.log(options);

  // Enable CORS - Add the following headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Respond to the preflight request without proxying it
    res.writeHead(200);
    res.end();
  } else {
    // Handle the actual request and proxy it
    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    req.pipe(proxyReq, { end: true });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    });

    proxyReq.end();
  }
});

const PORT = 8333;

server.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
