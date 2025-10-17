/**
 * Verify Firestore Data
 *
 * Queries all reading logs and calculates aggregated statistics
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

/**
 * Calculate current streak from sorted dates
 * Counts consecutive days up to today (allows same-day logging)
 */
function calculateStreak(sortedDates) {
  if (sortedDates.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the most recent date
  const latestDate = new Date(sortedDates[sortedDates.length - 1]);
  latestDate.setHours(0, 0, 0, 0);

  // Check if streak is current (latest entry is today or yesterday)
  // Allow same-day logging by checking if latest is today or yesterday
  const daysSinceLatest = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
  if (daysSinceLatest > 1) {
    return 0; // Streak is broken if more than 1 day gap
  }

  // Count backwards from most recent date
  for (let i = sortedDates.length - 2; i >= 0; i--) {
    const currentDate = new Date(sortedDates[i]);
    currentDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(sortedDates[i + 1]);
    nextDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function verifyData(readerId = 'luke') {
  console.log(`\n📊 Verifying data for reader: ${readerId}\n`);

  try {
    // Fetch all logs
    const logsRef = db.collection(`readers/${readerId}/logs`);
    const snapshot = await logsRef.get();

    console.log(`✅ Found ${snapshot.size} total log entries\n`);

    // Aggregate stats
    const stats = {
      minutes: 0,
      pages: 0,
      books: 0
    };

    const uniqueDates = new Set();
    const allDates = [];
    let latestLogDate = null;

    snapshot.forEach(doc => {
      const data = doc.data();

      // Aggregate by type
      if (data.logType === 'minutes') {
        stats.minutes += data.value;
      } else if (data.logType === 'pages') {
        stats.pages += data.value;
      } else if (data.logType === 'books') {
        stats.books += data.value;
      }

      // Track unique dates for streak calculation
      if (data.logDateString) {
        uniqueDates.add(data.logDateString);
      }

      // Track latest log date
      if (!latestLogDate || data.logDateString > latestLogDate) {
        latestLogDate = data.logDateString;
      }
    });

    // Sort dates for streak calculation
    const sortedDates = Array.from(uniqueDates).sort();
    allDates.push(...sortedDates);

    const currentStreak = calculateStreak(sortedDates);

    console.log('📈 Statistics:');
    console.log(`   Current Streak:    ${currentStreak} days`);
    console.log(`   Last Log Date:     ${latestLogDate}`);
    console.log(`   Total Minutes:     ${stats.minutes}`);
    console.log(`   Total Pages:       ${stats.pages}`);
    console.log(`   Total Books:       ${stats.books}`);
    console.log(`   Unique Days:       ${uniqueDates.size}`);
    console.log(`   First Log Date:    ${sortedDates[0]}`);
    console.log(`   Latest Log Date:   ${sortedDates[sortedDates.length - 1]}\n`);

    // Check import batches
    const batchesRef = db.collection(`readers/${readerId}/importBatches`);
    const batchesSnapshot = await batchesRef.get();

    console.log(`📦 Import Batches: ${batchesSnapshot.size}`);
    batchesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.totalRows} rows`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\n✅ Verification complete!\n');
  process.exit(0);
}

const readerId = process.argv[2] || 'luke';
verifyData(readerId);
