/**
 * Initialize Reader Profiles
 *
 * Creates profile documents for all readers (luke, mia, emy)
 * Usage: node scripts/init-reader-profiles.js
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

const readers = [
  {
    readerId: 'luke',
    displayName: 'Luke',
    fullName: 'Luke',
    createdBy: 'system'
  },
  {
    readerId: 'mia',
    displayName: 'Mia',
    fullName: 'Mia',
    createdBy: 'system'
  },
  {
    readerId: 'emy',
    displayName: 'Emy',
    fullName: 'Emy',
    createdBy: 'system'
  }
];

async function initializeReaderProfiles() {
  console.log('Initializing reader profiles...\n');

  for (const reader of readers) {
    const readerRef = db.collection('readers').doc(reader.readerId);
    const readerDoc = await readerRef.get();

    if (readerDoc.exists) {
      console.log(`✓ Reader profile for "${reader.displayName}" already exists`);
    } else {
      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      await readerRef.set({
        readerId: reader.readerId,
        displayName: reader.displayName,
        fullName: reader.fullName,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: reader.createdBy
      });
      console.log(`✓ Created reader profile for "${reader.displayName}"`);
    }
  }

  console.log('\n✅ Reader profiles initialized successfully!');
  process.exit(0);
}

initializeReaderProfiles().catch(err => {
  console.error('Error initializing reader profiles:', err);
  process.exit(1);
});
