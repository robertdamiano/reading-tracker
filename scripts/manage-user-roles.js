/**
 * Manage User Roles
 *
 * Set up user roles and reader associations in the appUsers collection
 * Usage: node scripts/manage-user-roles.js
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
const auth = admin.auth();

/**
 * List all users and their current roles
 */
async function listUsers() {
  console.log('\n=== Current Users ===\n');

  const listUsersResult = await auth.listUsers();

  for (const userRecord of listUsersResult.users) {
    const userDocRef = db.collection('appUsers').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    console.log(`Email: ${userRecord.email}`);
    console.log(`UID: ${userRecord.uid}`);

    if (userDoc.exists) {
      const data = userDoc.data();
      console.log(`Role: ${data.role}`);
      if (data.role === 'parent') {
        console.log(`Allowed Readers: ${data.allowedReaders?.join(', ') || 'none'}`);
      } else if (data.role === 'child') {
        console.log(`Reader ID: ${data.readerId || 'not set'}`);
      }
    } else {
      console.log('Role: NOT SET (no appUsers document)');
    }

    console.log('---\n');
  }
}

/**
 * Set a user as a parent with access to all readers
 */
async function setParentRole(email) {
  const userRecord = await auth.getUserByEmail(email);
  const userDocRef = db.collection('appUsers').doc(userRecord.uid);

  await userDocRef.set({
    role: 'parent',
    allowedReaders: ['luke', 'mia', 'emy'],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`✓ Set ${email} as parent with access to all readers`);
}

/**
 * Set a user as a child with access to their own reader profile
 */
async function setChildRole(email, readerId) {
  if (!['luke', 'mia', 'emy'].includes(readerId)) {
    throw new Error(`Invalid readerId: ${readerId}. Must be one of: luke, mia, emy`);
  }

  const userRecord = await auth.getUserByEmail(email);
  const userDocRef = db.collection('appUsers').doc(userRecord.uid);

  await userDocRef.set({
    role: 'child',
    readerId: readerId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  console.log(`✓ Set ${email} as child with readerId: ${readerId}`);
}

/**
 * Interactive CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  node scripts/manage-user-roles.js list
  node scripts/manage-user-roles.js set-parent <email>
  node scripts/manage-user-roles.js set-child <email> <readerId>

Examples:
  node scripts/manage-user-roles.js list
  node scripts/manage-user-roles.js set-parent parent@example.com
  node scripts/manage-user-roles.js set-child luke@example.com luke
  node scripts/manage-user-roles.js set-child mia@example.com mia
  node scripts/manage-user-roles.js set-child emy@example.com emy
    `);
    process.exit(0);
  }

  const command = args[0];

  try {
    if (command === 'list') {
      await listUsers();
    } else if (command === 'set-parent') {
      if (args.length < 2) {
        console.error('Error: Email required');
        process.exit(1);
      }
      await setParentRole(args[1]);
    } else if (command === 'set-child') {
      if (args.length < 3) {
        console.error('Error: Email and readerId required');
        process.exit(1);
      }
      await setChildRole(args[1], args[2]);
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
