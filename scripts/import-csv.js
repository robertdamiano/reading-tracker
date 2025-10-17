/**
 * CSV Import Script for Reading Tracker
 *
 * Imports reading logs from CSV file into Firestore.
 *
 * Usage: node scripts/import-csv.js <path-to-csv> [reader-id]
 * Example: node scripts/import-csv.js "Untitled spreadsheet - Sheet1.csv" luke
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'reading-tracker-7a90d-firebase-adminsdk-fbsvc-faf1deb0b4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'reading-tracker-7a90d'
});

const db = admin.firestore();

/**
 * Parse CSV file into array of objects
 */
function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });

    data.push(row);
  }

  return data;
}

/**
 * Convert M/D/YYYY to YYYY-MM-DD
 */
function parseDateString(dateStr) {
  const [month, day, year] = dateStr.split('/');
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Import CSV data into Firestore
 */
async function importCSV(csvPath, readerId = 'luke') {
  console.log(`\n📖 Starting import for reader: ${readerId}`);
  console.log(`📁 CSV file: ${csvPath}\n`);

  // Parse CSV
  const rows = parseCSV(csvPath);
  console.log(`✅ Parsed ${rows.length} rows from CSV\n`);

  // Create batch metadata
  const batchId = `csv-import-${Date.now()}`;
  const batchRef = db.collection(`readers/${readerId}/importBatches`).doc(batchId);

  const stats = {
    minutes: 0,
    pages: 0,
    books: 0
  };

  let importedCount = 0;
  let errorCount = 0;

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      // Parse date
      const logDateString = parseDateString(row.Date);
      const logDate = admin.firestore.Timestamp.fromDate(new Date(`${logDateString}T00:00:00Z`));

      // Parse log type (convert to lowercase)
      const logType = row['Log Type'].toLowerCase();

      // Parse value
      const value = parseFloat(row['Log Value']);

      if (isNaN(value)) {
        console.error(`❌ Row ${i + 2}: Invalid value "${row['Log Value']}"`);
        errorCount++;
        continue;
      }

      // Update stats
      if (logType === 'minutes') stats.minutes += value;
      else if (logType === 'pages') stats.pages += value;
      else if (logType === 'books') stats.books += value;

      // Create log document
      const logData = {
        readerId,
        logDate,
        logDateString,
        logType,
        value,
        bookTitle: row.Title || null,
        bookAuthor: row.Author || null,
        source: {
          name: 'csv-import',
          details: `Imported from ${path.basename(csvPath)}`
        },
        importBatchId: batchId,
        importSourceRow: i + 2, // +2 because row 1 is header, and we're 0-indexed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'csv-import-script',
        updatedBy: 'csv-import-script'
      };

      // Remove null values
      Object.keys(logData).forEach(key => {
        if (logData[key] === null) {
          delete logData[key];
        }
      });

      // Write to Firestore
      await db.collection(`readers/${readerId}/logs`).add(logData);

      importedCount++;

      // Progress indicator
      if (importedCount % 10 === 0) {
        console.log(`📊 Imported ${importedCount}/${rows.length} rows...`);
      }

    } catch (error) {
      console.error(`❌ Error importing row ${i + 2}:`, error.message);
      errorCount++;
    }
  }

  // Write batch metadata
  await batchRef.set({
    batchId,
    readerId,
    source: {
      name: 'csv-import',
      details: `Imported from ${path.basename(csvPath)}`
    },
    totalRows: importedCount,
    errorRows: errorCount,
    totals: stats,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'csv-import-script'
  });

  console.log(`\n✅ Import complete!`);
  console.log(`   - Successfully imported: ${importedCount} logs`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Total minutes: ${stats.minutes}`);
  console.log(`   - Total pages: ${stats.pages}`);
  console.log(`   - Total books: ${stats.books}`);
  console.log(`   - Batch ID: ${batchId}\n`);
}

// Main execution
const csvPath = process.argv[2];
const readerId = process.argv[3] || 'luke';

if (!csvPath) {
  console.error('❌ Error: Please provide a CSV file path');
  console.log('Usage: node scripts/import-csv.js <path-to-csv> [reader-id]');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Error: File not found: ${csvPath}`);
  process.exit(1);
}

importCSV(csvPath, readerId)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
