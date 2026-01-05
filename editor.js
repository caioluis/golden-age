// ============================================================================
// Text Wrapper Class - Handles text selection and wrapping with span tags
// ============================================================================

class TextWrapper {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
    }

    wrapSelection(tagClass) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const selectedText = this.textarea.value.substring(start, end);

        // Validate selection exists
        if (selectedText.length === 0) {
            showStatusMessage('Please select text first', 'warning');
            return false;
        }

        // Check if selection already contains span tags
        if (selectedText.includes('<span class="haruki-')) {
            showStatusMessage('Cannot wrap already formatted text', 'warning');
            return false;
        }

        // Create wrapped text
        const wrappedText = `<span class="${tagClass}">${selectedText}</span>`;
        const before = this.textarea.value.substring(0, start);
        const after = this.textarea.value.substring(end);

        // Update textarea value
        this.textarea.value = before + wrappedText + after;

        // Set cursor position after wrapped text
        const newCursorPos = start + wrappedText.length;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        this.textarea.focus();

        // Trigger auto-save
        storageManager.scheduleSave(getFormData());

        return true;
    }

    removeFormatting() {
        // Remove all haruki-speaks and haruki-thinks span tags
        const original = this.textarea.value;
        this.textarea.value = this.textarea.value
            .replace(/<span class="haruki-speaks">(.*?)<\/span>/g, '$1')
            .replace(/<span class="haruki-thinks">(.*?)<\/span>/g, '$1');

        if (original !== this.textarea.value) {
            showStatusMessage('Formatting cleared', 'success');
            storageManager.scheduleSave(getFormData());
        } else {
            showStatusMessage('No formatting to clear', 'warning');
        }
    }
}

// ============================================================================
// Storage Manager Class - Handles localStorage auto-save
// ============================================================================

class StorageManager {
    constructor() {
        this.storageKey = 'golden-age-editor-state';
        this.saveTimeout = null;
        this.indicator = document.getElementById('autoSaveIndicator');
    }

    scheduleSave(data) {
        clearTimeout(this.saveTimeout);

        // Show saving indicator
        this.indicator.textContent = 'Saving...';
        this.indicator.classList.add('saving');

        this.saveTimeout = setTimeout(() => {
            try {
                const saveData = {
                    version: '1.0',
                    lastSaved: new Date().toISOString(),
                    data: data
                };
                localStorage.setItem(this.storageKey, JSON.stringify(saveData));
                this.showSaveIndicator();
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                this.indicator.textContent = 'Save failed';
                this.indicator.classList.remove('saving');
            }
        }, 500);
    }

    showSaveIndicator() {
        this.indicator.textContent = 'Auto-saved';
        this.indicator.classList.remove('saving');

        setTimeout(() => {
            this.indicator.textContent = '';
        }, 2000);
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.data || null;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return null;
    }

    clear() {
        localStorage.removeItem(this.storageKey);
        this.indicator.textContent = '';
    }
}

// ============================================================================
// HTML Generator Class - Generates final HTML output
// ============================================================================

class HTMLGenerator {
    constructor() {
        this.template = `<link href="https://caioluis.github.io/golden-age/template.css" rel="stylesheet" type="text/css"><div class="haruki"><h2>{{TITLE}}</h2><h3>{{SUBTITLE}}</h3><hr/>
{{NARRATIVE}}

<div class="haruki-stats"> <div class="jjk-dossier-status-item"> <span class="jjk-dossier-status-label">HP</span> <div class="jjk-dossier-status-bar-wrapper"> <div class="jjk-dossier-status-bar"><div class="jjk-dossier-status-bar-fill jjk-dossier-hp-fill" style="width: {{HP_PERCENT}}%;"></div></div> </div> <span class="jjk-dossier-status-value">{{HP_CURRENT}} / {{HP_MAX}}</span> </div> <div class="jjk-dossier-status-item"> <span class="jjk-dossier-status-label">EA</span> <div class="jjk-dossier-status-bar-wrapper"> <div class="jjk-dossier-status-bar"><div class="jjk-dossier-status-bar-fill jjk-dossier-ea-fill" style="width: {{EA_PERCENT}}%;"></div></div> </div> <span class="jjk-dossier-status-value">{{EA_CURRENT}} / {{EA_MAX}}</span> </div> </div><details><summary>Considerações</summary><div class="accordion-content"><div><p>Palavras: {{WORD_COUNT}}
Post: {{POST_CURRENT}}/{{POST_MAX}}
Objetivo: {{OBJETIVO}}
Obs.: {{OBS}}
</p></div></div></details>
</div>`;
    }

    generate(formData) {
        // Replace all placeholders
        let html = this.template
            .replace('{{TITLE}}', formData.title)
            .replace('{{SUBTITLE}}', formData.subtitle)
            .replace('{{NARRATIVE}}', this.processNarrative(formData.narrative))
            .replace('{{HP_PERCENT}}', formData.hpPercent || '100')
            .replace('{{HP_CURRENT}}', formData.hpCurrent)
            .replace('{{HP_MAX}}', formData.hpMax)
            .replace('{{EA_PERCENT}}', formData.eaPercent || '100')
            .replace('{{EA_CURRENT}}', formData.eaCurrent)
            .replace('{{EA_MAX}}', formData.eaMax)
            .replace('{{WORD_COUNT}}', formData.wordCount)
            .replace('{{POST_CURRENT}}', formData.postCurrent)
            .replace('{{POST_MAX}}', formData.postMax)
            .replace('{{OBJETIVO}}', formData.objetivo)
            .replace('{{OBS}}', formData.obs);

        return html;
    }

    processNarrative(text) {
        // Split by double line breaks to create paragraphs
        const paragraphs = text.split('\n\n')
            .map(para => para.trim())
            .filter(para => para.length > 0);

        // Join with proper spacing
        return paragraphs.join('\n\n');
    }
}

// ============================================================================
// Form Validator Class - Validates form inputs
// ============================================================================

class FormValidator {
    validate(formData) {
        const errors = [];

        // Title validation
        if (!formData.title.trim()) {
            errors.push('Title is required');
        }

        // Subtitle validation
        if (!formData.subtitle.trim()) {
            errors.push('Subtitle is required');
        }

        // Narrative validation
        if (formData.narrative.trim().length < 10) {
            errors.push('Narrative must be at least 10 characters');
        }

        // HP validation
        if (!this.isValidNumber(formData.hpCurrent)) {
            errors.push('HP Current must be a number');
        }
        if (!this.isValidNumber(formData.hpMax)) {
            errors.push('HP Max must be a number');
        }
        if (!this.isValidNumber(formData.hpPercent)) {
            errors.push('HP Percent must be a number');
        }

        // EA validation
        if (!this.isValidNumber(formData.eaCurrent)) {
            errors.push('EA Current must be a number');
        }
        if (!this.isValidNumber(formData.eaMax)) {
            errors.push('EA Max must be a number');
        }
        if (!this.isValidNumber(formData.eaPercent)) {
            errors.push('EA Percent must be a number');
        }

        // Word count validation
        if (formData.wordCount && !this.isValidNumber(formData.wordCount)) {
            errors.push('Word Count must be a number');
        }

        return errors;
    }

    isValidNumber(value) {
        if (!value || value.trim() === '') return false;
        return /^\d+$/.test(value.trim());
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

function showStatusMessage(message, type = 'success') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = 'status-message status-' + type;
    statusDiv.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

async function copyToClipboard(text) {
    try {
        // Try modern Clipboard API first
        await navigator.clipboard.writeText(text);
        showStatusMessage('HTML copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showStatusMessage('HTML copied to clipboard!', 'success');
        } catch (fallbackErr) {
            showStatusMessage('Failed to copy to clipboard', 'error');
            console.error('Clipboard error:', fallbackErr);
        }
    }
}

function getFormData() {
    return {
        title: document.getElementById('title').value,
        subtitle: document.getElementById('subtitle').value,
        narrative: document.getElementById('narrative').value,
        hpCurrent: document.getElementById('hpCurrent').value,
        hpMax: document.getElementById('hpMax').value,
        hpPercent: document.getElementById('hpPercent').value,
        eaCurrent: document.getElementById('eaCurrent').value,
        eaMax: document.getElementById('eaMax').value,
        eaPercent: document.getElementById('eaPercent').value,
        wordCount: document.getElementById('wordCount').value,
        postCurrent: document.getElementById('postCurrent').value,
        postMax: document.getElementById('postMax').value,
        objetivo: document.getElementById('objetivo').value,
        obs: document.getElementById('obs').value
    };
}

function setFormData(data) {
    if (!data) return;

    document.getElementById('title').value = data.title || '';
    document.getElementById('subtitle').value = data.subtitle || '';
    document.getElementById('narrative').value = data.narrative || '';
    document.getElementById('hpCurrent').value = data.hpCurrent || '';
    document.getElementById('hpMax').value = data.hpMax || '';
    document.getElementById('hpPercent').value = data.hpPercent || '';
    document.getElementById('eaCurrent').value = data.eaCurrent || '';
    document.getElementById('eaMax').value = data.eaMax || '';
    document.getElementById('eaPercent').value = data.eaPercent || '';
    document.getElementById('wordCount').value = data.wordCount || '';
    document.getElementById('postCurrent').value = data.postCurrent || '';
    document.getElementById('postMax').value = data.postMax || '';
    document.getElementById('objetivo').value = data.objetivo || '';
    document.getElementById('obs').value = data.obs || '';
}

function clearAllFields() {
    if (confirm('Are you sure you want to clear all fields? This cannot be undone.')) {
        document.getElementById('editorForm').reset();
        storageManager.clear();
        showStatusMessage('All fields cleared', 'success');
    }
}

// ============================================================================
// Initialize Application
// ============================================================================

// Global instances
const textWrapper = new TextWrapper('narrative');
const storageManager = new StorageManager();
const htmlGenerator = new HTMLGenerator();
const formValidator = new FormValidator();

// Load saved data on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    const savedData = storageManager.load();
    if (savedData) {
        setFormData(savedData);
        showStatusMessage('Previous work loaded', 'success');
    }

    // Text wrapping buttons
    document.getElementById('btnSpeech').addEventListener('click', () => {
        textWrapper.wrapSelection('haruki-speaks');
    });

    document.getElementById('btnThought').addEventListener('click', () => {
        textWrapper.wrapSelection('haruki-thinks');
    });

    document.getElementById('btnClearFormat').addEventListener('click', () => {
        textWrapper.removeFormatting();
    });

    // Generate & Copy button
    document.getElementById('btnGenerate').addEventListener('click', () => {
        const formData = getFormData();
        const errors = formValidator.validate(formData);

        if (errors.length > 0) {
            showStatusMessage('Validation errors: ' + errors.join(', '), 'error');
            return;
        }

        const html = htmlGenerator.generate(formData);
        copyToClipboard(html);
    });

    // Clear All button
    document.getElementById('btnClear').addEventListener('click', clearAllFields);

    // Auto-save on input changes
    const formInputs = document.querySelectorAll('.editor-input');
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            storageManager.scheduleSave(getFormData());
        });
    });
});
