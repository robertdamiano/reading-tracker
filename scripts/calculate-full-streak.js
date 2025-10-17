/**
 * Calculate full streak - all consecutive days from start
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'reading-tracker-7a90d-firebase-adminsdk-fbsvc-faf1deb0b4.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'reading-tracker-7a90d'
});

const db = admin.firestore();

async function calculateFullStreak(readerId = 'luke') {
  const logsRef = db.collection(`readers/${readerId}/logs`);
  const snapshot = await logsRef.get();

  const uniqueDates = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.logDateString) {
      uniqueDates.add(data.logDateString);
    }
  });

  const sortedDates = Array.from(uniqueDates).sort();

  console.log(`\n📊 Streak Calculation:`);
  console.log(`   Total unique days: ${sortedDates.length}`);
  console.log(`   First log: ${sortedDates[0]}`);
  console.log(`   Latest log: ${sortedDates[sortedDates.length - 1]}`);

  // Check if all days are consecutive
  let gaps = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const dayDiff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

    if (dayDiff > 1) {
      gaps.push({
        from: sortedDates[i - 1],
        to: sortedDates[i],
        days: dayDiff
      });
    }
  }

  console.log(`\n📉 Gaps found: ${gaps.length}`);
  if (gaps.length > 0) {
    console.log(`   (showing first 10)`);
    gaps.slice(0, 10).forEach(g => {
      console.log(`   ${g.from} → ${g.to} (${g.days} day gap)`);
    });
  } else {
    console.log(`   ✅ No gaps! Perfect streak from start to end.`);
  }

  // Current streak counting backwards from latest
  let currentStreak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const latestDate = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00Z');
  const daysSinceLatest = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));

  console.log(`\n🔥 Current Streak Calculation:`);
  console.log(`   Today (local): ${today.toISOString().split('T')[0]}`);
  console.log(`   Latest log: ${sortedDates[sortedDates.length - 1]}`);
  console.log(`   Days since latest: ${daysSinceLatest}`);

  if (daysSinceLatest > 1) {
    console.log(`   ❌ Streak broken (more than 1 day gap)`);
    console.log(`   Current streak: 0 days\n`);
  } else {
    // Count backwards
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const prev = new Date(sortedDates[i] + 'T00:00:00Z');
      const curr = new Date(sortedDates[i + 1] + 'T00:00:00Z');
      const dayDiff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    console.log(`   ✅ Streak is active!`);
    console.log(`   Current streak: ${currentStreak} days\n`);
  }

  process.exit(0);
}

calculateFullStreak('luke');
