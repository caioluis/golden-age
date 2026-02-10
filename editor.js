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
            showStatusMessage("Please select text first", "warning");
            return false;
        }

        // Check if selection already contains span tags
        if (selectedText.includes('<span class="haruki-')) {
            showStatusMessage("Cannot wrap already formatted text", "warning");
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

    insertAtCursor(text) {
        const pos = this.textarea.selectionStart;
        const before = this.textarea.value.substring(0, pos);
        const after = this.textarea.value.substring(pos);

        this.textarea.value = before + text + after;

        const newCursorPos = pos + text.length;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        this.textarea.focus();

        storageManager.scheduleSave(getFormData());
        return true;
    }

    removeFormatting() {
        // Remove all haruki-speaks and haruki-thinks span tags
        const original = this.textarea.value;
        this.textarea.value = this.textarea.value
            .replace(/<span class="haruki-speaks">(.*?)<\/span>/g, "$1")
            .replace(/<span class="haruki-thinks">(.*?)<\/span>/g, "$1");

        if (original !== this.textarea.value) {
            showStatusMessage("Formatting cleared", "success");
            storageManager.scheduleSave(getFormData());
        } else {
            showStatusMessage("No formatting to clear", "warning");
        }
    }
}

// ============================================================================
// Storage Manager Class - Handles localStorage auto-save
// ============================================================================

class StorageManager {
    constructor() {
        this.storageKey = "golden-age-editor-state";
        this.saveTimeout = null;
        this.indicator = document.getElementById("autoSaveIndicator");
    }

    scheduleSave(data) {
        clearTimeout(this.saveTimeout);

        // Show saving indicator
        this.indicator.textContent = "Saving...";
        this.indicator.classList.add("saving");

        this.saveTimeout = setTimeout(() => {
            try {
                const saveData = {
                    version: "1.0",
                    lastSaved: new Date().toISOString(),
                    data: data,
                };
                localStorage.setItem(this.storageKey, JSON.stringify(saveData));
                this.showSaveIndicator();
            } catch (error) {
                console.error("Error saving to localStorage:", error);
                this.indicator.textContent = "Save failed";
                this.indicator.classList.remove("saving");
            }
        }, 500);
    }

    showSaveIndicator() {
        this.indicator.textContent = "Auto-saved";
        this.indicator.classList.remove("saving");

        setTimeout(() => {
            this.indicator.textContent = "";
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
            console.error("Error loading from localStorage:", error);
        }
        return null;
    }

    clear() {
        localStorage.removeItem(this.storageKey);
        this.indicator.textContent = "";
    }
}

// ============================================================================
// HTML Generator Class - Generates final HTML output
// ============================================================================

class HTMLGenerator {
    constructor() {
        this.template = `<link href="https://caioluis.github.io/golden-age/template.css" rel="stylesheet" type="text/css"><div class="haruki"><h2>{{TITLE}}</h2><h3>{{SUBTITLE}}</h3><hr/>
{{NARRATIVE}}


<div class="haruki-stats"> <div class="jjk-dossier-status-item"> <span class="jjk-dossier-status-label">HP</span> <div class="jjk-dossier-status-bar-wrapper"> <div class="jjk-dossier-status-bar"><div class="jjk-dossier-status-bar-fill jjk-dossier-hp-fill" style="width: {{HP_PERCENT}}%;"></div></div> </div> <span class="jjk-dossier-status-value">{{HP_CURRENT}} / {{HP_MAX}}</span> </div> <div class="jjk-dossier-status-item"> <span class="jjk-dossier-status-label">EA</span> <div class="jjk-dossier-status-bar-wrapper"> <div class="jjk-dossier-status-bar"><div class="jjk-dossier-status-bar-fill jjk-dossier-ea-fill" style="width: {{EA_PERCENT}}%;"></div></div> </div> <span class="jjk-dossier-status-value">{{EA_CURRENT}} / {{EA_MAX}}</span> </div> <div class="jjk-dossier-status-item"> <span class="jjk-dossier-status-label">SAN</span> <div class="jjk-dossier-status-bar-wrapper"> <div class="jjk-dossier-status-bar"><div class="jjk-dossier-status-bar-fill" style="width: {{SAN_PERCENT}}%; background-color: #d3d3d3;"></div></div> </div> <span class="jjk-dossier-status-value">{{SAN_CURRENT}} / {{SAN_MAX}}</span> </div> </div><details><summary>Considerações</summary><div class="accordion-content"><div><p><div class="haruki-counter-section"><div class="haruki-counter-item"><div class="haruki-counter-value">{{WORD_COUNT}}</div><div class="haruki-counter-label">Palavras</div></div><div class="haruki-counter-item"><div class="haruki-counter-value">{{POST_CURRENT}}/{{POST_MAX}}</div><div class="haruki-counter-label">Turno</div></div><div class="haruki-counter-item"><div class="haruki-counter-value">{{ACOES_OFENSIVAS_CURRENT}}/{{ACOES_OFENSIVAS_MAX}}</div><div class="haruki-counter-label">Ofensivas</div></div><div class="haruki-counter-item"><div class="haruki-counter-value">{{ACOES_DEFENSIVAS_CURRENT}}/{{ACOES_DEFENSIVAS_MAX}}</div><div class="haruki-counter-label">Defensivas</div></div><div class="haruki-counter-item"><div class="haruki-counter-value">{{ACOES_SUPORTE_CURRENT}}/{{ACOES_SUPORTE_MAX}}</div><div class="haruki-counter-label">Suporte</div></div><div class="haruki-counter-item"><div class="haruki-counter-value">{{ACAO_LIVRE_CURRENT}}/{{ACAO_LIVRE_MAX}}</div><div class="haruki-counter-label">Livre</div></div></div>
[b]Objetivo:[/b] {{OBJETIVO}}
[b]Principais ações no turno:[/b] {{PRINCIPAIS_ACOES}}
[b]Obs.:[/b] {{OBS}}
[b]Aptidões Usadas:[/b] {{APTIDOES}}
[b]Modificadores:[/b] {{MODIFICADORES}}
</p></div></div>
<details><summary>Carregando consigo</summary><div class="accordion-content"><div>{{CARREGANDO}}</div></div></details>
<details><summary>Bonificações de status</summary><div class="accordion-content"><div><p>{{BONIFICACOES}}</p></div></div></details>
<details><summary>Técnicas Usadas</summary><div class="accordion-content"><div><p>{{TECNICAS}}</p></div></div></details>
</details>
</div>`;
    }

    calcPercent(current, max) {
        const c = parseFloat(current);
        const m = parseFloat(max);
        if (!m || isNaN(c) || isNaN(m)) return "100";
        return Math.round((c / m) * 100).toString();
    }

    generate(formData) {
        // Replace all placeholders
        let html = this.template
            .replace("{{TITLE}}", formData.title)
            .replace("{{SUBTITLE}}", formData.subtitle)
            .replace("{{NARRATIVE}}", this.processNarrative(formData.narrative))
            .replace("{{HP_PERCENT}}", this.calcPercent(formData.hpCurrent, formData.hpMax))
            .replace("{{HP_CURRENT}}", formData.hpCurrent)
            .replace("{{HP_MAX}}", formData.hpMax)
            .replace("{{EA_PERCENT}}", this.calcPercent(formData.eaCurrent, formData.eaMax))
            .replace("{{EA_CURRENT}}", formData.eaCurrent)
            .replace("{{EA_MAX}}", formData.eaMax)
            .replace("{{SAN_PERCENT}}", this.calcPercent(formData.sanCurrent, formData.sanMax))
            .replace("{{SAN_CURRENT}}", formData.sanCurrent)
            .replace("{{SAN_MAX}}", formData.sanMax)
            .replace(
                "{{ACOES_OFENSIVAS_CURRENT}}",
                formData.acoesOfensivasCurrent,
            )
            .replace("{{ACOES_OFENSIVAS_MAX}}", formData.acoesOfensivasMax)
            .replace(
                "{{ACOES_DEFENSIVAS_CURRENT}}",
                formData.acoesDefensivasCurrent,
            )
            .replace("{{ACOES_DEFENSIVAS_MAX}}", formData.acoesDefensivasMax)
            .replace("{{ACOES_SUPORTE_CURRENT}}", formData.acoesSuporteCurrent)
            .replace("{{ACOES_SUPORTE_MAX}}", formData.acoesSuporteMax)
            .replace("{{ACAO_LIVRE_CURRENT}}", formData.acaoLivreCurrent)
            .replace("{{ACAO_LIVRE_MAX}}", formData.acaoLivreMax)
            .replace("{{WORD_COUNT}}", formData.wordCount)
            .replace("{{POST_CURRENT}}", formData.postCurrent)
            .replace("{{POST_MAX}}", formData.postMax)
            .replace("{{OBJETIVO}}", formData.objetivo)
            .replace("{{PRINCIPAIS_ACOES}}", formData.principaisAcoes)
            .replace("{{OBS}}", formData.obs)
            .replace("{{APTIDOES}}", formData.aptidoes)
            .replace("{{MODIFICADORES}}", formData.modificadores)
            .replace("{{CARREGANDO}}", formData.carregando)
            .replace("{{BONIFICACOES}}", formData.bonificacoes)
            .replace("{{TECNICAS}}", formData.tecnicas);

        return html;
    }

    processNarrative(text) {
        // Split by double line breaks to create paragraphs
        const paragraphs = text
            .split("\n\n")
            .map((para) => para.trim())
            .filter((para) => para.length > 0);

        // Join with proper spacing
        return paragraphs.join("\n\n");
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
            errors.push("Title is required");
        }

        // Subtitle validation
        if (!formData.subtitle.trim()) {
            errors.push("Subtitle is required");
        }

        // Narrative validation
        if (formData.narrative.trim().length < 10) {
            errors.push("Narrative must be at least 10 characters");
        }

        // HP validation
        if (!this.isValidNumber(formData.hpCurrent)) {
            errors.push("HP Current must be a number");
        }
        if (!this.isValidNumber(formData.hpMax)) {
            errors.push("HP Max must be a number");
        }

        // EA validation
        if (!this.isValidNumber(formData.eaCurrent)) {
            errors.push("EA Current must be a number");
        }
        if (!this.isValidNumber(formData.eaMax)) {
            errors.push("EA Max must be a number");
        }

        // SAN validation
        if (!this.isValidNumber(formData.sanCurrent)) {
            errors.push("SAN Current must be a number");
        }
        if (!this.isValidNumber(formData.sanMax)) {
            errors.push("SAN Max must be a number");
        }

        // Word count validation
        if (formData.wordCount && !this.isValidNumber(formData.wordCount)) {
            errors.push("Word Count must be a number");
        }

        return errors;
    }

    isValidNumber(value) {
        if (!value || value.trim() === "") return false;
        return /^\d+$/.test(value.trim());
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

function showStatusMessage(message, type = "success") {
    const statusDiv = document.getElementById("statusMessage");
    statusDiv.textContent = message;
    statusDiv.className = "status-message status-" + type;
    statusDiv.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = "none";
    }, 5000);
}

async function copyToClipboard(text) {
    try {
        // Try modern Clipboard API first
        await navigator.clipboard.writeText(text);
        showStatusMessage("HTML copied to clipboard!", "success");
    } catch (err) {
        // Fallback for older browsers
        try {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            showStatusMessage("HTML copied to clipboard!", "success");
        } catch (fallbackErr) {
            showStatusMessage("Failed to copy to clipboard", "error");
            console.error("Clipboard error:", fallbackErr);
        }
    }
}

function getFormData() {
    return {
        title: document.getElementById("title").value,
        subtitle: document.getElementById("subtitle").value,
        narrative: document.getElementById("narrative").value,
        hpCurrent: document.getElementById("hpCurrent").value,
        hpMax: document.getElementById("hpMax").value,
        eaCurrent: document.getElementById("eaCurrent").value,
        eaMax: document.getElementById("eaMax").value,
        sanCurrent: document.getElementById("sanCurrent").value,
        sanMax: document.getElementById("sanMax").value,
        acoesOfensivasCurrent: document.getElementById("acoesOfensivasCurrent")
            .value,
        acoesOfensivasMax: document.getElementById("acoesOfensivasMax").value,
        acoesDefensivasCurrent: document.getElementById(
            "acoesDefensivasCurrent",
        ).value,
        acoesDefensivasMax: document.getElementById("acoesDefensivasMax").value,
        acoesSuporteCurrent: document.getElementById("acoesSuporteCurrent")
            .value,
        acoesSuporteMax: document.getElementById("acoesSuporteMax").value,
        acaoLivreCurrent: document.getElementById("acaoLivreCurrent").value,
        acaoLivreMax: document.getElementById("acaoLivreMax").value,
        wordCount: document.getElementById("wordCount").value,
        postCurrent: document.getElementById("postCurrent").value,
        postMax: document.getElementById("postMax").value,
        objetivo: document.getElementById("objetivo").value,
        principaisAcoes: document.getElementById("principaisAcoes").value,
        obs: document.getElementById("obs").value,
        aptidoes: document.getElementById("aptidoes").value,
        modificadores: document.getElementById("modificadores").value,
        bonificacoes: document.getElementById("bonificacoes").value,
        tecnicas: document.getElementById("tecnicas").value,
        carregando: buildCarregandoText(),
        parsedItems: parsedItems,
        selectedEquipment: selectedEquipment,
    };
}

function setFormData(data) {
    if (!data) return;

    document.getElementById("title").value = data.title || "";
    document.getElementById("subtitle").value = data.subtitle || "";
    document.getElementById("narrative").value = data.narrative || "";
    document.getElementById("hpCurrent").value = data.hpCurrent || "";
    document.getElementById("hpMax").value = data.hpMax || "";
    document.getElementById("eaCurrent").value = data.eaCurrent || "";
    document.getElementById("eaMax").value = data.eaMax || "";
    document.getElementById("sanCurrent").value = data.sanCurrent || "";
    document.getElementById("sanMax").value = data.sanMax || "";
    document.getElementById("acoesOfensivasCurrent").value =
        data.acoesOfensivasCurrent || "0";
    document.getElementById("acoesOfensivasMax").value =
        data.acoesOfensivasMax || "3";
    document.getElementById("acoesDefensivasCurrent").value =
        data.acoesDefensivasCurrent || "0";
    document.getElementById("acoesDefensivasMax").value =
        data.acoesDefensivasMax || "3";
    document.getElementById("acoesSuporteCurrent").value =
        data.acoesSuporteCurrent || "0";
    document.getElementById("acoesSuporteMax").value =
        data.acoesSuporteMax || "2";
    document.getElementById("acaoLivreCurrent").value =
        data.acaoLivreCurrent || "0";
    document.getElementById("acaoLivreMax").value = data.acaoLivreMax || "1";
    document.getElementById("wordCount").value = data.wordCount || "";
    document.getElementById("postCurrent").value = data.postCurrent || "";
    document.getElementById("postMax").value = data.postMax || "";
    document.getElementById("objetivo").value = data.objetivo || "";
    document.getElementById("principaisAcoes").value = data.principaisAcoes || "";
    document.getElementById("obs").value = data.obs || "";
    document.getElementById("aptidoes").value = data.aptidoes || "";
    document.getElementById("modificadores").value = data.modificadores || "";
    document.getElementById("bonificacoes").value = data.bonificacoes || "";
    document.getElementById("tecnicas").value = data.tecnicas || "";

    // Restore equipment selections
    if (data.selectedEquipment) {
        selectedEquipment = data.selectedEquipment;
    }
    if (data.parsedItems && data.parsedItems.length > 0) {
        renderEquipmentList(data.parsedItems);
    }
}

function clearAllFields() {
    if (
        confirm(
            "Are you sure you want to clear all fields? This cannot be undone.",
        )
    ) {
        document.getElementById("editorForm").reset();
        storageManager.clear();
        showStatusMessage("All fields cleared", "success");
    }
}

// ============================================================================
// Equipment Manager - Parses secundary.html and manages selections
// ============================================================================

let selectedEquipment = {}; // { index: { selected: bool, note: string } }
let parsedItems = [];

function parseSecundaryHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const items = [];

    doc.querySelectorAll(".i-c").forEach((card) => {
        const name = card.querySelector(".i-n")?.textContent?.trim() || "";
        const type = card.querySelector(".i-tp")?.textContent?.trim() || "";
        const img = card.querySelector(".i-m")?.getAttribute("src") || "";
        const statsEl = card.querySelector(".i-st");
        const desc = card.querySelector(".i-d")?.textContent?.trim() || "";
        const effectEl = card.querySelector(".i-ef");

        // Parse stats text
        let stats = "";
        if (statsEl) {
            stats = statsEl.textContent.replace(/\s+/g, " ").trim();
        }

        // Parse effect - get text content after "Efeito:"
        let effect = "";
        if (effectEl) {
            effect = effectEl.textContent.replace(/^Efeito:\s*/, "").trim();
        }

        if (name) {
            items.push({ name, type, img, stats, desc, effect });
        }
    });

    return items;
}

function renderEquipmentList(items) {
    parsedItems = items;
    const list = document.getElementById("equipmentList");
    list.innerHTML = "";

    items.forEach((item, index) => {
        const sel = selectedEquipment[index] || { selected: false, note: "" };

        const card = document.createElement("div");
        card.className = "eq-card" + (sel.selected ? " eq-selected" : "");

        const hasImg = item.img && !item.img.includes("placeholder");
        const imgHtml = hasImg ? `<img src="${item.img}" class="eq-img" alt="${item.name}">` : "";
        const statsHtml = item.stats ? `<div class="eq-stats">${item.stats}</div>` : "";
        const descHtml = item.desc ? `<div class="eq-desc">${item.desc}</div>` : "";
        const effectHtml = item.effect ? `<div class="eq-effect">Efeito: ${item.effect}</div>` : "";

        card.innerHTML = `
            <label class="eq-check-label">
                <input type="checkbox" class="eq-check" data-index="${index}" ${sel.selected ? "checked" : ""}>
                <span class="eq-name">${item.name}</span>
                ${item.type ? `<span class="eq-type">${item.type}</span>` : ""}
            </label>
            <div class="eq-body">
                ${imgHtml}
                <div class="eq-details">
                    ${statsHtml}
                    ${descHtml}
                    ${effectHtml}
                </div>
            </div>
            <input type="text" class="eq-note editor-input" data-index="${index}" placeholder="Ex: na mochila, empunhada..." value="${sel.note || ""}">
        `;

        list.appendChild(card);
    });

    // Bind events
    list.querySelectorAll(".eq-check").forEach((cb) => {
        cb.addEventListener("change", (e) => {
            const idx = e.target.dataset.index;
            if (!selectedEquipment[idx]) selectedEquipment[idx] = { selected: false, note: "" };
            selectedEquipment[idx].selected = e.target.checked;
            e.target.closest(".eq-card").classList.toggle("eq-selected", e.target.checked);
            storageManager.scheduleSave(getFormData());
        });
    });

    list.querySelectorAll(".eq-note").forEach((input) => {
        input.addEventListener("input", (e) => {
            const idx = e.target.dataset.index;
            if (!selectedEquipment[idx]) selectedEquipment[idx] = { selected: false, note: "" };
            selectedEquipment[idx].note = e.target.value;
            storageManager.scheduleSave(getFormData());
        });
    });
}

function buildCarregandoText() {
    const items = [];

    parsedItems.forEach((item, index) => {
        const sel = selectedEquipment[index];
        if (!sel || !sel.selected) return;

        const note = sel.note ? ` (${sel.note})` : "";
        let html = `<div class="haruki-carry-item">`;
        if (item.img && !item.img.includes("placeholder")) {
            html += `<img src="${item.img}" class="haruki-carry-img">`;
        }
        html += `<div class="haruki-carry-info">`;
        html += `<strong>${item.name}${note}</strong>`;
        if (item.type) html += `<br>${item.type}`;
        if (item.stats) html += `<br>${item.stats}`;
        if (item.desc) html += `<br>${item.desc}`;
        if (item.effect) html += `<br>Efeito: ${item.effect}`;
        html += `</div></div>`;
        items.push(html);
    });

    return items.join("\n");
}

// ============================================================================
// Initialize Application
// ============================================================================

// Global instances
const textWrapper = new TextWrapper("narrative");
const storageManager = new StorageManager();
const htmlGenerator = new HTMLGenerator();
const formValidator = new FormValidator();

// Load saved data on page load
document.addEventListener("DOMContentLoaded", () => {
    // Load saved data
    const savedData = storageManager.load();
    if (savedData) {
        setFormData(savedData);
        showStatusMessage("Previous work loaded", "success");
    }

    // Text wrapping buttons
    document.getElementById("btnSpeech").addEventListener("click", () => {
        textWrapper.wrapSelection("haruki-speaks");
    });

    document.getElementById("btnThought").addEventListener("click", () => {
        textWrapper.wrapSelection("haruki-thinks");
    });

    document.getElementById("btnClearFormat").addEventListener("click", () => {
        textWrapper.removeFormatting();
    });

    document.getElementById("btnMusic").addEventListener("click", () => {
        const label = document.getElementById("musicLabel").value.trim();
        const url = document.getElementById("musicUrl").value.trim();

        if (!label || !url) {
            showStatusMessage("Please fill in both label and audio URL", "warning");
            return;
        }

        const snippet = `<div class="music-player">${label} <audio controls controlsList="nodownload noplaybackrate nofullscreen noremoteplayback" src="${url}"></audio></div>`;
        textWrapper.insertAtCursor(snippet);

        document.getElementById("musicLabel").value = "";
        document.getElementById("musicUrl").value = "";

        showStatusMessage("Music player inserted", "success");
    });

    // Generate & Copy button
    document.getElementById("btnGenerate").addEventListener("click", () => {
        const formData = getFormData();
        const errors = formValidator.validate(formData);

        if (errors.length > 0) {
            showStatusMessage(
                "Validation errors: " + errors.join(", "),
                "error",
            );
            return;
        }

        const html = htmlGenerator.generate(formData);
        copyToClipboard(html);
    });

    // Clear All button
    document
        .getElementById("btnClear")
        .addEventListener("click", clearAllFields);

    // Auto-save on input changes
    const formInputs = document.querySelectorAll(".editor-form .editor-input");
    formInputs.forEach((input) => {
        input.addEventListener("input", () => {
            storageManager.scheduleSave(getFormData());
        });
    });

    // Parse pasted HTML for equipment
    document.getElementById("btnParseHtml").addEventListener("click", () => {
        const html = document.getElementById("htmlPasteArea").value.trim();
        if (!html) {
            showStatusMessage("Paste your secundary.html code first", "warning");
            return;
        }
        const items = parseSecundaryHTML(html);
        if (items.length === 0) {
            showStatusMessage("No items found in pasted HTML", "warning");
            return;
        }
        selectedEquipment = {};
        renderEquipmentList(items);
        storageManager.scheduleSave(getFormData());
        showStatusMessage(`Loaded ${items.length} items`, "success");
    });
});
