import { COLLECTIONS } from '../../shared/constants/collections.js';

export async function clearAllEmulatorData({ db, auth, storage } = {}) {
  if (!db) {
    return;
  }

  const collections = [
    COLLECTIONS.USERS,
    COLLECTIONS.AUDIT_LOGS,
    'auditLogs',
    COLLECTIONS.CLIENTI,
    COLLECTIONS.ATTACHMENTS,
    COLLECTIONS.COMMENTS,
    COLLECTIONS.CONFIG
  ];

  for (const name of collections) {
    const snapshot = await db.collection(name).get();
    const deletes = [];
    snapshot.forEach((doc) => deletes.push(doc.ref.delete()));
    await Promise.all(deletes);
  }

  if (auth) {
    const userRecords = await auth.listUsers(1000);
    await Promise.all(userRecords.users.map((user) => auth.deleteUser(user.uid)));
  }

  if (storage) {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles();
    await Promise.all(files.map((file) => file.delete()));
  }
}
