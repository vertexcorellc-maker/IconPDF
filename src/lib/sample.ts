// Tiny synthetic sample files so people can try a tool without hunting for a document.
// Generated on-device; loaded lazily only when "Try a sample" is clicked.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function samplePdf(variant = 0): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = variant ? rgb(0.92, 0.45, 0.1) : rgb(0, 0.5, 1);
  const pages = 4;
  for (let i = 1; i <= pages; i++) {
    const p = doc.addPage([595, 842]); // A4
    p.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: accent });
    p.drawText(`Sample document ${variant ? 'B' : 'A'}`, { x: 48, y: 805, size: 20, font: bold, color: rgb(1, 1, 1) });
    p.drawText(`Page ${i} of ${pages}`, { x: 48, y: 720, size: 34, font: bold, color: rgb(0.1, 0.1, 0.12) });
    for (let l = 0; l < 14; l++) {
      const w = 420 - ((l * 37 + i * 13) % 140);
      p.drawRectangle({ x: 48, y: 660 - l * 26, width: w, height: 9, color: rgb(0.86, 0.87, 0.9) });
    }
    p.drawRectangle({ x: 48, y: 140, width: 499, height: 120, borderColor: accent, borderWidth: 1.5 });
    p.drawText('Generated locally by IconPDF', { x: 64, y: 196, size: 13, font, color: rgb(0.35, 0.36, 0.4) });
  }
  doc.setTitle(`IconPDF sample ${variant ? 'B' : 'A'}`);
  doc.setAuthor('Jane Example');
  doc.setCreator('IconPDF sample generator');
  doc.setKeywords(['sample', 'demo']);
  const bytes = await doc.save();
  return new File([bytes], `sample-${variant ? 'b' : 'a'}.pdf`, { type: 'application/pdf' });
}

export async function sampleImage(variant = 0): Promise<File> {
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 800;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 1200, 800);
  g.addColorStop(0, variant ? '#1d2b53' : '#0b3d91');
  g.addColorStop(1, variant ? '#ff7849' : '#3ec5ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1200, 800);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(variant ? 860 : 340, 300, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(`Sample image ${variant + 1}`, 80, 700);
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.9));
  return new File([blob], `sample-${variant + 1}.jpg`, { type: 'image/jpeg' });
}
