import { atom } from 'nanostores';
import { COLLECTIONS } from '../../shared/constants/collections.ts';

export const __ENTITA_CAMEL__Store = atom([]);
export const __ENTITA_CAMEL__LoadingStore = atom(true);
export const __ENTITA_CAMEL__ErrorStore = atom(null);

let unsubscribe = null;

export function init__ENTITA_PASCAL__Listener() {
  import('firebase/firestore').then(({ collection, onSnapshot }) => {
    import('../lib/firebase-client').then(({ db }) => {
      if (unsubscribe) {
        console.log('Listener gia attivo');
        return;
      }

      __ENTITA_CAMEL__LoadingStore.set(true);
      __ENTITA_CAMEL__ErrorStore.set(null);

      try {
        const entityCollection = collection(db, COLLECTIONS.__ENTITA_CONST__);

        unsubscribe = onSnapshot(
          entityCollection,
          (snapshot) => {
            const items = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            __ENTITA_CAMEL__Store.set(items);
            __ENTITA_CAMEL__LoadingStore.set(false);
          },
          (error) => {
            console.error('Errore nel listener:', error);
            __ENTITA_CAMEL__ErrorStore.set(error.message);
            __ENTITA_CAMEL__LoadingStore.set(false);
          }
        );
      } catch (error) {
        console.error('Errore nell\'inizializzare il listener:', error);
        __ENTITA_CAMEL__ErrorStore.set(error.message);
        __ENTITA_CAMEL__LoadingStore.set(false);
      }
    });
  });
}

export function stop__ENTITA_PASCAL__Listener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
