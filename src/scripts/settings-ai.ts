import { auth, functions } from '../lib/firebase-client';
import { httpsCallable } from "firebase/functions";

export function initSettingsAiPage() {
    const form = document.getElementById('ai-config-form');
    const canModify = form?.dataset.canModify === 'true';

    loadCurrentConfig();
    setupEventListeners();

    // Se l'utente non può modificare, rendi il form read-only
    if (!canModify) {
        makeFormReadOnly();
    }
}

function makeFormReadOnly() {
    const form = document.getElementById('ai-config-form');
    if (!form) return;

    // Disabilita tutti gli input, select, textarea e checkbox
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.disabled = true;
    });

    // Disabilita i bottoni di salvataggio e test
    const saveBtn = form.querySelector('button[type="submit"]');
    const testBtn = document.getElementById('test-ai-btn');
    if (saveBtn) saveBtn.disabled = true;
    if (testBtn) testBtn.disabled = true;

    // Mostra un messaggio informativo
    const description = form.closest('.config-section')?.querySelector('.description');
    if (description) {
        description.innerHTML = '<strong style="color: #f59e0b;">Solo i Superuser possono modificare le configurazioni.</strong> Puoi visualizzare i parametri ma non modificarli.';
    }
}

function setupEventListeners() {
    const form = document.getElementById('ai-config-form');
    const testBtn = document.getElementById('test-ai-btn');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (testBtn) {
        testBtn.addEventListener('click', testAI);
    }
}

async function loadCurrentConfig() {
    try {
        const getConfig = httpsCallable(functions, 'getConfigAiApi');
        const result = await getConfig();

        if (result.data?.exists) {
            const data = result.data.data || {};

            // Popola il form
            document.getElementById('ai-provider').value = data.provider || 'google';
            document.getElementById('ai-api-key').value = data.apiKey || '';
            document.getElementById('ai-model').value = data.model || 'gemini-1.5-pro';
            document.getElementById('ai-temperature').value = data.temperature || 0.7;
            document.getElementById('ai-max-tokens').value = data.maxTokens || 2048;
            document.getElementById('ai-timeout').value = data.timeout || 30;
            document.getElementById('ai-system-prompt').value = data.systemPrompt || 'Sei un assistente virtuale intelligente che aiuta gli utenti con le loro richieste in modo professionale e cortese.';
            document.getElementById('ai-rag-corpus-id').value = data.ragCorpusId || '';
            document.getElementById('ai-rag-location').value = data.ragLocation || 'europe-west1';
            document.getElementById('ai-enable-context').checked = data.enableContext !== undefined ? data.enableContext : true;
            document.getElementById('ai-enable-safety').checked = data.enableSafety !== undefined ? data.enableSafety : true;

            // Aggiorna lo stato
            updateStatus(data);
        }
    } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);

        // Se è un errore di permessi, mostra un messaggio più chiaro
        if (error.code === 'permission-denied') {
            showMessage('⚠️ Solo i Superuser possono visualizzare le configurazioni sensibili (API keys, secrets)', 'error');
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

        // Debug: stampa tutti i valori del form
        console.log('📋 FormData values:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }

        const configData = {
            provider: formData.get('provider'),
            apiKey: formData.get('apiKey'),
            model: formData.get('model'),
            temperature: parseFloat(formData.get('temperature')),
            maxTokens: parseInt(formData.get('maxTokens')),
            timeout: parseInt(formData.get('timeout')),
            systemPrompt: formData.get('systemPrompt'),
            ragCorpusId: formData.get('ragCorpusId') || '',
            ragLocation: formData.get('ragLocation') || 'europe-west1',
            enableContext: document.getElementById('ai-enable-context').checked,
            enableSafety: document.getElementById('ai-enable-safety').checked
        };

        console.log('💾 Saving config data:', configData);

        const saveConfig = httpsCallable(functions, 'saveConfigAiApi');
        const result = await saveConfig({ data: configData });
        if (!result.data?.success && result.data?.success !== undefined) {
            throw new Error('Salvataggio non riuscito');
        }

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

async function testAI() {
    const btn = document.getElementById('test-ai-btn');
    const originalText = btn.textContent;
    const originalWidth = btn.getBoundingClientRect().width;

    btn.style.minWidth = `${originalWidth}px`;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-loader"></span>Test in corso...';

    try {
        const testAi = httpsCallable(functions, 'checkSettingsAiApi');
        const result = await testAi({});

        if (result.data.success) {
            showMessage(result.data.message, 'success');
        } else {
            throw new Error(result.data.message || 'Test fallito');
        }
    } catch (error) {
        console.error('Errore nel test AI:', error);

        // Estrai il messaggio di errore dalla struttura Firebase Functions
        let errorMessage = 'Impossibile testare la configurazione AI';

        // Firebase Functions wraps errors in a specific structure
        if (error.code === 'functions/internal') {
            // Extract the actual error message from the details
            if (error.details && error.details.message) {
                errorMessage = error.details.message;
            } else if (error.message && !error.message.includes('INTERNAL')) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Errore del server. Verifica la configurazione AI e riprova.';
            }
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code === 'functions/unauthenticated') {
            errorMessage = 'Devi essere autenticato per testare la configurazione AI';
        } else if (error.code === 'functions/permission-denied') {
            errorMessage = 'Non hai i permessi per testare la configurazione AI';
        }

        showMessage('❌ ' + errorMessage, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.minWidth = '';
    }
}

function updateStatus(data) {
    const providerElement = document.getElementById('status-provider');
    const modelElement = document.getElementById('status-model');
    const temperatureElement = document.getElementById('status-temperature');
    const maxTokensElement = document.getElementById('status-maxTokens');
    const changedElement = document.getElementById('status-changed');

    if (providerElement) {
        const providerNames = {
            'google': 'Google AI (Gemini)',
            'openai': 'OpenAI (GPT)',
            'anthropic': 'Anthropic (Claude)',
            'azure': 'Azure OpenAI'
        };
        providerElement.textContent = providerNames[data.provider] || data.provider || 'Non configurato';
        providerElement.className = data.provider ? 'status-value configured' : 'status-value not-configured';
    }

    if (modelElement) {
        modelElement.textContent = data.model || '-';
    }

    if (temperatureElement) {
        temperatureElement.textContent = data.temperature !== undefined ? data.temperature : '-';
    }

    if (maxTokensElement) {
        maxTokensElement.textContent = data.maxTokens || '-';
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
