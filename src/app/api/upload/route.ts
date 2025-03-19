import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Formidable } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const bodyBuffer = Buffer.from(await req.arrayBuffer());
  const { PassThrough } = await import('stream');
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';
  const stream = new PassThrough();
  stream.headers = {
    'content-type': contentType,
    'content-length': contentLength,
  };
  stream.end(bodyBuffer);

  return new Promise<Response>((resolve) => {
    const form = new Formidable({
      uploadDir,
      keepExtensions: true,
      multiples: false,
      filename: (name, ext, part) => {
        console.log('Ladattu tiedostonimi:', part.originalFilename);
        return `audio_${Date.now()}${ext}`;
      },
    });

    form.parse(stream, (err, fields, files) => {
      if (err) {
        console.error('Tiedoston jäsentäminen epäonnistui:', err);
        resolve(NextResponse.json({ error: 'Tiedoston tallennuksessa tapahtui virhe' }, { status: 500 }));
        return;
      }

      console.log('Kentät:', fields);
      console.log('Tiedostot:', files);

      const uploadedFile = (Object.values(files)[0] as any)?.[0];

      if (!uploadedFile || !uploadedFile.filepath) {
        console.error('Tiedoston nimeä ei löytynyt ladatusta tiedostosta');
        resolve(NextResponse.json({ error: 'Tiedoston nimeä ei löytynyt ladatusta tiedostosta' }, { status: 500 }));
        return;
      }

      const fileName = path.basename(uploadedFile.filepath);
      console.log('Tallennettu tiedosto:', fileName);

      const pythonUrl = 'http://localhost:4041/process';

      fetch(pythonUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      })
        .then(async (res) => {
          if (!res.ok) {
            resolve(NextResponse.json({ error: 'Python-palvelimen virhe' }, { status: 500 }));
            return;
          }
          const result = await res.json();
          resolve(NextResponse.json(result));
        })
        .catch((error) => {
          console.error('Python-palvelimeen yhteyden muodostus epäonnistui:', error);
          resolve(NextResponse.json({ error: 'Python-palvelimeen yhteyden muodostus epäonnistui' }, { status: 500 }));
        });
    });
  });
}
