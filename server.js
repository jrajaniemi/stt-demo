// server.js
const { createServer } = require("http");
const next = require("next");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Luo WebSocket-palvelin käyttäen samaa HTTP-palvelinta
  const wss = new WebSocket.Server({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    // Luo uploads-kansio, jos sitä ei ole
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
      console.log("Luotiin uploads-kansio:", uploadsDir);
    }
    // Tiedoston nimeksi käytetään aikaleimaa
    const fileName = path.join(uploadsDir, `audio_${Date.now()}.webm`);
    console.log("Luodaan tiedosto:", fileName);
    const fileStream = fs.createWriteStream(fileName);

    ws.on("message", (message) => {
      const data = Buffer.isBuffer(message) ? message : Buffer.from(message);
      console.log("Saatiin viesti, pituus:", data.length);
      fileStream.write(data);
    });

    ws.on("close", () => {
      fileStream.end();
      console.log("WebSocket client disconnected. Tallennettu tiedosto:", fileName);
    });

    ws.on("error", (err) => {
      console.error("WebSocket error", err);
    });
  });

  const port = process.env.PORT || 3001;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
