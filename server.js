import { createServer } from 'http';
import indexHTML from './index.js';
import { server as code, client } from "./output.js";
const hostname = '127.0.0.1';
const port = 3000;


const index = ``

const server = createServer((req, res) => {
  res.statusCode = 200;
  console.log({url: req.url})
  if(req.method === "GET" && req.url==="/runtime.js") {
     res.setHeader('Content-Type', 'application/javascript')
     res.end(`export default ${client.toString()}`)
     return
  }
  res.setHeader('Content-Type', 'text/html');
  res.end(indexHTML(code()));
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});