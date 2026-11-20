// Working name: change it here and it updates everywhere.
export const SITE_NAME = 'IconPDF';
export const SITE_TAGLINE = 'Every PDF tool, right in your browser';

export interface Tool {
  slug: string;
  title: string;
  blurb: string;
  group: 'Organize' | 'Convert' | 'Edit' | 'Secure' | 'AI';
  ready: boolean;
  credits?: boolean; // true = uses AI credits (server-backed), false/undefined = free & local
}

export const TOOLS: Tool[] = [
  // Organize
  { slug: 'merge-pdf', title: 'Merge PDF', blurb: 'Combine files into one, in any order.', group: 'Organize', ready: true },
  { slug: 'organize-pdf', title: 'Organize PDF', blurb: 'Reorder, rotate and delete pages visually.', group: 'Organize', ready: true },
  { slug: 'split-pdf', title: 'Split PDF', blurb: 'Pull out pages or ranges into new files.', group: 'Organize', ready: true },
  { slug: 'multi-page-layout', title: 'Multi-page layout', blurb: 'Put 2, 4 or more pages on one sheet.', group: 'Organize', ready: true },
  // Convert
  { slug: 'jpg-to-pdf', title: 'JPG to PDF', blurb: 'Turn images into a PDF in seconds.', group: 'Convert', ready: true },
  { slug: 'pdf-to-jpg', title: 'PDF to JPG', blurb: 'Save each page as an image.', group: 'Convert', ready: true },
  { slug: 'compress-pdf', title: 'Compress PDF', blurb: 'Shrink file size for easy sharing.', group: 'Convert', ready: true },
  // Edit
  { slug: 'rotate-pdf', title: 'Rotate PDF', blurb: 'Turn pages the right way up.', group: 'Edit', ready: true },
  { slug: 'watermark-pdf', title: 'Watermark', blurb: 'Stamp text over every page.', group: 'Edit', ready: true },
  { slug: 'page-numbers', title: 'Page numbers', blurb: 'Add numbers anywhere on the page.', group: 'Edit', ready: true },
  // Secure
  { slug: 'sign-pdf', title: 'Sign PDF', blurb: 'Draw or type your signature and place it.', group: 'Secure', ready: true },
  { slug: 'clean-metadata', title: 'Clean metadata', blurb: 'Strip author, dates and hidden data before sharing.', group: 'Secure', ready: true },
  { slug: 'sanitize-pdf', title: 'Sanitize PDF', blurb: 'Strip JavaScript, embedded files and auto-run actions.', group: 'Secure', ready: true },
  { slug: 'protect-pdf', title: 'Protect PDF', blurb: 'Lock a PDF with a password.', group: 'Secure', ready: false },
  { slug: 'redact-pdf', title: 'Redact PDF', blurb: 'Truly remove sensitive text, not just cover it.', group: 'Secure', ready: false },
  // AI (credit-based, added later)
  { slug: 'ocr-pdf', title: 'OCR PDF', blurb: 'Make scanned PDFs searchable. Free, on your device.', group: 'AI', ready: false },
  { slug: 'translate-pdf', title: 'Translate PDF', blurb: 'Translate a document with AI.', group: 'AI', ready: false, credits: true },
  { slug: 'summarize-pdf', title: 'Summarize PDF', blurb: 'Get the key points with AI.', group: 'AI', ready: false, credits: true },
];

export const GROUPS = ['Organize', 'Convert', 'Edit', 'Secure', 'AI'] as const;
