import { NextResponse } from 'next/server';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import formidable, { IncomingForm } from 'formidable';

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

  // Haetaan pyynnön data binäärimuodossa
  const bodyBuffer = Buffer.from(await req.arrayBuffer());

  // Luodaan PassThrough-stream, johon asetetaan tarvittavat headerit
  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';
  const stream = new PassThrough();
  stream.headers = {
    'content-type': contentType,
    'content-length': contentLength,
  };
  stream.end(bodyBuffer);

  return new Promise<Response>((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
    });

    form.parse(stream, (err, fields, files) => {
      if (err) {
        console.error('Tiedoston jäsentäminen epäonnistui:', err);
        resolve(NextResponse.json({ error: 'Tiedoston tallennuksessa tapahtui virhe' }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json({ message: 'Tallennus onnistui', file: files.file }));
    });
  });
}
