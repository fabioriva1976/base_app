import { auth, functions } from '../lib/firebase-client';
import { httpsCallable } from "firebase/functions";

export function initSettingsSmtpPage() {
    const form = document.getElementById('smtp-config-form');
    const canModify = form?.dataset.canModify === 'true';

    loadCurrentConfig();
    setupEventListeners();

    // Se l'utente non può modificare, rendi il form read-only
    if (!canModify) {
        makeFormReadOnly();
    }
}

function makeFormReadOnly() {
    const form = document.getElementById('smtp-config-form');
    if (!form) return;

    // Disabilita tutti gli input, select, textarea e checkbox
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
    });

    // Disabilita i bottoni di salvataggio e test
    const saveBtn = form.querySelector('button[type="submit"]');
    const testBtn = document.getElementById('test-smtp-btn');
    if (saveBtn) saveBtn.disabled = true;
    if (testBtn) testBtn.disabled = true;

    // Mostra un messaggio informativo
    const description = form.closest('.config-section')?.querySelector('.description');
    if (description) {
        description.innerHTML = '<strong style="color: #f59e0b;">Solo i Superuser possono modificare le configurazioni.</strong> Puoi visualizzare i parametri ma non modificarli.';
    }
}

function setupEventListeners() {
    const form = document.getElementById('smtp-config-form');
    const testBtn = document.getElementById('test-smtp-btn');
    const sendTestBtn = document.getElementById('send-test-email-btn');
    const cancelTestBtn = document.getElementById('cancel-test-btn');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (testBtn) {
        testBtn.addEventListener('click', showTestEmailForm);
    }

    if (sendTestBtn) {
        sendTestBtn.addEventListener('click', sendTestEmail);
    }

    if (cancelTestBtn) {
        cancelTestBtn.addEventListener('click', hideTestEmailForm);
    }
}

async function loadCurrentConfig() {
    try {
        const getConfig = httpsCallable(functions, 'getConfigSmtpApi');
        const result = await getConfig();

        if (result.data?.exists) {
            const data = result.data.data || {};

            // Popola il form
            document.getElementById('smtp-host').value = data.host || '';
            document.getElementById('smtp-port').value = data.port || '';
            document.getElementById('smtp-user').value = data.user || '';
            document.getElementById('smtp-password').value = data.password || '';
            document.getElementById('smtp-from').value = data.from || '';
            document.getElementById('smtp-from-name').value = data.fromName || '';
            document.getElementById('smtp-secure').checked = data.secure || false;

            // Aggiorna lo stato
            updateStatus(data);
        }
    } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);

        // Se è un errore di permessi, mostra un messaggio più chiaro
        if (error.code === 'permission-denied') {
            showMessage('⚠️ Solo i Superuser possono visualizzare le configurazioni sensibili (password SMTP, secrets)', 'error');
            makeFormReadOnly();
        } else {
            showMessage('Errore nel caricamento della configurazione', 'error');
        }
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const originalWidth = submitBtn.getBoundingClientRect().width;

    submitBtn.style.minWidth = `${originalWidth}px`;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-loader"></span>Salvataggio...';

    try {
        const formData = new FormData(e.target);
        const configData = {
            host: formData.get('host'),
            port: parseInt(formData.get('port')),
            user: formData.get('user'),
            password: formData.get('password'),
            from: formData.get('from'),
            fromName: formData.get('fromName'),
            secure: document.getElementById('smtp-secure').checked
        };

        const saveConfig = httpsCallable(functions, 'saveConfigSmtpApi');
        const result = await saveConfig({ data: configData });
        if (!result.data?.success && result.data?.success !== undefined) {
            throw new Error('Salvataggio non riuscito');
        }

        // Ricarica i dati dal server
        await loadCurrentConfig();

        showMessage('Configurazione salvata con successo!', 'success');

    } catch (error) {
        console.error('Errore nel salvare la configurazione:', error);
        showMessage('Errore: ' + (error.message || 'Impossibile salvare la configurazione'), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.style.minWidth = '';
    }
}

function showTestEmailForm() {
    const container = document.getElementById('test-email-container');
    const emailInput = document.getElementById('test-email-input');

    // Precompila con l'email dell'utente corrente
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
        emailInput.value = currentUser.email;
    }

    container.style.display = 'block';
    emailInput.focus();
}

function hideTestEmailForm() {
    const container = document.getElementById('test-email-container');
    const emailInput = document.getElementById('test-email-input');

    container.style.display = 'none';
    emailInput.value = '';
    showMessage('', 'success'); // Pulisce eventuali messaggi
}

async function sendTestEmail() {
    const emailInput = document.getElementById('test-email-input');
    const sendBtn = document.getElementById('send-test-email-btn');
    const originalText = sendBtn.textContent;
    const originalWidth = sendBtn.getBoundingClientRect().width;

    const testEmail = emailInput.value.trim();

    if (!testEmail) {
        showMessage('❌ Inserisci un indirizzo email', 'error');
        emailInput.focus();
        return;
    }

    // Valida l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
        showMessage('❌ Indirizzo email non valido', 'error');
        emailInput.focus();
        return;
    }

    sendBtn.style.minWidth = `${originalWidth}px`;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="btn-loader"></span>Invio in corso...';

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error('Utente non autenticato');
        }

        // Chiama la Cloud Function per testare SMTP
        const testSmtp = httpsCallable(functions, 'checkSettingsSmtpApi');
        const result = await testSmtp({ testEmail });

        console.log('Test SMTP result:', result.data);

        if (result.data.success) {
            const message = result.data.details.testEmailSent
                ? `✅ Test completato! Email inviata a ${testEmail}. Controlla la casella di posta.`
                : '✅ Connessione SMTP verificata con successo!';
            showMessage(message, 'success');

            // Nascondi il form dopo il successo
            setTimeout(() => {
                hideTestEmailForm();
            }, 2000);
        } else {
            throw new Error(result.data.message || 'Test fallito');
        }

    } catch (error) {
        console.error('Errore nel test della connessione:', error);

        // Estrai il messaggio di errore dalla struttura Firebase Functions
        let errorMessage = 'Impossibile testare la connessione';

        // Firebase Functions wraps errors in a specific structure
        if (error.code === 'functions/internal') {
            // Extract the actual error message from the details
            if (error.details && error.details.message) {
                errorMessage = error.details.message;
            } else if (error.message && !error.message.includes('INTERNAL')) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Errore del server. Verifica la configurazione SMTP e riprova.';
            }
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code === 'functions/unauthenticated') {
            errorMessage = 'Devi essere autenticato per testare la connessione';
        } else if (error.code === 'functions/permission-denied') {
            errorMessage = 'Non hai i permessi per testare la connessione SMTP';
        }

        showMessage('❌ ' + errorMessage, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
        sendBtn.style.minWidth = '';
    }
}

function updateStatus(data) {
    const hostElement = document.getElementById('status-host');
    const portElement = document.getElementById('status-port');
    const fromElement = document.getElementById('status-from');
    const secureElement = document.getElementById('status-secure');
    const changedElement = document.getElementById('status-changed');

    if (hostElement) {
        hostElement.textContent = data.host || 'Non configurato';
        hostElement.className = data.host ? 'status-value configured' : 'status-value not-configured';
    }

    if (portElement) {
        portElement.textContent = data.port || '-';
    }

    if (fromElement) {
        fromElement.textContent = data.from || '-';
    }

    if (secureElement) {
        secureElement.textContent = data.secure ? 'Sì (TLS/SSL)' : 'No';
        secureElement.className = data.secure ? 'status-value configured' : 'status-value';
    }

    const changedValue = data.changed;
    if (changedElement && changedValue) {
        const date = changedValue.toDate ? changedValue.toDate() : new Date(changedValue);
        changedElement.textContent = date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function showMessage(message, type) {
    // Preferisci il messaggio vicino ai pulsanti
    const messageElement = document.getElementById('save-message') || document.getElementById('form-message');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `save-message ${type}`;
    messageElement.style.display = 'inline-block';

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}
