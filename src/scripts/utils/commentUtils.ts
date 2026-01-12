// js/utils/commentUtils.ts

import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export class CommentManager {
    constructor(config) {
        this.db = config.db;
        this.auth = config.auth;
        this.functions = config.functions;
        this.commentsCollectionName = config.commentsCollectionName || 'comments';
        this.entityCollection = config.entityCollection;
        
        this.listEl = document.getElementById(config.listElementId || 'comment-list');
        this.formEl = document.getElementById(config.formElementId || 'comment-form');
        this.textEl = document.getElementById(config.textElementId || 'comment-text');
        this.saveBtnEl = document.getElementById(config.saveButtonId || 'save-comment-btn');
        
        this.currentEntityId = null;
        this.unsubscribeListener = null;
        
        if (this.saveBtnEl) {
            this.saveBtnEl.addEventListener('click', (e) => this.handleSaveComment(e));
        }
    }
    
    async handleSaveComment(e) {
        e.preventDefault();
        const text = this.textEl.value.trim();
        if (!text) {
            alert("Il commento non può essere vuoto.");
            return;
        }
        if (!this.currentEntityId || !this.entityCollection) {
            alert("Errore: Impossibile associare il commento. ID entità non trovato.");
            return;
        }
        const user = this.auth.currentUser;
        if (!user) {
            alert("Devi essere autenticato per lasciare un commento.");
            return;
        }
        this.setLoading(true);
        try {
            const createCommentApi = httpsCallable(this.functions, 'createCommentApi');
            await createCommentApi({
                text: text,
                entityId: this.currentEntityId,
                entityCollection: this.entityCollection
            });
            this.textEl.value = '';
        } catch (error) {
            console.error("Errore nel salvataggio del commento:", error);
            alert("Impossibile salvare il commento. Riprova.");
        } finally {
            this.setLoading(false);
        }
    }
    
    setLoading(isLoading) {
        if (!this.saveBtnEl) return;
        this.saveBtnEl.disabled = isLoading;
        if (isLoading) {
            this.saveBtnEl.classList.add('loading');
        } else {
            this.saveBtnEl.classList.remove('loading');
        }
    }
    
    renderEmptyMessage(message) {
        if (this.listEl) this.listEl.innerHTML = `<div class="empty-state">${message}</div>`;
    }
    
    listenForComments(entityId) {
        this.currentEntityId = entityId;
        if (this.formEl) this.formEl.style.display = 'block';
        if (this.listEl) this.listEl.innerHTML = '';
        const commentsRef = collection(this.db, this.commentsCollectionName);
        const q = query(commentsRef, where("entityId", "==", entityId), orderBy("created", "desc"));
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
        }
        this.unsubscribeListener = onSnapshot(q, (snapshot) => {
            if (!this.listEl) return;
            this.listEl.innerHTML = '';
            if (snapshot.empty) {
                this.renderEmptyMessage("Nessun commento. Iniziane uno tu!");
                return;
            }
            snapshot.docs.forEach(doc => this.renderComment(doc.data()));
        }, (error) => {
            console.error("Errore nell'ascolto dei commenti:", error);
            this.renderEmptyMessage("Errore nel caricamento dei commenti.");
        });
        return this.unsubscribeListener;
    }
    
    renderComment(data) {
        if (!this.listEl) return;
        const item = document.createElement('div');
        item.className = 'comment-item';
        const date = this.parseDate(data.created);
        const formattedDate = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const userName = data.createdByEmail || 'Utente Sconosciuto';
        item.innerHTML = `<div class="comment-header"><span class="comment-user">${userName}</span><span class="comment-date">${formattedDate}</span></div><div class="comment-body">${data.text}</div>`;
        this.listEl.appendChild(item);
    }

    parseDate(value) {
        if (!value) return new Date();
        if (value.toDate && typeof value.toDate === 'function') return value.toDate();
        if (value._seconds) return new Date(value._seconds * 1000);
        if (typeof value === 'string' || typeof value === 'number') return new Date(value);
        return new Date();
    }
    
    showEmptyState(message) {
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
            this.unsubscribeListener = null;
        }
        this.currentEntityId = null;
        this.renderEmptyMessage(message);
        if (this.formEl) this.formEl.style.display = 'none';
    }
    
    unsubscribe() {
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
            this.unsubscribeListener = null;
        }
    }
}

// Mantieni la compatibilità con il vecchio codice
let defaultInstance = null;
export function setup(config) {
    defaultInstance = new CommentManager(config);
}
export function listenForComments(entityId) {
    return defaultInstance?.listenForComments(entityId);
}
export function showEmptyState(message) {
    defaultInstance?.showEmptyState(message);
}
