import { COLLECTIONS } from '../../shared/constants/collections.js';

export function buildUserProfile({ uid, email, role }) {
  const now = new Date().toISOString();

  return {
    email,
    ruolo: [role],
    status: true,
    created: now,
    changed: now,
    lastModifiedBy: uid,
    lastModifiedByEmail: email
  };
}

export async function seedUserProfile(db, { uid, email, role }) {
  const profile = buildUserProfile({ uid, email, role });
  await db.collection(COLLECTIONS.USERS).doc(uid).set(profile);
}
