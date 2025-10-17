/**
 * Fresh Import - Clear existing data and import complete CSV
 *
 * Usage: node scripts/fresh-import.js <path-to-csv> [reader-id]
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'reading-tracker-7a90d-firebase-adminsdk-fbsvc-faf1deb0b4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'reading-tracker-7a90d'
});

const db = admin.firestore();

/**
 * Parse CSV file into array of objects using proper CSV parser
 */
function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records;
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
 * Delete all existing logs and batches
 */
async function clearExistingData(readerId) {
  console.log(`\n🗑️  Clearing existing data for reader: ${readerId}...`);

  // Delete all logs
  const logsRef = db.collection(`readers/${readerId}/logs`);
  const logsSnapshot = await logsRef.get();

  console.log(`   Found ${logsSnapshot.size} existing logs`);

  const deleteBatch = db.batch();
  let deleteCount = 0;

  logsSnapshot.forEach(doc => {
    deleteBatch.delete(doc.ref);
    deleteCount++;

    // Firestore batch limit is 500
    if (deleteCount % 500 === 0) {
      console.log(`   Deleting batch of ${deleteCount} logs...`);
    }
  });

  if (deleteCount > 0) {
    await deleteBatch.commit();
    console.log(`   ✅ Deleted ${deleteCount} logs`);
  }

  // Delete all import batches
  const batchesRef = db.collection(`readers/${readerId}/importBatches`);
  const batchesSnapshot = await batchesRef.get();

  console.log(`   Found ${batchesSnapshot.size} existing import batches`);

  for (const doc of batchesSnapshot.docs) {
    await doc.ref.delete();
  }

  if (batchesSnapshot.size > 0) {
    console.log(`   ✅ Deleted ${batchesSnapshot.size} import batches`);
  }

  console.log(`✅ Clear complete!\n`);
}

/**
 * Import CSV data into Firestore
 */
async function importCSV(csvPath, readerId = 'luke') {
  console.log(`📖 Starting fresh import for reader: ${readerId}`);
  console.log(`📁 CSV file: ${csvPath}\n`);

  // Clear existing data first
  await clearExistingData(readerId);

  // Parse CSV
  const rows = parseCSV(csvPath);
  console.log(`✅ Parsed ${rows.length} rows from CSV\n`);

  // Create batch metadata
  const batchId = `complete-import-${Date.now()}`;
  const batchRef = db.collection(`readers/${readerId}/importBatches`).doc(batchId);

  const stats = {
    minutes: 0,
    pages: 0,
    books: 0
  };

  let importedCount = 0;
  let errorCount = 0;

  // Use Firestore batch writes for efficiency (max 500 per batch)
  let writeBatch = db.batch();
  let batchCount = 0;

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
          name: row.Source || 'csv-import',
          details: `Imported from ${path.basename(csvPath)}`
        },
        importBatchId: batchId,
        importSourceRow: i + 2, // +2 because row 1 is header, and we're 0-indexed
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'fresh-import-script',
        updatedBy: 'fresh-import-script'
      };

      // Remove null values
      Object.keys(logData).forEach(key => {
        if (logData[key] === null) {
          delete logData[key];
        }
      });

      // Add to batch
      const docRef = db.collection(`readers/${readerId}/logs`).doc();
      writeBatch.set(docRef, logData);
      batchCount++;

      importedCount++;

      // Commit batch every 500 documents
      if (batchCount >= 500) {
        await writeBatch.commit();
        console.log(`📊 Committed batch... Total imported: ${importedCount}/${rows.length}`);
        writeBatch = db.batch();
        batchCount = 0;
      }

      // Progress indicator
      if (importedCount % 100 === 0) {
        console.log(`📊 Processed ${importedCount}/${rows.length} rows...`);
      }

    } catch (error) {
      console.error(`❌ Error importing row ${i + 2}:`, error.message);
      errorCount++;
    }
  }

  // Commit any remaining documents
  if (batchCount > 0) {
    await writeBatch.commit();
    console.log(`📊 Committed final batch`);
  }

  // Write batch metadata
  await batchRef.set({
    batchId,
    readerId,
    source: {
      name: 'complete-import',
      details: `Complete import from ${path.basename(csvPath)}`
    },
    totalRows: importedCount,
    errorRows: errorCount,
    totals: stats,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'fresh-import-script'
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
  console.log('Usage: node scripts/fresh-import.js <path-to-csv> [reader-id]');
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
