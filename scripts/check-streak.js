/**
 * Check streak calculation in detail
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

async function checkStreak(readerId = 'luke') {
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

  console.log(`\n📅 Last 30 days of activity:`);
  sortedDates.slice(-30).forEach((date, idx) => {
    if (idx > 0) {
      const prev = new Date(sortedDates[sortedDates.length - 30 + idx - 1]);
      const curr = new Date(date);
      const dayDiff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
      console.log(`   ${date} (${dayDiff} day gap)`);
    } else {
      console.log(`   ${date}`);
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latestDate = new Date(sortedDates[sortedDates.length - 1]);
  latestDate.setHours(0, 0, 0, 0);
  const daysSinceLatest = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));

  console.log(`\n📊 Streak Analysis:`);
  console.log(`   Today: ${today.toISOString().split('T')[0]}`);
  console.log(`   Latest log: ${sortedDates[sortedDates.length - 1]}`);
  console.log(`   Days since latest: ${daysSinceLatest}`);
  console.log(`   Total unique days: ${uniqueDates.size}\n`);

  process.exit(0);
}

checkStreak('luke');
