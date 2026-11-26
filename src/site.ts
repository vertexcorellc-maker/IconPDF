// Working name: change it here and it updates everywhere.
export const SITE_NAME = 'IconPDF';
export const SITE_TAGLINE = 'Every PDF tool, right in your browser';

export interface Tool {
  slug: string;
  title: string;
  /** Full sentence — used for SEO/structured data. */
  blurb: string;
  /** ≤5-word action line shown on cards. */
  short: string;
  /** Extra search terms for the home filter ("shrink", "metadata", …). */
  keywords?: string;
  group: 'Organize' | 'Convert' | 'Edit' | 'Secure' | 'AI';
  ready: boolean;
  credits?: boolean; // true = uses AI credits (server-backed), false/undefined = free & local
}

export const TOOLS: Tool[] = [
  // Organize
  { slug: 'merge-pdf', title: 'Merge PDF', short: 'Combine files into one', keywords: 'join combine append images', blurb: 'Combine files into one, in any order.', group: 'Organize', ready: true },
  { slug: 'organize-pdf', title: 'Organize PDF', short: 'Reorder, rotate, delete pages', keywords: 'reorder sort delete pages arrange', blurb: 'Reorder, rotate and delete pages visually.', group: 'Organize', ready: true },
  { slug: 'split-pdf', title: 'Split PDF', short: 'Extract pages or ranges', keywords: 'extract separate pages range cut', blurb: 'Pull out pages or ranges into new files.', group: 'Organize', ready: true },
  { slug: 'multi-page-layout', title: 'Multi-page layout', short: 'Several pages per sheet', keywords: 'n-up multi page layout print booklet 2-up 4-up', blurb: 'Put 2, 4 or more pages on one sheet.', group: 'Organize', ready: true },
  // Convert
  { slug: 'jpg-to-pdf', title: 'JPG to PDF', short: 'Images into a PDF', keywords: 'image png photo convert', blurb: 'Turn images into a PDF in seconds.', group: 'Convert', ready: true },
  { slug: 'pdf-to-jpg', title: 'PDF to JPG', short: 'Pages as images', keywords: 'image png export convert', blurb: 'Save each page as an image.', group: 'Convert', ready: true },
  { slug: 'compress-pdf', title: 'Compress PDF', short: 'Shrink file size', keywords: 'shrink reduce smaller size optimize', blurb: 'Shrink file size for easy sharing.', group: 'Convert', ready: true },
  // Edit
  { slug: 'rotate-pdf', title: 'Rotate PDF', short: 'Turn pages upright', keywords: 'turn flip orientation', blurb: 'Turn pages the right way up.', group: 'Edit', ready: true },
  { slug: 'watermark-pdf', title: 'Watermark', short: 'Stamp text on pages', keywords: 'stamp confidential draft text overlay', blurb: 'Stamp text over every page.', group: 'Edit', ready: true },
  { slug: 'page-numbers', title: 'Page numbers', short: 'Number every page', keywords: 'number paginate footer header', blurb: 'Add numbers anywhere on the page.', group: 'Edit', ready: true },
  // Secure
  { slug: 'sign-pdf', title: 'Sign PDF', short: 'Draw or type signature', keywords: 'signature esign autograph', blurb: 'Draw or type your signature and place it.', group: 'Secure', ready: true },
  { slug: 'clean-metadata', title: 'Clean metadata', short: 'Strip author and dates', keywords: 'metadata exif author privacy remove properties', blurb: 'Strip author, dates and hidden data before sharing.', group: 'Secure', ready: true },
  { slug: 'sanitize-pdf', title: 'Sanitize PDF', short: 'Remove scripts and attachments', keywords: 'javascript malware safe strip actions embedded', blurb: 'Strip JavaScript, embedded files and auto-run actions.', group: 'Secure', ready: true },
  { slug: 'protect-pdf', title: 'Protect PDF', short: 'Password-lock a PDF', blurb: 'Lock a PDF with a password.', group: 'Secure', ready: false },
  { slug: 'redact-pdf', title: 'Redact PDF', short: 'Truly remove sensitive text', blurb: 'Truly remove sensitive text, not just cover it.', group: 'Secure', ready: false },
  // AI (credit-based, added later)
  { slug: 'ocr-pdf', title: 'OCR PDF', short: 'Make scans searchable', blurb: 'Make scanned PDFs searchable. Free, on your device.', group: 'AI', ready: false },
  { slug: 'translate-pdf', title: 'Translate PDF', short: 'Translate a document', blurb: 'Translate a document with AI.', group: 'AI', ready: false, credits: true },
  { slug: 'summarize-pdf', title: 'Summarize PDF', short: 'Get the key points', blurb: 'Get the key points with AI.', group: 'AI', ready: false, credits: true },
];

export const GROUPS = ['Organize', 'Convert', 'Edit', 'Secure', 'AI'] as const;

// Which dropped file kinds each ready tool can act on — drives the home drop-first picker
// and the "chain to another tool" pills on result cards.
export const TOOL_ACCEPTS: Record<string, Array<'pdf' | 'image'>> = {
  'merge-pdf': ['pdf', 'image'],
  'organize-pdf': ['pdf'],
  'split-pdf': ['pdf'],
  'multi-page-layout': ['pdf'],
  'jpg-to-pdf': ['image'],
  'pdf-to-jpg': ['pdf'],
  'compress-pdf': ['pdf'],
  'rotate-pdf': ['pdf'],
  'watermark-pdf': ['pdf'],
  'page-numbers': ['pdf'],
  'sign-pdf': ['pdf'],
  'clean-metadata': ['pdf'],
  'sanitize-pdf': ['pdf'],
};

// Tools offered as one-click next steps after a PDF result, in priority order.
export const CHAIN_ORDER = [
  'compress-pdf',
  'sanitize-pdf',
  'clean-metadata',
  'sign-pdf',
  'page-numbers',
  'watermark-pdf',
  'organize-pdf',
  'split-pdf',
];

// Crisp 24px stroke icons, one per tool (inherit currentColor).
const S = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const TOOL_ICON: Record<string, string> = {
  'merge-pdf': S('<rect x="3" y="4" width="8" height="11" rx="1.5"/><rect x="13" y="4" width="8" height="11" rx="1.5"/><path d="M7 15v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M12 19v2"/>'),
  'organize-pdf': S('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="8" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 17.5h7"/><path d="m18.5 15 2.5 2.5-2.5 2.5"/>'),
  'split-pdf': S('<path d="M6 3h7l5 5v4"/><path d="M13 3v5h5"/><path d="M6 3v18h6"/><path d="M15 15l6 6"/><path d="M21 15l-6 6"/>'),
  'multi-page-layout': S('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/>'),
  'jpg-to-pdf': S('<rect x="3" y="4" width="11" height="10" rx="1.5"/><circle cx="7" cy="8" r="1.2"/><path d="m3 13 3.5-3 3 2.5L12 10l2 2"/><path d="M17 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-2"/>'),
  'pdf-to-jpg': S('<path d="M5 3h7l4 4v5"/><path d="M12 3v4h4"/><path d="M5 3v14h4"/><rect x="12" y="13" width="9" height="8" rx="1.5"/><path d="m12 20 3-2.5 2 1.5 1.5-1 2.5 2"/>'),
  'compress-pdf': S('<path d="M12 3v6"/><path d="m9 6 3 3 3-3"/><path d="M12 21v-6"/><path d="m9 18 3-3 3 3"/><path d="M4 12h16"/>'),
  'rotate-pdf': S('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  'watermark-pdf': S('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="m9 16 6-6"/><path d="M9 10h.01"/><path d="M15 16h.01"/>'),
  'page-numbers': S('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M11 13l1.5-1V18"/><path d="M10.5 18h3.5"/>'),
  'sign-pdf': S('<path d="M3 17c3-4 5-9 7-9s-1 9 2 9 3-4 5-4 2 3 4 3"/><path d="M3 21h18"/>'),
  'clean-metadata': S('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6"/><path d="M9 16h4"/><path d="m3 3 18 18"/>'),
  'sanitize-pdf': S('<path d="M12 3 4 6v6c0 4.5 3.4 7.8 8 9 4.6-1.2 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  'protect-pdf': S('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  'redact-pdf': S('<path d="M6 3h9l4 4v14H6z"/><rect x="8.5" y="11" width="7" height="2.4" rx=".5" fill="currentColor"/><path d="M8.5 16.5h4"/>'),
  'ocr-pdf': S('<path d="M4 8V5a1 1 0 0 1 1-1h3"/><path d="M16 4h3a1 1 0 0 1 1 1v3"/><path d="M20 16v3a1 1 0 0 1-1 1h-3"/><path d="M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 10h8"/><path d="M8 14h5"/>'),
  'translate-pdf': S('<path d="M4 5h8"/><path d="M8 3v2"/><path d="M5.5 5c.8 3 3 5.5 6 6.5"/><path d="M10.5 5c-.8 3.5-3 6-6 7"/><path d="m13 21 4-9 4 9"/><path d="M14.5 18h5"/>'),
  'summarize-pdf': S('<path d="M4 6h16"/><path d="M4 10h12"/><path d="M4 14h8"/><path d="m16 15 1 2.5 2.5 1-2.5 1L16 22l-1-2.5-2.5-1 2.5-1z"/>'),
};
