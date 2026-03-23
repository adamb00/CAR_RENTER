import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';

type BuildContractPdfInput = {
  contractText: string;
  signerName?: string | null;
  signedAt?: Date | null;
  renterSignatureDataUrl?: string | null;
  lessorSignatureDataUrl?: string | null;
};

const FONT_REGULAR_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'NotoSans-Regular.ttf'
);

const FONT_BOLD_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'NotoSans-Bold.ttf'
);

const parseDataUrl = (dataUrl?: string | null) => {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], 'base64');
};

const splitContractText = (contractText: string) => {
  const lines = contractText.split('\n');
  const title = lines[0]?.trim() || 'Rental agreement';
  const body =
    lines.length >= 3 && lines[1]?.trim() === ''
      ? lines.slice(2).join('\n')
      : lines.slice(1).join('\n');

  return {
    title,
    body: body.trim() || contractText,
  };
};

export async function buildContractPdf({
  contractText,
  signerName,
  signedAt,
  renterSignatureDataUrl,
  lessorSignatureDataUrl,
}: BuildContractPdfInput): Promise<Buffer> {
  if (!fs.existsSync(FONT_REGULAR_PATH) || !fs.existsSync(FONT_BOLD_PATH)) {
    throw new Error('Missing PDF font files.');
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => buffers.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  doc.registerFont('contract-regular', FONT_REGULAR_PATH);
  doc.registerFont('contract-bold', FONT_BOLD_PATH);

  const { title, body } = splitContractText(contractText);
  doc.font('contract-bold').fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  doc.font('contract-regular').fontSize(11).text(body, {
    align: 'left',
    lineGap: 3,
  });

  doc.moveDown(1.5);
  doc.font('contract-bold').fontSize(13).text('Signatures');
  doc.moveDown(0.5);

  const drawSignature = (label: string, dataUrl?: string | null) => {
    doc.font('contract-bold').fontSize(11).text(label);
    const signature = parseDataUrl(dataUrl);
    if (signature) {
      const startX = doc.x;
      const startY = doc.y;
      doc.image(signature, startX, startY, {
        fit: [220, 90],
      });
      doc.moveDown(5);
    } else {
      doc.font('contract-regular').fontSize(10).text('No signature provided.');
      doc.moveDown();
    }
  };

  drawSignature('Renter signature', renterSignatureDataUrl);
  drawSignature('Lessor signature', lessorSignatureDataUrl);

  if (signerName && signedAt) {
    doc.font('contract-regular').fontSize(10);
    doc.text(`Signed by: ${signerName}`);
    doc.text(`Signed at: ${signedAt.toISOString()}`);
  } else {
    doc.font('contract-regular').fontSize(10).text('Status: Waiting for renter signature');
  }

  doc.end();
  return done;
}
