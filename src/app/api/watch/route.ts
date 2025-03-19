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

  let isCancelled = false; // Lippu streamin tilan seuraamiseen

  const stream = new ReadableStream({
    start(controller) {
      // Taulukko käynnissä olevien timeoutien hallintaan
      const timeouts: NodeJS.Timeout[] = [];
      const watcher = fs.watch(uploadDir, (eventType, filename) => {
        if (filename && filename.endsWith('.txt') && !existingFiles.has(filename)) {
          // Merkitään tiedosto käsitellyksi, jotta samaa tiedostoa ei lähetetä uudelleen
          existingFiles.add(filename);
          const filePath = path.join(uploadDir, filename);
          // Pieni viive, jotta varmistetaan tiedoston täydellinen kirjoitus
          const timeoutId = setTimeout(() => {
            fs.readFile(filePath, 'utf8', (err, data) => {
              if (err) return;
              if (!isCancelled) { // Tarkistetaan, ettei stream ole peruttu
                try {
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ filename, content: data })}\n\n`));
                } catch (e) {
                  console.error('Enqueue-virhe:', e);
                }
              }
            });
          }, 100);
          timeouts.push(timeoutId);
        }
      });

      controller.oncancel = () => {
        isCancelled = true;
        watcher.close();
        timeouts.forEach((t) => clearTimeout(t));
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
