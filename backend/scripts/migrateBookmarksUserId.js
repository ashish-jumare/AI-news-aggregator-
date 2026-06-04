const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const targetUserId = process.env.USER_ID;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }
  if (!targetUserId) {
    throw new Error('USER_ID is required');
  }

  await mongoose.connect(mongoUri);

  const result = await Bookmark.updateMany(
    { userId: 'default_user' },
    { $set: { userId: new mongoose.Types.ObjectId(targetUserId) } }
  );

  console.log(`Updated ${result.modifiedCount} bookmark(s).`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
