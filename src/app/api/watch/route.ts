// src/app/api/watch/route.ts
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads');

export async function GET(request: Request) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Luetaan jo kansiossa olevat .txt-tiedostot
  const existingFiles = new Set(
    fs.readdirSync(uploadDir).filter((filename) => filename.endsWith('.txt'))
  );

  const stream = new ReadableStream({
    start(controller) {
      const watcher = fs.watch(uploadDir, (eventType, filename) => {
        if (filename && filename.endsWith('.txt') && !existingFiles.has(filename)) {
          // Merkitään tiedosto käsitellyksi, jotta samaa tiedostoa ei lähetetä uudelleen
          existingFiles.add(filename);
          const filePath = path.join(uploadDir, filename);
          // Pieni viive varmistamaan, että tiedosto on kokonaan kirjoitettu
          setTimeout(() => {
            fs.readFile(filePath, 'utf8', (err, data) => {
              if (err) return;
              const sseMessage = `data: ${JSON.stringify({ filename, content: data })}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseMessage));
            });
          }, 100);
        }
      });

      controller.oncancel = () => {
        watcher.close();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
