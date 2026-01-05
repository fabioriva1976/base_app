export function getTableStatusBadgeElement(value){
    let statusClass = 'status--non-attivo';
    let title = 'Non Attivo';
    
    if(value) {
        statusClass = 'status--attivo';
        title = 'Attivo';
    }

    // Costruisci l'HTML per il badge
    return `<span class="status-badge ${statusClass}">${title}</span>`;
}


export function formatTableActionElement(id, options = {}){
    const { showEdit = true, showDelete = true } = options;

    let html = '';
    if (showEdit) {
        html += `<button class="btn-edit" data-id="${id}">Modifica</button>`;
    }
    if (showDelete) {
        html += `<button class="btn-delete" data-id="${id}">Elimina</button>`;
    }

    // Se nessun bottone, mostra "Sola lettura"
    if (!showEdit && !showDelete) {
        html = '<span style="color: #6b7280; font-size: 0.875rem;">Sola lettura</span>';
    }

    return html;
}


export function formatPriceElement(value){
    const formatted = new Intl.NumberFormat('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
    return `<span style="text-align: right; display: inline-block;">${formatted} €</span>`;
}

export function showSuccessMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = 'var(--success-color, #10b981)';
        element.style.display = 'inline-block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

export function showErrorMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = 'var(--error-color, #ef4444)';
        element.style.display = 'inline-block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}
