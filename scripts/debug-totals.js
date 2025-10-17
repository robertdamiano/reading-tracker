/**
 * Debug totals - detailed breakdown
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'reading-tracker-7a90d-firebase-adminsdk-fbsvc-faf1deb0b4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'reading-tracker-7a90d'
});

const db = admin.firestore();

async function debugTotals(readerId = 'luke') {
  console.log(`\n🔍 Debugging totals for reader: ${readerId}\n`);

  const logsRef = db.collection(`readers/${readerId}/logs`);
  const snapshot = await logsRef.orderBy('logDateString').get();

  const stats = {
    minutes: { count: 0, total: 0, entries: [] },
    pages: { count: 0, total: 0, entries: [] },
    books: { count: 0, total: 0, entries: [] }
  };

  snapshot.forEach(doc => {
    const data = doc.data();
    const type = data.logType;

    if (stats[type]) {
      stats[type].count++;
      stats[type].total += data.value;

      // Keep track of all entries for detailed view
      if (stats[type].entries.length < 10 || stats[type].entries.length > snapshot.size - 10) {
        stats[type].entries.push({
          date: data.logDateString,
          value: data.value,
          source: data.source?.name || 'unknown'
        });
      }
    }
  });

  console.log('📊 Summary by Type:');
  console.log(`\nMinutes:`);
  console.log(`   Count: ${stats.minutes.count}`);
  console.log(`   Total: ${stats.minutes.total}`);
  console.log(`\nPages:`);
  console.log(`   Count: ${stats.pages.count}`);
  console.log(`   Total: ${stats.pages.total}`);
  console.log(`\nBooks:`);
  console.log(`   Count: ${stats.books.count}`);
  console.log(`   Total: ${stats.books.total}`);

  console.log(`\n📝 Sample Minutes entries (first 10):`);
  stats.minutes.entries.slice(0, 10).forEach(e => {
    console.log(`   ${e.date}: ${e.value} (${e.source})`);
  });

  console.log(`\n📝 Sample Pages entries (first 10):`);
  stats.pages.entries.slice(0, 10).forEach(e => {
    console.log(`   ${e.date}: ${e.value} (${e.source})`);
  });

  // Check for any unusual values
  console.log(`\n🔍 Checking for data issues...`);
  let issues = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!data.logType) {
      console.log(`   ⚠️  Missing logType: ${doc.id}`);
      issues++;
    }
    if (typeof data.value !== 'number') {
      console.log(`   ⚠️  Non-numeric value: ${doc.id} - ${data.value}`);
      issues++;
    }
    if (data.value < 0) {
      console.log(`   ⚠️  Negative value: ${doc.id} - ${data.value}`);
      issues++;
    }
  });

  if (issues === 0) {
    console.log(`   ✅ No data issues found`);
  }

  console.log('\n');
  process.exit(0);
}

debugTotals('luke');
