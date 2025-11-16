/**
 * Import Reading Data from PDF
 *
 * This script extracts reading log data from PDF files and imports it to Firestore.
 * Usage: node scripts/import-pdf.js <path-to-pdf> <readerId>
 *
 * NOTE: This is a template script. PDF parsing logic needs to be customized
 * based on the actual PDF format once sample files are provided.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'reading-tracker-7a90d-firebase-adminsdk-fbsvc-faf1deb0b4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'reading-tracker-7a90d'
});

const db = admin.firestore();

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const MONTH_LOOKUP = MONTH_NAMES.reduce((map, month, index) => {
  map[month.toLowerCase()] = index + 1;
  return map;
}, {});

const HEADER_STRINGS = new Set([
  'The Log',
  'Title & Author',
  'Title & Author \tAdded On \tLog Type Log Value',
  'Added On',
  'Log Type',
  'Log Value'
]);

const FOOTER_PATTERNS = [/^--\s*\d+\s+of\s+\d+\s*--$/i, /^Page\s+\d+/i];

const DATE_LINE_REGEX = /^(?<date>[A-Za-z]+ \d{1,2}, \d{4})\s+(?<type>[A-Za-z ]+?)\s+(?<value>[\d,.]+)$/;
const TITLE_AND_DATE_REGEX = /^(?<prefix>.+?)\s+(?<date>[A-Za-z]+ \d{1,2}, \d{4})\s+(?<type>[A-Za-z ]+?)\s+(?<value>[\d,.]+)$/;

const LOG_TYPE_MAP = {
  minutes: 'minutes',
  minute: 'minutes',
  pages: 'pages',
  page: 'pages',
  books: 'books',
  book: 'books'
};

function shouldSkipLine(line) {
  if (!line) {
    return true;
  }
  if (HEADER_STRINGS.has(line)) {
    return true;
  }
  if (line.startsWith('Summary -')) {
    return true;
  }
  if (line.startsWith('Books Completed')) {
    return true;
  }
  if (line.includes('Your Beanstack site is in Sandbox')) {
    return true;
  }
  return FOOTER_PATTERNS.some((pattern) => pattern.test(line));
}

function normalizeLogType(rawType) {
  if (!rawType) {
    return null;
  }
  const normalized = LOG_TYPE_MAP[rawType.trim().toLowerCase()];
  return normalized || null;
}

function formatLongDate(dateStr) {
  const match = dateStr.match(/^([A-Za-z]+) (\d{1,2}), (\d{4})$/);
  if (!match) {
    throw new Error(`Invalid date value: "${dateStr}"`);
  }
  const [, monthName, dayStr, yearStr] = match;
  const month = MONTH_LOOKUP[monthName.toLowerCase()];
  if (!month) {
    throw new Error(`Unknown month "${monthName}" in date "${dateStr}"`);
  }
  const day = parseInt(dayStr, 10);
  const year = parseInt(yearStr, 10);
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

async function getPdfLines(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buffer });

  let text = '';
  try {
    const pdfData = await parser.getText();
    text = pdfData.text;
  } finally {
    await parser.destroy().catch(() => {});
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\u000c/g, '').trim())
    .filter((line) => line.length > 0)
    .filter((line) => !shouldSkipLine(line));
}

function buildLogsFromLines(lines) {
  const logs = [];
  let titleParts = [];
  let authorParts = [];

  const resetBuffers = () => {
    titleParts = [];
    authorParts = [];
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (shouldSkipLine(line)) {
      continue;
    }

    const combinedMatch = TITLE_AND_DATE_REGEX.exec(line);
    if (combinedMatch) {
      const prefix = combinedMatch.groups.prefix.trim();
      const date = combinedMatch.groups.date.trim();
      const type = combinedMatch.groups.type.trim();
      const valueRaw = combinedMatch.groups.value.trim();

      let bookTitle = titleParts.length ? titleParts.join(' ').trim() : '';
      let bookAuthor = authorParts.length ? authorParts.join(' ').trim() : '';

      if (!bookTitle) {
        bookTitle = prefix;
      } else if (!bookAuthor) {
        bookAuthor = prefix;
      }

      const logType = normalizeLogType(type);
      if (!logType) {
        console.warn(`Skipping entry "${bookTitle}" due to unknown log type "${type}"`);
        resetBuffers();
        continue;
      }

      const value = parseInt(valueRaw.replace(/[^\d]/g, ''), 10);
      if (Number.isNaN(value)) {
        console.warn(`Skipping entry "${bookTitle}" due to invalid log value "${valueRaw}"`);
        resetBuffers();
        continue;
      }

      logs.push({
        bookTitle,
        logDateString: formatLongDate(date),
        logType,
        value,
        ...(bookAuthor ? { bookAuthor } : {})
      });

      resetBuffers();
      continue;
    }

    const dateMatch = DATE_LINE_REGEX.exec(line);
    if (dateMatch) {
      const date = dateMatch.groups.date.trim();
      const type = dateMatch.groups.type.trim();
      const valueRaw = dateMatch.groups.value.trim();

      const bookTitle = titleParts.join(' ').trim();
      const bookAuthor = authorParts.join(' ').trim();

      if (!bookTitle) {
        console.warn(`Skipping entry due to missing title before date "${date}"`);
        resetBuffers();
        continue;
      }

      const logType = normalizeLogType(type);
      if (!logType) {
        console.warn(`Skipping entry "${bookTitle}" due to unknown log type "${type}"`);
        resetBuffers();
        continue;
      }

      const value = parseInt(valueRaw.replace(/[^\d]/g, ''), 10);
      if (Number.isNaN(value)) {
        console.warn(`Skipping entry "${bookTitle}" due to invalid log value "${valueRaw}"`);
        resetBuffers();
        continue;
      }

      logs.push({
        bookTitle,
        logDateString: formatLongDate(date),
        logType,
        value,
        ...(bookAuthor ? { bookAuthor } : {})
      });

      resetBuffers();
      continue;
    }

    const nextLine = lines[index + 1] || '';
    const isNextDateLine = DATE_LINE_REGEX.test(nextLine) || TITLE_AND_DATE_REGEX.test(nextLine);

    if (titleParts.length > 0 && !authorParts.length && isNextDateLine) {
      authorParts.push(line);
    } else {
      titleParts.push(line);
    }
  }

  return logs;
}

/**
 * Parse PDF file and extract reading log data
 */
async function parsePDF(pdfPath) {
  console.log(`Parsing PDF: ${pdfPath}`);

  const lines = await getPdfLines(pdfPath);
  if (lines.length === 0) {
    throw new Error('No log entries were found in the PDF');
  }

  const logs = buildLogsFromLines(lines);

  console.log(`Extracted ${logs.length} log entries from PDF`);
  return logs;
}

/**
 * Import logs to Firestore
 */
async function importLogs(readerId, logs) {
  console.log(`Importing ${logs.length} logs for reader: ${readerId}`);

  const logsRef = db.collection(`readers/${readerId}/logs`);
  const batchId = `pdf-import-${Date.now()}`;
  let imported = 0;

  for (const log of logs) {
    try {
      const logData = {
        readerId,
        logDate: admin.firestore.Timestamp.fromDate(new Date(`${log.logDateString}T00:00:00Z`)),
        logDateString: log.logDateString,
        logType: log.logType,
        value: log.value,
        source: {
          name: 'pdf-import',
          details: `Imported from PDF via import-pdf.js`
        },
        importBatchId: batchId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'pdf-import-script',
        updatedBy: 'pdf-import-script'
      };

      // Add book metadata if present
      if (log.bookTitle) {
        logData.bookTitle = log.bookTitle;
      }
      if (log.bookAuthor) {
        logData.bookAuthor = log.bookAuthor;
      }

      await logsRef.add(logData);
      imported++;

      if (imported % 100 === 0) {
        console.log(`Imported ${imported} logs...`);
      }
    } catch (err) {
      console.error(`Failed to import log:`, log, err);
    }
  }

  console.log(`\n✅ Successfully imported ${imported} logs`);

  // Create batch metadata
  const batchRef = db.collection(`readers/${readerId}/importBatches`).doc(batchId);
  await batchRef.set({
    batchId,
    readerId,
    source: {
      name: 'pdf-import',
      details: 'Bulk import from PDF file'
    },
    totalRows: imported,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'pdf-import-script'
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRunIndex = args.indexOf('--dry-run');

  const isDryRun = dryRunIndex !== -1;
  if (isDryRun) {
    args.splice(dryRunIndex, 1);
  }

  if (args.length < 2) {
    console.log(`
Usage: node scripts/import-pdf.js <path-to-pdf> <readerId>

Example:
  node scripts/import-pdf.js "/path/to/mia-reading.pdf" mia
  node scripts/import-pdf.js "/path/to/emy.pdf" emy --dry-run

Valid readerIds: luke, mia, emy
Use the --dry-run flag to preview parsed entries without writing to Firestore.

    `);
    process.exit(1);
  }

  const [pdfPath, readerId] = args;

  if (!['luke', 'mia', 'emy'].includes(readerId)) {
    console.error(`Error: Invalid readerId "${readerId}". Must be one of: luke, mia, emy`);
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  try {
    const logs = await parsePDF(pdfPath);
    if (logs.length === 0) {
      console.warn('No logs found in PDF. Exiting.');
      process.exit(0);
    }

    if (isDryRun) {
      console.log('\nDry run enabled - not writing to Firestore.');
      console.log(`Previewing first 5 entries:`);
      logs.slice(0, 5).forEach((log, index) => {
        console.log(`\nEntry ${index + 1}`);
        console.log(JSON.stringify(log, null, 2));
      });
      console.log(`\nTotal parsed logs: ${logs.length}`);
    } else {
      await importLogs(readerId, logs);
      console.log('✅ Import complete!');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
