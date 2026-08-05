// ================================================================
// SMART IMPORT - Using Centralized Parser Service
// ================================================================

// ================================================================
// SMART IMPORT STATE
// ================================================================

const SmartImportState = {
    records: [],
    validRecords: [],
    invalidRecords: [],
    duplicates: [],
    processing: false,
    progress: 0,
    isParsing: false,
    parseStartTime: null,
    parseEndTime: null,
    currentTranscript: null,
    isEditable: false,
    useAI: false,
    fallbackToRuleBased: true,
    parsedData: null,
    aiAvailable: false,
    aiEnabled: false
};

// ================================================================
// SMART IMPORT CONFIG
// ================================================================

const SMART_IMPORT_CONFIG = {
    useAI: false,
    fallbackToRuleBased: true,
    showConfidence: true,
    showEvidence: true,
    showAIStatus: true,
    defaultStatus: 'Meeting Booked',
    defaultAssigned: 'Daniel',
    confidenceThreshold: 0.6
};

// ================================================================
// DOM HELPERS
// ================================================================

const SmartImportDOM = window.DOM || {
    get(id) { return document.getElementById(id); },
    show(id) { const el = document.getElementById(id); if (el) el.style.display = 'block'; },
    hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; },
    setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; },
    setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
};

// ================================================================
// OPEN SMART IMPORT
// ================================================================

function openSmartImportEnhanced() {
    console.log('📥 Opening Smart Import...');
    const modal = SmartImportDOM.get('smartImportModal');
    if (!modal) {
        console.warn('⚠️ Smart Import modal not found');
        if (window.showToast) window.showToast('Smart Import modal not found', 'error');
        return;
    }
    
    modal.style.display = 'flex';
    
    AppState.importRecords = [];
    AppState.importProcessing = false;
    AppState.importProgress = 0;
    SmartImportState.isParsing = false;
    SmartImportState.parsedData = null;
    SmartImportState.aiAvailable = false;
    SmartImportState.aiEnabled = false;
    
    const dateInput = SmartImportDOM.get('importDefaultDate');
    if (dateInput) {
        dateInput.value = Utils.getTodayStr();
    }
    
    const textArea = SmartImportDOM.get('importTextArea');
    if (textArea) {
        textArea.value = '';
        textArea.placeholder = `Paste your conversation transcript here. The smart parser will extract all CRM fields.

Example transcript:
"Flynn: Hey, is this RG77 Tires?
Prospect: Yes, sir.
Flynn: Awesome, Flynn here. I found you online and my team created a custom website preview for your business. I was wondering if you have a few moments tomorrow to look at it?
Prospect: Honestly, tomorrow I ain't gonna be here.
Flynn: What date this week would be best?
Prospect: Thursday morning.
Flynn: Great, I'll call you Thursday at 9:00 AM EDT. May I ask for the best email to send the invite?
Prospect: Right now, my email doesn't work, it's full. Just call me Thursday.
Flynn: I'll try to call you back Thursday if you have an update on the email. My manager will prepare a 10-minute walkthrough."`;
    }
    
    const preview = SmartImportDOM.get('importPreview');
    if (preview) preview.style.display = 'none';
    
    const saveBtn = SmartImportDOM.get('saveImportBtn');
    if (saveBtn) saveBtn.style.display = 'none';
    
    const resultsContainer = SmartImportDOM.get('importResultsContainer');
    if (resultsContainer) resultsContainer.innerHTML = '';
    
    const progressContainer = SmartImportDOM.get('importProgressContainer');
    if (progressContainer) progressContainer.style.display = 'none';
    
    const summary = SmartImportDOM.get('importSummary');
    if (summary) summary.style.display = 'none';
    
    // Update status display
    const statusEl = SmartImportDOM.get('aiStatusDisplay');
    if (statusEl) {
        statusEl.textContent = '🧠 Smart Parser - Ready';
        statusEl.className = 'ai-status-display';
        statusEl.style.borderColor = 'var(--primary)';
        statusEl.style.background = 'rgba(59, 130, 246, 0.1)';
        statusEl.style.color = 'var(--primary)';
    }
    
    // Update parse button
    const parseBtn = SmartImportDOM.get('parseImportBtn');
    if (parseBtn) {
        parseBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Parse Transcript';
        parseBtn.disabled = false;
    }
}

// ================================================================
// CLOSE SMART IMPORT
// ================================================================

function closeSmartImportEnhanced() {
    const modal = SmartImportDOM.get('smartImportModal');
    if (modal) modal.style.display = 'none';
    AppState.importRecords = [];
    AppState.importProcessing = false;
    SmartImportState.isParsing = false;
    SmartImportState.currentTranscript = null;
    SmartImportState.parsedData = null;
}

// ================================================================
// PARSE AND PREVIEW - Using Smart Parser Service
// ================================================================

async function parseAndPreviewImportEnhanced() {
    console.log('🔍 Parsing transcript with Smart Parser...');
    const textArea = SmartImportDOM.get('importTextArea');
    if (!textArea) {
        if (window.showToast) window.showToast('Text area not found', 'error');
        return;
    }
    
    const text = textArea.value;
    if (!text.trim()) {
        if (window.showToast) window.showToast('Please paste a transcript to parse', 'warning');
        return;
    }
    
    const dateInput = SmartImportDOM.get('importDefaultDate');
    const defaultDate = dateInput ? dateInput.value : Utils.getTodayStr();
    
    const progressContainer = SmartImportDOM.get('importProgressContainer');
    if (progressContainer) progressContainer.style.display = 'block';
    AppState.importProcessing = true;
    SmartImportState.isParsing = true;
    AppState.importProgress = 0;
    SmartImportState.parseStartTime = Date.now();
    SmartImportState.currentTranscript = text;
    
    const parseBtn = SmartImportDOM.get('parseImportBtn');
    if (parseBtn) {
        parseBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Parsing...';
        parseBtn.disabled = true;
    }
    
    updateImportProgress(10, '📋 Initializing smart parser...');
    
    try {
        // Use the smart parser service
        updateImportProgress(20, '🧠 Running smart parser...');
        
        const parsed = smartParser.parse(text, { date: defaultDate });
        
        updateImportProgress(40, '📊 Analyzing extracted data...');
        
        // Validate parsed data
        const validation = smartParser.validate(parsed);
        
        updateImportProgress(60, '📝 Creating CRM record...');
        
        // Create CRM record
        const crmRecord = smartParser.toCRMRecord(parsed);
        
        updateImportProgress(80, '📋 Building record...');
        
        // Create import record
        const record = createImportRecord(parsed, crmRecord, text, defaultDate, validation);
        
        AppState.importRecords = [record];
        SmartImportState.parsedData = record;
        
        updateImportProgress(90, '✅ Analysis complete!');
        
        const parseTime = ((Date.now() - SmartImportState.parseStartTime) / 1000).toFixed(1);
        
        setTimeout(() => {
            renderImportResults([record], Math.round(record.confidence * 100), parseTime);
            AppState.importProcessing = false;
            SmartImportState.isParsing = false;
            updateImportProgress(100, '✨ Ready! Review and save.');
            
            setTimeout(() => {
                if (progressContainer) progressContainer.style.display = 'none';
            }, 1500);
            
            if (parseBtn) {
                parseBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Parse Transcript';
                parseBtn.disabled = false;
            }
            
            if (window.showToast) {
                window.showToast('✅ Analysis complete! Review the extracted data below.', 'success');
            }
        }, 400);
        
    } catch (error) {
        console.error('Smart Import parse error:', error);
        if (window.showToast) {
            window.showToast('Error parsing transcript: ' + error.message, 'error');
        }
        AppState.importProcessing = false;
        SmartImportState.isParsing = false;
        if (progressContainer) progressContainer.style.display = 'none';
        if (parseBtn) {
            parseBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Parse Transcript';
            parseBtn.disabled = false;
        }
    }
}

// ================================================================
// CREATE IMPORT RECORD
// ================================================================

function createImportRecord(parsed, crmRecord, text, defaultDate, validation) {
    const record = {
        index: 1,
        raw: text,
        parsed: parsed,
        crmRecord: crmRecord,
        confidence: parsed.confidence ? parsed.confidence.overall : 0,
        validated: {
            business: crmRecord.businessName || '',
            name: crmRecord.contactName || '',
            role: crmRecord.role || 'Owner',
            phone: crmRecord.phone || '',
            email: crmRecord.email || '',
            date: crmRecord.date || defaultDate,
            time: crmRecord.time || '',
            status: crmRecord.status || 'Pending',
            assigned: crmRecord.assigned || 'Daniel',
            notes: crmRecord.notes || '',
            tags: crmRecord.tags || []
        },
        isValid: validation.isValid,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        uncertainFields: [],
        hasDuplicate: false,
        duplicates: [],
        avgConfidence: parsed.confidence ? parsed.confidence.overall : 0,
        qualityScore: 5,
        callSummary: parsed.notes ? parsed.notes.join(' ') : '',
        detectedObjections: [],
        missingInformation: [],
        suggestedFollowUp: [],
        tags: parsed.tags || [],
        sentiment: 'Neutral',
        businessGoals: '',
        websiteStatus: '',
        interestLevel: '',
        followUpActions: [],
        speakers: parsed.speakers || {},
        appointment: parsed.appointment || null
    };
    
    // Check for duplicates
    const existingAppointments = Data.getAllAppointments();
    for (const existing of existingAppointments) {
        if (record.validated.business && existing.business && 
            record.validated.business.toLowerCase().trim() === existing.business.toLowerCase().trim() &&
            record.validated.phone && existing.phone &&
            record.validated.phone.replace(/[^\d+]/g, '') === existing.phone.replace(/[^\d+]/g, '')) {
            record.hasDuplicate = true;
            record.duplicates.push({
                existing: existing,
                confidence: 85,
                matchedFields: ['business', 'phone'],
                score: 1
            });
            break;
        }
    }
    
    // Check for uncertain fields
    const uncertain = [];
    const requiredFields = ['business', 'name', 'phone', 'email', 'date'];
    for (const field of requiredFields) {
        if (!record.validated[field] || record.validated[field] === '') {
            uncertain.push({ field, message: `Missing ${field}` });
        }
    }
    record.uncertainFields = uncertain;
    
    return record;
}

// ================================================================
// RENDER IMPORT RESULTS - UPDATED with Parser Data
// ================================================================

function renderImportResults(records, avgConfidence, parseTime) {
    const preview = SmartImportDOM.get('importPreview');
    const resultsContainer = SmartImportDOM.get('importResultsContainer');
    const saveBtn = SmartImportDOM.get('saveImportBtn');
    const summary = SmartImportDOM.get('importSummary');
    const recordCount = SmartImportDOM.get('importRecordCount');
    
    if (!preview || !resultsContainer) return;
    
    preview.style.display = 'block';
    
    if (recordCount) {
        recordCount.textContent = records.length;
    }
    
    if (summary) {
        const total = records.length;
        const valid = records.filter(r => r.isValid).length;
        const invalid = records.filter(r => !r.isValid).length;
        const duplicates = records.filter(r => r.hasDuplicate).length;
        const uncertain = records.filter(r => r.uncertainFields && r.uncertainFields.length > 0).length;
        
        const confidenceLabel = avgConfidence >= 80 ? 'High' : (avgConfidence >= 60 ? 'Medium' : 'Low');
        const confidenceColor = avgConfidence >= 80 ? 'success' : (avgConfidence >= 60 ? 'warning' : 'danger');
        
        summary.style.display = 'block';
        summary.innerHTML = `
            <div class="import-summary-grid">
                <div class="import-stat success">
                    <span class="stat-number">${valid}</span>
                    <span class="stat-label">✅ Valid</span>
                </div>
                <div class="import-stat ${invalid > 0 ? 'warning' : ''}">
                    <span class="stat-number">${invalid}</span>
                    <span class="stat-label">⚠️ Needs Review</span>
                </div>
                <div class="import-stat ${duplicates > 0 ? 'warning' : ''}">
                    <span class="stat-number">${duplicates}</span>
                    <span class="stat-label">🔄 Duplicates</span>
                </div>
                <div class="import-stat ${uncertain > 0 ? 'warning' : ''}">
                    <span class="stat-number">${uncertain}</span>
                    <span class="stat-label">❓ Uncertain Fields</span>
                </div>
                <div class="import-stat" style="grid-column: span 1;">
                    <span class="stat-number" style="color: var(--${confidenceColor});">${avgConfidence}%</span>
                    <span class="stat-label">📊 Confidence (${confidenceLabel})</span>
                </div>
                <div class="import-stat" style="grid-column: span 1;">
                    <span class="stat-number">${parseTime || '0.0'}s</span>
                    <span class="stat-label">⏱️ Parse Time</span>
                </div>
            </div>
        `;
    }
    
    let resultsHtml = '';
    records.forEach((record) => {
        const data = record.validated || {};
        const parsed = record.parsed || {};
        
        const fields = [
            { key: 'business', label: 'Business Name', value: data.business, confidence: record.avgConfidence },
            { key: 'name', label: 'Contact Name', value: data.name, confidence: record.avgConfidence },
            { key: 'role', label: 'Role', value: data.role, confidence: record.avgConfidence },
            { key: 'phone', label: 'Phone Number', value: data.phone, confidence: record.avgConfidence },
            { key: 'email', label: 'Email', value: data.email, confidence: record.avgConfidence },
            { key: 'date', label: 'Date', value: data.date, confidence: record.avgConfidence },
            { key: 'time', label: 'Time', value: data.time, confidence: record.avgConfidence },
            { key: 'status', label: 'Status', value: data.status, confidence: record.avgConfidence }
        ];
        
        const fieldRows = fields.map(f => {
            const isNA = f.value === 'N/A' || !f.value || f.value === '';
            const valueDisplay = f.key === 'date' && f.value && f.value !== 'N/A' ? Utils.formatDate(f.value) : f.value;
            const conf = f.confidence || 0;
            const confLabel = conf >= 0.8 ? 'High' : (conf >= 0.5 ? 'Medium' : 'Low');
            const confClass = conf >= 0.8 ? 'high' : (conf >= 0.5 ? 'medium' : 'low');
            
            return `
                <div class="field-row ${isNA ? 'na-field' : ''} ${confClass}">
                    <span class="field-label">${f.label}</span>
                    <span class="field-value ${isNA ? 'na-value' : ''}">${isNA ? 'N/A' : Utils.escapeHtml(valueDisplay)}</span>
                    <span class="field-confidence ${confClass}">${isNA ? 'Missing' : confLabel}</span>
                </div>
            `;
        }).join('');
        
        // Appointment info
        const appointmentInfo = parsed.appointment && parsed.appointment.confirmed ? `
            <div class="field-row" style="background: var(--bg-primary); border-left: 3px solid var(--success);">
                <span class="field-label">📅 Appointment</span>
                <span class="field-value">${parsed.appointment.datetime || 'Confirmed'}</span>
                <span class="field-confidence high">✓</span>
            </div>
        ` : '';
        
        // Speaker info
        const speakerInfo = parsed.speakers && parsed.speakers.identified ? `
            <div class="field-row" style="background: var(--bg-primary);">
                <span class="field-label">🎙️ Speakers</span>
                <span class="field-value">Setter: ${parsed.speakers.setter || 'Unknown'} | Prospect: ${parsed.speakers.prospect || 'Unknown'}</span>
            </div>
        ` : '';
        
        resultsHtml += `
            <div class="import-record ${record.isValid ? 'valid' : 'invalid'}">
                <div class="record-header" onclick="window.toggleImportRecord(this)">
                    <div class="record-status">
                        <span class="status-icon">${record.isValid ? '✅' : '⚠️'}</span>
                        <span class="record-index">#${record.index}</span>
                    </div>
                    <div class="record-summary">
                        <span class="record-name">${data.name && data.name !== 'N/A' && data.name !== '' ? Utils.escapeHtml(data.name) : 'Unknown'}</span>
                        <span class="record-business">${data.business && data.business !== 'N/A' && data.business !== '' ? Utils.escapeHtml(data.business) : 'Unknown Business'}</span>
                        ${data.status && data.status !== 'N/A' && data.status !== '' ? `<span class="record-status-badge">${Utils.escapeHtml(data.status)}</span>` : ''}
                        ${parsed.appointment && parsed.appointment.confirmed ? `<span class="record-quality" style="background: var(--success);">📅 Booked</span>` : ''}
                    </div>
                    <div class="record-badges">
                        ${record.hasDuplicate ? '<span class="badge duplicate">🔄 Duplicate</span>' : ''}
                        ${record.uncertainFields && record.uncertainFields.length > 0 ? `<span class="badge warning">❓ ${record.uncertainFields.length}</span>` : ''}
                        ${record.tags && record.tags.length > 0 ? `<span class="badge confidence high">🏷️ ${record.tags.length}</span>` : ''}
                        <span class="badge confidence ${record.avgConfidence >= 0.7 ? 'high' : record.avgConfidence >= 0.4 ? 'medium' : 'low'}">${Math.round(record.avgConfidence * 100)}%</span>
                    </div>
                    <span class="record-toggle">▼</span>
                </div>
                <div class="record-body" style="display:none;">
                    <div class="record-fields">${fieldRows}</div>
                    ${appointmentInfo}
                    ${speakerInfo}
                    
                    ${record.callSummary ? `
                        <div style="padding:8px 12px; background:var(--bg-primary); border-radius:6px; margin-top:8px;">
                            <strong>📝 Summary:</strong>
                            <div style="margin-top:4px; font-size:0.8rem; color:var(--text-secondary);">${Utils.escapeHtml(record.callSummary)}</div>
                        </div>
                    ` : ''}
                    
                    ${record.uncertainFields && record.uncertainFields.length > 0 ? `
                        <div class="record-uncertain">
                            <strong>❓ Uncertain Fields:</strong>
                            <ul>${record.uncertainFields.map(u => `<li>${u.field}: ${u.message}</li>`).join('')}</ul>
                        </div>
                    ` : ''}
                    
                    ${record.hasDuplicate && record.duplicates && record.duplicates.length > 0 ? `
                        <div class="record-duplicates">
                            <strong>🔄 Potential Duplicate:</strong>
                            <ul>${record.duplicates.map(d => 
                                `<li>${Utils.escapeHtml(d.existing.business)} - ${Utils.escapeHtml(d.existing.contactName)} (${d.confidence}% match)</li>`
                            ).join('')}</ul>
                            <div class="duplicate-actions">
                                <button class="btn-icon review-duplicate" onclick="window.reviewDuplicate('${record.index}')">Review</button>
                                <button class="btn-icon update-duplicate" onclick="window.updateDuplicate('${record.index}')">Update</button>
                                <button class="btn-icon import-new" onclick="window.importAsNew('${record.index}')">Import as New</button>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${record.tags && record.tags.length > 0 ? `
                        <div style="padding:8px 12px; margin-top:8px;">
                            <strong>🏷️ Tags:</strong>
                            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
                                ${record.tags.map(tag => `<span class="prospect-tag">#${Utils.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = resultsHtml;
    
    const validRecords = records.filter(r => r.isValid);
    if (saveBtn && validRecords.length > 0) {
        saveBtn.style.display = 'inline-flex';
        saveBtn.textContent = `💾 Import ${validRecords.length} Appointment(s)`;
        saveBtn.onclick = () => saveAllImportedAppointments();
    } else if (saveBtn) {
        saveBtn.style.display = 'none';
    }
}

// ================================================================
// SAVE ALL IMPORTED APPOINTMENTS - Using CRM Sync
// ================================================================

async function saveAllImportedAppointments() {
    const validRecords = AppState.importRecords.filter(r => r.isValid);
    if (validRecords.length === 0) {
        if (window.showToast) window.showToast('No valid records to import', 'warning');
        return;
    }
    if (!AppState.currentUser) {
        if (window.showToast) window.showToast('Please sign in first', 'error');
        return;
    }
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const record of validRecords) {
        try {
            // Use CRM sync service
            const result = await crmSync.importTranscript(record.raw, {
                phone: record.validated.phone,
                date: record.validated.date,
                source: 'Smart Import'
            });
            
            if (result.success) {
                savedCount++;
            } else {
                skippedCount++;
                console.warn('Import failed for record:', result.error);
            }
        } catch (error) {
            skippedCount++;
            console.error('Import error:', error);
        }
    }
    
    if (window.showToast) {
        window.showToast(`✅ Imported ${savedCount} appointment(s)! ${skippedCount > 0 ? `⏭️ Skipped ${skippedCount}` : ''}`, 'success');
    }
    closeSmartImportEnhanced();
    if (typeof FeaturePanel !== 'undefined') FeaturePanel.refreshCurrentView();
    Stats.updateAll();
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function updateImportProgress(percent, message) {
    const progressBar = SmartImportDOM.get('importProgressBar');
    const progressStatus = SmartImportDOM.get('importProgressStatus');
    if (progressBar) progressBar.style.width = Math.min(percent, 100) + '%';
    if (progressStatus && message) progressStatus.textContent = message;
}

function toggleImportRecord(header) {
    const body = header.nextElementSibling;
    if (body) {
        const isVisible = body.style.display !== 'none';
        body.style.display = isVisible ? 'none' : 'block';
        const toggle = header.querySelector('.record-toggle');
        if (toggle) toggle.textContent = isVisible ? '▶' : '▼';
    }
}

function expandAllRecords() {
    document.querySelectorAll('.import-record .record-body').forEach(body => body.style.display = 'block');
    document.querySelectorAll('.import-record .record-toggle').forEach(toggle => toggle.textContent = '▼');
}

function collapseAllRecords() {
    document.querySelectorAll('.import-record .record-body').forEach(body => body.style.display = 'none');
    document.querySelectorAll('.import-record .record-toggle').forEach(toggle => toggle.textContent = '▶');
}

function generateImportTemplate() {
    const dateInput = SmartImportDOM.get('importDefaultDate');
    const defaultDate = dateInput ? dateInput.value : Utils.getTodayStr();
    const formattedDate = defaultDate ? Utils.formatDate(defaultDate) : 'Today';
    const textArea = SmartImportDOM.get('importTextArea');
    if (!textArea) return;
    const template = `Business Name/Company : [Enter Business Name]
Name : [Enter Contact Name]
Role : [Owner/Manager/Decision Maker]
Phone Number: [Enter Phone Number]
Email: [Enter Email Address]
Demo Time & Date: ${formattedDate} at [Time] [Timezone]

Status: [Pending/Hot Transfer/Warm Callback/Meeting Booked/Completed/Canceled/No Show/Rescheduled]

Notes: [Enter notes about the conversation, interest level, and next steps]`;
    if (textArea.value && !confirm('This will replace your current text. Continue?')) return;
    textArea.value = template;
    if (window.showToast) window.showToast('📋 Template inserted!', 'success');
}

async function quickImportFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            openSmartImportEnhanced();
            const textArea = SmartImportDOM.get('importTextArea');
            if (textArea) textArea.value = text;
            setTimeout(parseAndPreviewImportEnhanced, 500);
        } else {
            if (window.showToast) window.showToast('Clipboard is empty', 'warning');
        }
    } catch (error) {
        if (window.showToast) window.showToast('Unable to read clipboard. Please paste manually.', 'error');
    }
}

function clearExtractedData() {
    if (!confirm('Clear all extracted data?')) return;
    SmartImportState.parsedData = null;
    AppState.importRecords = [];
    const preview = SmartImportDOM.get('importPreview');
    if (preview) preview.style.display = 'none';
    const resultsContainer = SmartImportDOM.get('importResultsContainer');
    if (resultsContainer) resultsContainer.innerHTML = '';
    const summary = SmartImportDOM.get('importSummary');
    if (summary) summary.style.display = 'none';
    const saveBtn = SmartImportDOM.get('saveImportBtn');
    if (saveBtn) saveBtn.style.display = 'none';
    const textArea = SmartImportDOM.get('importTextArea');
    if (textArea) textArea.value = '';
    if (window.showToast) window.showToast('🧹 Cleared all extracted data', 'info');
}

function reviewDuplicate(index) {
    const record = AppState.importRecords.find(r => r.index === index);
    if (!record || !record.duplicates || record.duplicates.length === 0) return;
    if (window.showAppointmentDetail) {
        window.showAppointmentDetail(record.duplicates[0].existing.id);
    }
}

function updateDuplicate(index) {
    const record = AppState.importRecords.find(r => r.index === index);
    if (!record || !record.duplicates || record.duplicates.length === 0) return;
    const duplicate = record.duplicates[0];
    const data = record.validated;
    if (confirm(`Update existing record for "${duplicate.existing.business}"?`)) {
        const updates = {
            business: data.business || duplicate.existing.business,
            contactName: data.name || duplicate.existing.contactName,
            role: data.role || duplicate.existing.role,
            phone: data.phone || duplicate.existing.phone,
            email: data.email || duplicate.existing.email,
            date: data.date || duplicate.existing.date,
            time: data.time || duplicate.existing.time,
            status: data.status || duplicate.existing.status,
            notes: data.notes || duplicate.existing.notes,
            assigned: data.assigned || duplicate.existing.assigned
        };
        Data.updateAppointment(duplicate.existing.date, duplicate.existing.id, updates);
        if (window.showToast) window.showToast(`✅ Updated record for ${duplicate.existing.business}`, 'success');
        record.isValid = false;
        record.saved = true;
    }
}

function importAsNew(index) {
    const record = AppState.importRecords.find(r => r.index === index);
    if (record) {
        record.forceImport = true;
        if (window.showToast) window.showToast(`✅ Will import "${record.validated.business}" as new`, 'info');
    }
}

// ================================================================
// EXPOSE GLOBALLY
// ================================================================

window.openSmartImportEnhanced = openSmartImportEnhanced;
window.closeSmartImportEnhanced = closeSmartImportEnhanced;
window.parseAndPreviewImportEnhanced = parseAndPreviewImportEnhanced;
window.renderImportResults = renderImportResults;
window.saveAllImportedAppointments = saveAllImportedAppointments;
window.toggleImportRecord = toggleImportRecord;
window.expandAllRecords = expandAllRecords;
window.collapseAllRecords = collapseAllRecords;
window.generateImportTemplate = generateImportTemplate;
window.quickImportFromClipboard = quickImportFromClipboard;
window.updateImportProgress = updateImportProgress;
window.clearExtractedData = clearExtractedData;
window.reviewDuplicate = reviewDuplicate;
window.updateDuplicate = updateDuplicate;
window.importAsNew = importAsNew;
window.SmartImportState = SmartImportState;
window.SmartImportDOM = SmartImportDOM;

window.SmartImport = {
    open: openSmartImportEnhanced,
    close: closeSmartImportEnhanced,
    parse: parseAndPreviewImportEnhanced,
    render: renderImportResults,
    save: saveAllImportedAppointments,
    state: SmartImportState,
    config: SMART_IMPORT_CONFIG
};

console.log('📥 Smart Import (Smart Parser) loaded successfully');
console.log('🧠 Using centralized Smart Parser Service');