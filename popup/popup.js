document.addEventListener('DOMContentLoaded', function() {
    loadExpressions();
    setupEventListeners();
    setupLanguageToggle();
});

function setupEventListeners() {
    const addButton = document.getElementById('addExpression');
    const whatInput = document.getElementById('whatInput');
    const forWhatInput = document.getElementById('forWhatInput');

    addButton.addEventListener('click', () => addExpression());
    
    whatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            forWhatInput.focus();
        }
    });
    
    forWhatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addExpression();
        }
    });
}

function setupLanguageToggle() {
    const languageToggle = document.getElementById('languageToggle');
    languageToggle.addEventListener('click', () => {
        chrome.storage.sync.get(['language'], function(result) {
            const currentLang = result.language || 'pl';
            const newLang = currentLang === 'pl' ? 'en' : 'pl';
            chrome.storage.sync.set({ language: newLang }, function() {
                updateLanguage(newLang);
            });
        });
    });

    // Załaduj aktualny język
    chrome.storage.sync.get(['language'], function(result) {
        const currentLang = result.language || 'pl';
        updateLanguage(currentLang);
    });
}

function updateLanguage(lang) {
    const translations = {
        pl: {
            title: 'Lista wyrażeń do zamiany',
            whatColumn: 'Co zamienić',
            forWhatColumn: 'Na co zamienić',
            addButton: 'Dodaj',
            editButton: 'Edytuj',
            deleteButton: 'Usuń',
            whatPlaceholder: 'Co zamienić',
            forWhatPlaceholder: 'Na co zamienić',
            action: 'Akcje',
        },
        en: {
            title: 'Expression replacement list',
            whatColumn: 'What to replace',
            forWhatColumn: 'Replace with',
            addButton: 'Add',
            editButton: 'Edit',
            deleteButton: 'Delete',
            whatPlaceholder: 'What to replace',
            forWhatPlaceholder: 'Replace with',
            action: "Actions"
        }
    };

    const t = translations[lang];
    
    document.querySelector('h2').textContent = t.title;
    document.querySelector('thead tr').children[0].textContent = t.whatColumn;
    document.querySelector('thead tr').children[1].textContent = t.forWhatColumn;
    document.querySelector('thead tr').children[2].textContent = t.action;
    document.getElementById('addExpression').innerHTML = `<i class="fas fa-plus"></i> ${t.addButton}`;
    document.getElementById('whatInput').placeholder = t.whatPlaceholder;
    document.getElementById('forWhatInput').placeholder = t.forWhatPlaceholder;
    
    // Aktualizuj przyciski w istniejących wierszach
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.innerHTML = `<i class="fas fa-edit"></i> ${t.editButton}`;
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.innerHTML = `<i class="fas fa-trash"></i> ${t.deleteButton}`;
    });
}

function loadExpressions() {
    chrome.storage.sync.get(['expressions'], function(result) {
        const expressions = result.expressions || [{
            what: 'final',
            forWhat: ''
        }, {
            what: 'draft',
            forWhat: ''
        }];
        updateExpressionsList(expressions);
    });
}

function updateExpressionsList(expressions) {
    const tbody = document.getElementById('expressionsList');
    tbody.innerHTML = '';
    
    chrome.storage.sync.get(['language'], function(result) {
        const currentLang = result.language || 'pl';
        const t = currentLang === 'pl' ? {
            editButton: 'Edytuj',
            deleteButton: 'Usuń'
        } : {
            editButton: 'Edit',
            deleteButton: 'Delete'
        };

        expressions.forEach((expr, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(expr.what)}</td>
                <td>${escapeHtml(expr.forWhat)}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i> ${t.editButton}
                    </button>
                    <button class="delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i> ${t.deleteButton}
                    </button>
                </td>
            `;
            
            row.querySelector('.edit-btn').addEventListener('click', () => editExpression(index));
            row.querySelector('.delete-btn').addEventListener('click', () => deleteExpression(index));
            
            tbody.appendChild(row);
        });
    });

    const container = document.querySelector('.expressions-list');
    container.scrollTop = container.scrollHeight;
}

function addExpression() {
    const whatInput = document.getElementById('whatInput');
    const forWhatInput = document.getElementById('forWhatInput');
    
    const whatValue = whatInput.value.trim();
    const forWhatValue = forWhatInput.value.trim();
    
    if (!whatValue) {
        whatInput.focus();
        return;
    }
    
    chrome.storage.sync.get(['expressions'], function(result) {
        let expressions = result.expressions || [];
        const exists = expressions.some(expr => 
            expr.what.toLowerCase() === whatValue.toLowerCase()
        );
        
        if (exists) {
            return;
        }
        
        expressions.push({
            what: whatValue,
            forWhat: forWhatValue
        });
        
        chrome.storage.sync.set({ expressions }, function() {
            if (chrome.runtime.lastError) {
                console.error('Błąd podczas zapisywania:', chrome.runtime.lastError);
                return;
            }
            
            updateExpressionsList(expressions);
            whatInput.value = '';
            forWhatInput.value = '';
            whatInput.focus();
        });
    });
}

function editExpression(index) {
    chrome.storage.sync.get(['expressions'], function(result) {
        const expressions = result.expressions || [];
        const expr = expressions[index];
        
        const whatInput = document.getElementById('whatInput');
        const forWhatInput = document.getElementById('forWhatInput');
        
        whatInput.value = expr.what;
        forWhatInput.value = expr.forWhat;
        whatInput.focus();
        
        expressions.splice(index, 1);
        chrome.storage.sync.set({ expressions }, function() {
            if (chrome.runtime.lastError) {
                console.error('Błąd podczas edycji:', chrome.runtime.lastError);
                return;
            }
            updateExpressionsList(expressions);
        });
    });
}

function deleteExpression(index) {
    chrome.storage.sync.get(['expressions'], function(result) {
        const expressions = result.expressions || [];
        expressions.splice(index, 1);
        
        chrome.storage.sync.set({ expressions }, function() {
            if (chrome.runtime.lastError) {
                console.error('Błąd podczas usuwania:', chrome.runtime.lastError);
                return;
            }
            updateExpressionsList(expressions);
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
