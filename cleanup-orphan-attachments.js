/**
 * Script per eliminare attachments orfani (con entityId null)
 * Esegui con: node cleanup-orphan-attachments.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, ref, deleteObject, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "base-app-12108",
  storageBucket: "base-app-12108.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Connetti agli emulatori
connectFirestoreEmulator(db, 'localhost', 8080);
connectStorageEmulator(storage, 'localhost', 9199);

async function cleanupOrphanAttachments() {
  console.log('🔍 Cercando attachments orfani...');

  const attachmentsRef = collection(db, 'attachments');
  const snapshot = await getDocs(attachmentsRef);

  let orphanCount = 0;
  const deletePromises = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const entityId = data.metadata?.entityId;

    if (!entityId || entityId === null || entityId === 'null') {
      console.log(`❌ Trovato attachment orfano: ${docSnap.id} - ${data.nome}`);
      orphanCount++;

      // Elimina il documento da Firestore
      deletePromises.push(deleteDoc(doc(db, 'attachments', docSnap.id)));

      // Elimina il file da Storage se esiste
      if (data.storagePath) {
        try {
          const fileRef = ref(storage, data.storagePath);
          deletePromises.push(deleteObject(fileRef).catch(e => {
            console.log(`⚠️  File Storage non trovato: ${data.storagePath}`);
          }));
        } catch (e) {
          console.log(`⚠️  Errore eliminazione Storage: ${e.message}`);
        }
      }
    }
  }

  if (orphanCount === 0) {
    console.log('✅ Nessun attachment orfano trovato!');
    return;
  }

  console.log(`\n🗑️  Eliminando ${orphanCount} attachments orfani...`);
  await Promise.all(deletePromises);

  console.log(`✅ Eliminati ${orphanCount} attachments orfani!`);
}

cleanupOrphanAttachments()
  .then(() => {
    console.log('\n✨ Pulizia completata!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Errore durante la pulizia:', error);
    process.exit(1);
  });
