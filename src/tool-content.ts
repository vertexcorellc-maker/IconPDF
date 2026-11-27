// Long-form, per-tool page content: visible "how to" steps, explainer sections and FAQs.
// The same data feeds the HowTo + FAQPage JSON-LD in Base.astro, so what search engines
// and AI assistants read always matches what people see on the page.
// Keep every claim true to what the tool actually does in src/tools/*.

export interface Step {
  name: string;
  text: string;
}
export interface Section {
  h: string;
  p?: string[];
  list?: string[];
}
export interface Faq {
  q: string;
  a: string;
}
export interface ToolContent {
  /** Verb phrase for the HowTo title: "How to {howTo}". */
  howTo: string;
  steps: Step[];
  sections: Section[];
  faq: Faq[];
  related: string[];
}

// Answers shared by every PDF tool, appended after each tool's own questions.
const privacyFaq = (verb: string): Faq => ({
  q: `Is it safe to ${verb} here? Are my files uploaded?`,
  a: `Yes, it's safe, and no, nothing is uploaded. IconPDF runs entirely in your web browser, so your file is opened, processed and saved on your own device. It never travels to a server, which means there is no copy for anyone to keep, leak or read.`,
});
const freeFaq: Faq = {
  q: 'Is it really free? Is there a file size or daily limit?',
  a: "It's completely free with no account, no watermark on your output and no daily limit. Because the work happens on your device rather than our servers, there's no artificial size cap either; very large files are limited only by your device's memory.",
};
const offlineFaq: Faq = {
  q: 'Does it work offline or on my phone?',
  a: 'Yes. It works in any modern browser on Windows, Mac, Linux, Android or iPhone. Once the page has loaded, the processing itself needs no internet connection.',
};
const lockedFaq: Faq = {
  q: 'Can I use a password-protected PDF?',
  a: "Not yet. If your PDF needs a password to open, or has editing restrictions, remove the protection in your PDF reader first, then open it here.",
};

export const TOOL_CONTENT: Record<string, ToolContent> = {
  'merge-pdf': {
    howTo: 'merge PDF files into one',
    steps: [
      { name: 'Add your files', text: 'Drop in two or more PDFs, or click to choose them. You can mix in JPG and PNG images too; each image becomes its own page.' },
      { name: 'Put them in order', text: 'Drag the file cards into the order you want them to appear in the final document.' },
      { name: 'Merge and download', text: 'Click Merge. The combined PDF is built in your browser and downloads straight away.' },
    ],
    sections: [
      {
        h: 'Combine PDFs without uploading them',
        p: [
          'Most online PDF mergers send every file you add to a remote server, merge them there and send the result back. IconPDF does the whole job inside your browser tab, so contracts, bank statements, medical records and anything else you combine stay on your own computer.',
          'Pages are copied across exactly as they are, so text stays selectable, links keep working and nothing is re-compressed or reduced in quality.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Joining scanned pages or chapters into a single document',
          'Combining invoices, receipts or statements for an expense claim or tax return',
          'Putting a cover letter, CV and certificates into one application PDF',
          'Turning photos of documents into pages alongside existing PDFs',
        ],
      },
    ],
    faq: [
      { q: 'How many PDFs can I merge at once?', a: "As many as you like. There's no file count limit; very large batches are only limited by your device's memory." },
      { q: 'Can I merge images and PDFs together?', a: 'Yes. Add JPG or PNG images alongside your PDFs and each image is added as a page in the order you set.' },
      { q: 'Will merging reduce the quality of my PDFs?', a: 'No. Pages are copied into the new file as they are, without re-rendering, so text, images and links stay exactly as they were.' },
      privacyFaq('merge PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['organize-pdf', 'compress-pdf', 'split-pdf', 'jpg-to-pdf'],
  },

  'organize-pdf': {
    howTo: 'reorder, rotate and delete PDF pages',
    steps: [
      { name: 'Open your PDF', text: 'Choose a PDF and every page appears as a thumbnail.' },
      { name: 'Rearrange the pages', text: 'Drag thumbnails to reorder them, use the rotate button to turn a page, or the delete button to remove it.' },
      { name: 'Apply and download', text: 'Click Apply. The reorganised PDF is rebuilt in your browser and downloads.' },
    ],
    sections: [
      {
        h: 'Edit page order visually',
        p: [
          'Seeing every page at once makes it easy to spot a scan that came out of order, a blank page or a sideways sheet. Fix them all in one pass and save a clean copy.',
          'Pages you keep are carried over unchanged, so text stays searchable and selectable.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Fixing the page order of a scanned document',
          'Removing blank, duplicate or unwanted pages',
          'Turning sideways or upside-down pages the right way up',
          'Moving an appendix or cover page to where it belongs',
        ],
      },
    ],
    faq: [
      { q: 'Can I delete pages from a PDF?', a: 'Yes. Click the delete button on any page thumbnail and it is left out of the saved file. Your original file is not changed.' },
      { q: 'Can I rotate just one page?', a: 'Yes. Each thumbnail has its own rotate button, so you can turn individual pages without affecting the rest.' },
      privacyFaq('edit PDF pages'),
      freeFaq,
      lockedFaq,
    ],
    related: ['split-pdf', 'rotate-pdf', 'merge-pdf', 'page-numbers'],
  },

  'split-pdf': {
    howTo: 'split a PDF and extract pages',
    steps: [
      { name: 'Open your PDF', text: 'Choose a PDF and every page appears as a thumbnail.' },
      { name: 'Select pages', text: 'Click the pages you want to keep. Click again to deselect.' },
      { name: 'Extract or split', text: 'Choose Extract to put the selected pages into one new PDF, or Separate files to save each selected page as its own PDF, bundled in a ZIP.' },
    ],
    sections: [
      {
        h: 'Two ways to split',
        list: [
          'Extract: the pages you pick are saved together as one new, shorter PDF.',
          'Separate files: each page you pick becomes its own single-page PDF, downloaded together as a ZIP.',
        ],
      },
      {
        h: 'Share only what you need',
        p: [
          "Sending a whole document when someone only needs two pages shares more than you mean to. Pull out just the relevant pages, without uploading the full file anywhere, and the rest stays private.",
        ],
      },
    ],
    faq: [
      { q: 'How do I extract specific pages from a PDF?', a: 'Open the PDF, click the pages you want so they are selected, then choose Extract. Those pages are saved into a new PDF in their original order.' },
      { q: 'Can I split a PDF into single pages?', a: 'Yes. Select the pages you want and choose Separate files. Each page is saved as its own PDF inside a ZIP download.' },
      { q: 'Does splitting change the quality?', a: 'No. Pages are copied as they are, so text stays selectable and images keep their original quality.' },
      privacyFaq('split PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['organize-pdf', 'merge-pdf', 'pdf-to-jpg', 'compress-pdf'],
  },

  'multi-page-layout': {
    howTo: 'print multiple PDF pages per sheet',
    steps: [
      { name: 'Open your PDF', text: 'Choose the PDF you want to condense.' },
      { name: 'Choose pages per sheet', text: 'Pick 2, 4, 6 or 9 pages per sheet.' },
      { name: 'Create and download', text: 'Click Create. Your pages are arranged in order on A4 sheets and the new PDF downloads.' },
    ],
    sections: [
      {
        h: 'Fewer sheets, same content',
        p: [
          'Putting several pages on one sheet (often called N-up printing) is the easiest way to save paper and ink, or to turn slide decks into compact handouts and study notes.',
          'Because the result is a normal PDF, it prints the same way on any printer and you can share it without anyone needing special print settings.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Lecture slides and presentation handouts',
          'Revision notes and reading packs',
          'Proofing long documents on fewer pages',
          'Cutting printing costs',
        ],
      },
    ],
    faq: [
      { q: 'What page size is the output?', a: 'Pages are arranged on A4 sheets, scaled to fit each slot while keeping their proportions.' },
      { q: 'How many pages can I fit on one sheet?', a: 'You can choose 2, 4, 6 or 9 pages per sheet. Four is a good balance between saving paper and keeping text readable.' },
      privacyFaq('lay out PDF pages'),
      freeFaq,
      lockedFaq,
    ],
    related: ['organize-pdf', 'compress-pdf', 'page-numbers', 'merge-pdf'],
  },

  'jpg-to-pdf': {
    howTo: 'convert JPG images to PDF',
    steps: [
      { name: 'Add your images', text: 'Drop in JPG or PNG images, or click to choose them.' },
      { name: 'Arrange and choose a size', text: 'Drag images into order, then choose whether each page fits the image exactly or uses A4 or Letter, and how much margin to add.' },
      { name: 'Create the PDF', text: 'Click Create PDF. All images become pages in one PDF that downloads straight away.' },
    ],
    sections: [
      {
        h: 'Photos and scans into one tidy document',
        p: [
          'Phone photos of receipts, signed forms or ID documents are easier to send and file as a single PDF. IconPDF builds that PDF in your browser, so personal photos are never uploaded to a conversion server.',
          'Choose Fit to image to keep each page the exact shape of its photo, or A4/Letter for a document that prints cleanly on standard paper.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Turning photographed receipts into one expense PDF',
          'Sending scanned forms or signed pages',
          'Making a portfolio or photo document',
          'Combining screenshots into a single file',
        ],
      },
    ],
    faq: [
      { q: 'Can I convert PNG to PDF as well?', a: 'Yes. Both JPG and PNG images are supported, and you can mix them in one PDF.' },
      { q: 'Can I put several images in one PDF?', a: 'Yes. Add as many images as you like; each becomes a page, in the order you arrange them.' },
      { q: 'Will my photos lose quality?', a: 'No. Images are placed into the PDF at their original resolution.' },
      privacyFaq('convert images'),
      freeFaq,
      offlineFaq,
    ],
    related: ['merge-pdf', 'compress-pdf', 'pdf-to-jpg', 'organize-pdf'],
  },

  'pdf-to-jpg': {
    howTo: 'convert PDF pages to JPG images',
    steps: [
      { name: 'Open your PDF', text: 'Choose a PDF and every page appears as a preview.' },
      { name: 'Pick format and quality', text: 'Choose JPG or PNG, and Normal, High or Max quality.' },
      { name: 'Download', text: 'Click Download. One page saves as a single image; several pages save together as a ZIP.' },
    ],
    sections: [
      {
        h: 'Sharp images of every page',
        p: [
          'Each page is rendered in your browser at the quality you choose, so text and graphics stay crisp. Pick JPG for smaller files that are easy to share, or PNG for lossless images with perfectly sharp text and lines.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Posting a page of a document on social media or in a chat',
          'Adding PDF pages to slides or a website',
          'Saving a single page as a picture to annotate',
          'Creating thumbnails or previews',
        ],
      },
    ],
    faq: [
      { q: 'Should I choose JPG or PNG?', a: 'JPG gives smaller files and suits photos and most documents. PNG is lossless, so it keeps text and line drawings perfectly sharp, at a larger file size.' },
      { q: 'How do I get all pages at once?', a: 'Download all pages and they are packaged into a single ZIP containing one image per page.' },
      { q: 'What resolution are the images?', a: 'Normal, High and Max render pages at roughly 1.5×, 2.5× and 3.5× their on-screen size. Max is best for printing or zooming in.' },
      privacyFaq('convert PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['split-pdf', 'jpg-to-pdf', 'compress-pdf', 'organize-pdf'],
  },

  'compress-pdf': {
    howTo: 'compress a PDF file',
    steps: [
      { name: 'Open your PDF', text: 'Choose the PDF you want to shrink.' },
      { name: 'Choose a compression level', text: 'Pick Strong for the smallest file, Balanced for everyday use, or Light to keep the most detail.' },
      { name: 'Compress and download', text: 'Click Compress. The smaller PDF downloads and the tool shows the original and new size.' },
    ],
    sections: [
      {
        h: 'How the compression works',
        p: [
          'IconPDF re-renders each page as an optimised image and rebuilds the PDF around it. This shrinks scanned documents and photo-heavy files dramatically, often to a fraction of their original size, which is ideal for email attachments and upload forms with size limits.',
          "The trade-off: text in the compressed file looks the same but can no longer be selected or searched. If you need selectable text, keep the original and send the compressed copy only where size matters.",
        ],
      },
      {
        h: 'Which level should I pick?',
        list: [
          'Strong: smallest file, good for email and portals with strict limits.',
          'Balanced: a clear size saving while staying comfortable to read and print.',
          'Light: keeps the most detail, for documents with small print or fine graphics.',
        ],
      },
    ],
    faq: [
      { q: 'How much smaller will my PDF get?', a: 'It depends on the file. Scans and photo-heavy PDFs often shrink by 50–90%. PDFs that are already small or mostly plain text may shrink less, and the tool shows the original and new size side by side when it finishes.' },
      { q: 'Will the text still be selectable?', a: 'No. Compression works by turning each page into an optimised image, so the text looks the same but can no longer be selected or searched.' },
      { q: 'How do I make a PDF small enough to email?', a: 'Open it here and choose Strong compression. Most email services cap attachments at around 20–25 MB, and Strong is designed to get well under that.' },
      privacyFaq('compress PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['merge-pdf', 'split-pdf', 'sanitize-pdf', 'clean-metadata'],
  },

  'rotate-pdf': {
    howTo: 'rotate pages in a PDF',
    steps: [
      { name: 'Open your PDF', text: 'Choose a PDF and every page appears as a thumbnail.' },
      { name: 'Rotate pages', text: 'Use the rotate button on individual pages, or rotate the whole document at once.' },
      { name: 'Apply and download', text: 'Click Apply. The corrected PDF downloads straight from your browser.' },
    ],
    sections: [
      {
        h: 'Fix sideways scans for good',
        p: [
          'Rotating a page in a PDF viewer only changes how you see it. IconPDF saves the new orientation into the file itself, so it opens the right way up for everyone you send it to.',
          'Rotation is lossless: pages are turned, not re-rendered, so text stays sharp and selectable.',
        ],
      },
    ],
    faq: [
      { q: 'Can I rotate only some pages?', a: 'Yes. Each page has its own rotate button, so you can fix one sideways page without touching the rest.' },
      { q: 'Is the rotation saved permanently?', a: 'Yes. The new orientation is written into the downloaded PDF, so it opens correctly in any reader.' },
      privacyFaq('rotate PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['organize-pdf', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  },

  'watermark-pdf': {
    howTo: 'add a watermark to a PDF',
    steps: [
      { name: 'Open your PDF', text: 'Choose the PDF you want to mark.' },
      { name: 'Design the watermark', text: 'Type your text, such as DRAFT or CONFIDENTIAL, then set its size, colour, opacity and angle, centred or tiled. The preview shows the first page.' },
      { name: 'Apply and download', text: 'Click Apply. The watermark is stamped on every page and the PDF downloads.' },
    ],
    sections: [
      {
        h: 'Mark documents before they leave your hands',
        p: [
          'A visible watermark makes the status or ownership of a document obvious at a glance and discourages it being passed on as final or reused without credit.',
          'Use a single diagonal stamp for a clear label, or tile the text across the page so it is harder to crop out.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Marking drafts and work in progress',
          'Labelling confidential or internal documents',
          'Adding your name or company to shared work',
          'Stamping sample or copy on documents you send for review',
        ],
      },
    ],
    faq: [
      { q: 'Can I add a watermark to every page?', a: 'Yes. The watermark is applied to every page of the document in one go.' },
      { q: 'Can I make the watermark transparent?', a: 'Yes. Use the opacity setting to make it as faint or as bold as you like, so the content underneath stays readable.' },
      { q: 'Can I tile the watermark across the page?', a: 'Yes. Choose the Tiled layout to repeat the text across each page, or Centre for a single stamp.' },
      privacyFaq('watermark PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['page-numbers', 'sign-pdf', 'sanitize-pdf', 'compress-pdf'],
  },

  'page-numbers': {
    howTo: 'add page numbers to a PDF',
    steps: [
      { name: 'Open your PDF', text: 'Choose the PDF you want to number.' },
      { name: 'Choose position and style', text: 'Pick one of six positions, a format (1, 1 of N, or Page 1), a size and the number to start from.' },
      { name: 'Apply and download', text: 'Click Apply. Numbers are added to every page and the PDF downloads.' },
    ],
    sections: [
      {
        h: 'Professional numbering in one click',
        p: [
          'Page numbers make long documents easier to navigate, review and discuss: "see page 12" only works if page 12 is labelled. Choose top or bottom, left, centre or right, and a style that suits the document.',
          'Set a custom starting number when your PDF continues from another document or begins after a cover page.',
        ],
      },
      {
        h: 'Good for',
        list: [
          'Reports, theses and dissertations',
          'Contracts and legal bundles',
          'Manuals, handbooks and course packs',
          'Merged documents that need continuous numbering',
        ],
      },
    ],
    faq: [
      { q: 'Can I start numbering from a number other than 1?', a: 'Yes. Set any starting number, which is useful when a document continues from another or after a cover page.' },
      { q: 'Can I use "Page 1 of 10" style numbers?', a: 'Yes. Choose the 1 of N format to show the total page count, or Page 1 for a labelled number.' },
      { q: 'Where can the numbers go?', a: 'Top or bottom of the page, on the left, centre or right.' },
      privacyFaq('number PDF pages'),
      freeFaq,
      lockedFaq,
    ],
    related: ['merge-pdf', 'watermark-pdf', 'organize-pdf', 'sign-pdf'],
  },

  'sign-pdf': {
    howTo: 'sign a PDF online without printing',
    steps: [
      { name: 'Open your PDF', text: 'Choose the PDF and go to the page that needs your signature.' },
      { name: 'Create your signature', text: 'Draw it with your mouse, trackpad or finger, or type your name to use a handwriting-style signature.' },
      { name: 'Place it and save', text: 'Place the signature on the page, drag it into position and set its size, then click Apply to download the signed PDF.' },
    ],
    sections: [
      {
        h: 'No printing, scanning or sign-up',
        p: [
          'Signing a form used to mean print, sign, scan and send. Here you add your signature directly to the PDF in a few seconds, on a computer or phone.',
          "Your signature and your document are never uploaded. Many e-signature sites keep a copy of both on their servers; IconPDF can't, because neither ever leaves your device.",
        ],
      },
      {
        h: 'Good for',
        list: [
          'Rental agreements, offer letters and permission slips',
          'Invoices, delivery notes and timesheets',
          'Forms that ask for a signature before you email them back',
        ],
      },
    ],
    faq: [
      { q: 'Is a drawn signature legally binding?', a: 'In many countries a simple electronic signature like this is accepted for everyday agreements, but rules vary by country and document type. For high-stakes documents, check what the other party requires.' },
      { q: 'Can I sign on my phone?', a: 'Yes. Open the page on your phone, draw your signature with your finger and place it on the document.' },
      { q: 'Can I add more than one signature or initials?', a: 'Each pass adds one signature to one page. To sign several places, apply one, then open the signed file and add the next.' },
      privacyFaq('sign PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['page-numbers', 'watermark-pdf', 'clean-metadata', 'merge-pdf'],
  },

  'clean-metadata': {
    howTo: 'remove metadata from a PDF',
    steps: [
      { name: 'Open your PDF', text: "Choose a PDF and see the hidden details it carries: title, author, subject, keywords, the software used, creation and modification dates, and whether embedded XMP data is present." },
      { name: 'Clean it', text: 'Click Remove all & download. Every one of those fields is wiped and the XMP metadata stream is removed.' },
      { name: 'Download', text: 'The cleaned PDF is re-checked and saved to your device. The visible content of your document is unchanged.' },
    ],
    sections: [
      {
        h: 'What your PDF says about you',
        p: [
          "PDFs quietly record who made them, with what software and when. That can reveal your full name, your employer's software, an internal file title or the date a document was really written, details you may not want to share with a client, landlord or the public.",
          'IconPDF shows you exactly what is there before removing it, and does it in your browser, so the document you want to make private is never uploaded in the process.',
        ],
      },
      {
        h: 'What gets removed',
        list: [
          'Title, author, subject and keywords',
          'Creator and producer (the software used)',
          'Creation and modification dates',
          'The embedded XMP metadata stream',
        ],
      },
    ],
    faq: [
      { q: 'Does removing metadata change my document?', a: 'No. Only the hidden document properties are removed; the pages, text and images look exactly the same.' },
      { q: 'How can I see the metadata in a PDF?', a: 'Open the PDF here and IconPDF lists the hidden properties it found before you clean anything.' },
      { q: 'Does this remove EXIF data from images inside the PDF?', a: 'It removes the document-level properties and XMP metadata stream. Data embedded inside individual images in the PDF is not changed.' },
      privacyFaq('clean PDF metadata'),
      freeFaq,
      lockedFaq,
    ],
    related: ['sanitize-pdf', 'compress-pdf', 'sign-pdf', 'watermark-pdf'],
  },

  'sanitize-pdf': {
    howTo: 'remove JavaScript and hidden content from a PDF',
    steps: [
      { name: 'Open your PDF', text: 'Choose a PDF and IconPDF scans it for active content.' },
      { name: 'Review what was found', text: 'See a list of anything risky: embedded JavaScript, embedded files, auto-run actions when opened and document-level trigger actions.' },
      { name: 'Sanitize and download', text: 'Click Remove all & download to strip it all out. The clean PDF downloads and its pages look the same.' },
    ],
    sections: [
      {
        h: 'Why PDFs can be dangerous',
        p: [
          'A PDF is more than pages. It can contain JavaScript that runs when opened, other files hidden inside it, and actions that fire automatically. These features have long been used to deliver malware and phishing links.',
          'Sanitizing removes that active content, leaving a document that is just a document, safer to open yourself and safer to pass on. The scan runs in your browser, so a suspicious file is never uploaded anywhere.',
        ],
      },
      {
        h: 'What gets removed',
        list: [
          'Embedded JavaScript',
          'Embedded (attached) files',
          'Auto-run actions triggered when the file opens',
          'Document-level trigger actions',
        ],
      },
    ],
    faq: [
      { q: 'How do I know if a PDF has JavaScript in it?', a: 'Open it here. IconPDF scans the file and lists any embedded JavaScript, attached files or automatic actions it finds before changing anything.' },
      { q: 'Will sanitizing change how my PDF looks?', a: 'No. It removes scripts, attachments and automatic actions, not the visible content of your pages.' },
      { q: 'Is this the same as an antivirus scan?', a: 'No. It removes the PDF features most often abused by malware, but it is not a virus scanner. Treat files from unknown senders with care and keep your security software up to date.' },
      privacyFaq('sanitize PDFs'),
      freeFaq,
      lockedFaq,
    ],
    related: ['clean-metadata', 'compress-pdf', 'sign-pdf', 'merge-pdf'],
  },
};
