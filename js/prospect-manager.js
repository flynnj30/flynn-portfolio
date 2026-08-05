// ================================================================
// PROSPECT MANAGER - Centralized Data Model
// ================================================================

/**
 * Prospect Schema - Single Source of Truth
 * All fields are defined here with validation rules
 * This schema is extensible - add new fields without code changes
 */
const PROSPECT_SCHEMA = {
    // Core Fields (Required)
    business: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        label: 'Business Name',
        icon: 'ðŸ¢',
        placeholder: 'Enter business name',
        section: 'core',
        example: 'MS Auto Parts and Services'
    },
    name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        label: 'Contact Name',
        icon: 'ðŸ‘¤',
        placeholder: 'Enter contact name',
        section: 'core',
        example: 'Mitch'
    },
    role: {
        type: 'string',
        required: false,
        maxLength: 50,
        label: 'Role',
        icon: 'ðŸ’¼',
        placeholder: 'e.g., Owner, Manager, CEO',
        section: 'core',
        options: ['Owner', 'Manager', 'CEO', 'Director', 'Supervisor', 'Team Lead', 'Other'],
        example: 'Owner'
    },
    phone: {
        type: 'string',
        required: false,
        pattern: /^[\+\d\s\-\(\)]{7,20}$/,
        label: 'Phone Number',
        icon: 'ðŸ“ž',
        placeholder: '+1 (555) 000-0000',
        section: 'contact',
        example: '+17867637501'
    },
    email: {
        type: 'string',
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        label: 'Email Address',
        icon: 'âœ‰ï¸',
        placeholder: 'contact@business.com',
        section: 'contact',
        example: 'mitchsells7501@gmail.com'
    },
    date: {
        type: 'date',
        required: false,
        label: 'Appointment Date',
        icon: 'ðŸ“…',
        placeholder: 'Select date',
        section: 'appointment',
        example: '2026-08-03'
    },
    time: {
        type: 'string',
        required: false,
        label: 'Appointment Time',
        icon: 'ðŸ•',
        placeholder: 'e.g., 2:30 PM',
        section: 'appointment',
        example: '9:45 AM'
    },
    status: {
        type: 'string',
        required: false,
        label: 'Status',
        icon: 'ðŸ“Š',
        section: 'appointment',
        options: ['Hot Transfer', 'Warm Callback', 'Completed', 'Pending', 'Canceled', 'Meeting Booked', 'Rescheduled', 'Overdue', 'Held'],
        example: 'Meeting Booked'
    },
    notes: {
        type: 'text',
        required: false,
        maxLength: 2000,
        label: 'Notes for the Developer',
        icon: 'ðŸ“',
        placeholder: 'Enter notes about the conversation...',
        section: 'notes',
        example: 'Custom website preview offered + no website currently + high interest'
    },
    
    // Extended Fields (Optional - Auto-detected or manually added)
    assigned: {
        type: 'string',
        required: false,
        label: 'Assigned To',
        icon: 'ðŸ‘¤',
        section: 'meta',
        options: ['Daniel', 'Sarah', 'Mike', 'Jessica', 'David']
    },
    tags: {
        type: 'array',
        required: false,
        label: 'Tags',
        icon: 'ðŸ·ï¸',
        section: 'meta',
        placeholder: 'vip, qualified_warm_call'
    },
    crmLink: {
        type: 'string',
        required: false,
        label: 'CRM Link',
        icon: 'ðŸ”—',
        section: 'meta',
        placeholder: 'https://crm.example.com/lead/123'
    },
    leadScore: {
        type: 'number',
        required: false,
        label: 'Lead Score',
        icon: 'ðŸ“ˆ',
        section: 'meta',
        min: 0,
        max: 100
    },
    source: {
        type: 'string',
        required: false,
        label: 'Source',
        icon: 'ðŸ“¡',
        section: 'meta',
        options: ['Smart Import', 'Manual Entry', 'CSV Import', 'API', 'Web Form', 'Other']
    },
    lastContacted: {
        type: 'date',
        required: false,
        label: 'Last Contacted',
        icon: 'ðŸ”„',
        section: 'meta'
    },
    followUpDate: {
        type: 'date',
        required: false,
        label: 'Follow-up Date',
        icon: 'ðŸ“†',
        section: 'meta'
    },
    sentiment: {
        type: 'string',
        required: false,
        label: 'Sentiment',
        icon: 'ðŸ˜Š',
        section: 'meta',
        options: ['Positive', 'Neutral', 'Negative', 'Very Positive', 'Very Negative']
    },
    industry: {
        type: 'string',
        required: false,
        label: 'Industry',
        icon: 'ðŸ­',
        section: 'meta',
        placeholder: 'e.g., Automotive, Healthcare, Technology'
    },
    website: {
        type: 'string',
        required: false,
        label: 'Website',
        icon: 'ðŸŒ',
        section: 'contact',
        placeholder: 'https://www.example.com'
    },
    address: {
        type: 'text',
        required: false,
        label: 'Address',
        icon: 'ðŸ“',
        section: 'contact',
        placeholder: '123 Main St, City, State, ZIP'
    }
};

// ================================================================
// PROSPECT MANAGER CLASS
// ================================================================

class ProspectManager {
    constructor() {
        this.collection = 'prospects';
        this.cache = new Map();
        this.listeners = [];
        this.isInitialized = false;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.unsubscribe = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this._initAttempted = false;
    }

    // ================================================================
    // INITIALIZATION
    // ================================================================

    init() {
        if (this.isInitialized) return this;
        if (this._initAttempted) return this;
        
        this._initAttempted = true;
        console.log('ðŸ“‹ Initializing Prospect Manager...');
        this.isInitialized = true;
        this.loadFromCache();
        this.setupListeners();
        return this;
    }

    setupListeners() {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            if (window.AppState && window.AppState.currentUser) {
                this.subscribeToFirebase();
            }
        }
    }

    subscribeToFirebase() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        try {
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(window.AppState.currentUser.uid);
            
            this.unsubscribe = userRef.collection('prospects')
                .orderBy('createdAt', 'desc')
                .onSnapshot(snap => {
                    if (this.syncInProgress) return;
                    
                    snap.docChanges().forEach(change => {
                        const data = change.doc.data();
                        const id = change.doc.id;
                        
                        if (change.type === 'removed') {
                            this.cache.delete(id);
                        } else {
                            this.cache.set(id, { ...data, id });
                        }
                    });
                    
                    this.saveToCache();
                    this.notifyListeners();
                    this.lastSyncTime = new Date();
                    this.retryCount = 0;
                }, error => {
                    console.warn('Prospect subscription error:', error);
                    this.loadFromCache();
                    this.retryConnection();
                });
        } catch (error) {
            console.warn('Prospect subscription setup error:', error);
            this.loadFromCache();
            this.retryConnection();
        }
    }

    retryConnection() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            setTimeout(() => {
                console.log(`ðŸ“‹ Retrying Firebase connection (${this.retryCount}/${this.maxRetries})...`);
                this.subscribeToFirebase();
            }, 2000 * this.retryCount);
        }
    }

    // ================================================================
    // CACHE MANAGEMENT
    // ================================================================

    loadFromCache() {
        try {
            const data = localStorage.getItem('prospects_cache');
            if (data) {
                const parsed = JSON.parse(data);
                this.cache = new Map(Object.entries(parsed));
                console.log(`ðŸ“‹ Loaded ${this.cache.size} prospects from cache`);
            }
        } catch (e) {
            console.warn('Failed to load prospects from cache:', e);
        }
    }

    saveToCache() {
        try {
            const obj = Object.fromEntries(this.cache);
            localStorage.setItem('prospects_cache', JSON.stringify(obj));
        } catch (e) {
            console.warn('Failed to save prospects to cache:', e);
        }
    }

    // ================================================================
    // CRUD OPERATIONS
    // ================================================================

    /**
     * Create a new prospect
     */
    async create(data) {
        const validation = this.validate(data);
        if (!validation.isValid) {
            const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
            error.errors = validation.errors;
            error.warnings = validation.warnings;
            throw error;
        }

        const prospect = this.normalize(data);
        prospect.id = prospect.id || this.generateId();
        prospect.createdAt = new Date().toISOString();
        prospect.updatedAt = new Date().toISOString();
        prospect.leadScore = this.calculateLeadScore(prospect);

        // Store in cache
        this.cache.set(prospect.id, prospect);
        this.saveToCache();

        // Sync to Firebase
        await this.syncToFirebase(prospect);

        this.notifyListeners();
        return prospect;
    }

    /**
     * Read a prospect by ID
     */
    get(id) {
        return this.cache.get(id) || null;
    }

    /**
     * Get all prospects with optional filtering
     */
    getAll(filters = {}) {
        let prospects = Array.from(this.cache.values());
        
        if (prospects.length === 0) return prospects;
        
        // Apply filters
        if (filters.status) {
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
            prospects = prospects.filter(p => statuses.includes(p.status));
        }
        if (filters.assigned) {
            prospects = prospects.filter(p => p.assigned === filters.assigned);
        }
        if (filters.source) {
            prospects = prospects.filter(p => p.source === filters.source);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            prospects = prospects.filter(p => {
                const searchable = `${p.business || ''} ${p.name || ''} ${p.phone || ''} ${p.email || ''} ${p.notes || ''}`.toLowerCase();
                return searchable.includes(search);
            });
        }
        if (filters.dateFrom) {
            prospects = prospects.filter(p => p.date >= filters.dateFrom);
        }
        if (filters.dateTo) {
            prospects = prospects.filter(p => p.date <= filters.dateTo);
        }
        if (filters.tags && filters.tags.length > 0) {
            prospects = prospects.filter(p => 
                p.tags && filters.tags.some(tag => p.tags.includes(tag))
            );
        }
        if (filters.limit) {
            prospects = prospects.slice(0, filters.limit);
        }

        // Sort by date (newest first)
        prospects.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        return prospects;
    }

    /**
     * Update a prospect
     */
    async update(id, updates) {
        const existing = this.cache.get(id);
        if (!existing) {
            throw new Error(`Prospect with ID ${id} not found`);
        }

        const merged = { ...existing, ...updates };
        const validation = this.validate(merged);
        if (!validation.isValid) {
            const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
            error.errors = validation.errors;
            error.warnings = validation.warnings;
            throw error;
        }

        const prospect = this.normalize(merged);
        prospect.updatedAt = new Date().toISOString();
        prospect.leadScore = this.calculateLeadScore(prospect);

        this.cache.set(id, prospect);
        this.saveToCache();

        await this.syncToFirebase(prospect, true);

        this.notifyListeners();
        return prospect;
    }

    /**
     * Delete a prospect
     */
    async delete(id) {
        const existing = this.cache.get(id);
        if (!existing) {
            throw new Error(`Prospect with ID ${id} not found`);
        }

        this.cache.delete(id);
        this.saveToCache();

        if (window.AppState && window.AppState.isFirebaseReady && window.AppState.currentUser) {
            try {
                this.syncInProgress = true;
                await firebase.firestore()
                    .collection('users')
                    .doc(window.AppState.currentUser.uid)
                    .collection('prospects')
                    .doc(id)
                    .delete();
                this.syncInProgress = false;
            } catch (error) {
                this.syncInProgress = false;
                console.warn('Failed to sync prospect deletion to Firebase:', error);
                // Restore cache
                this.cache.set(id, existing);
                this.saveToCache();
                throw error;
            }
        }

        this.notifyListeners();
        return true;
    }

    /**
     * Bulk delete prospects
     */
    async deleteBulk(ids) {
        const results = [];
        for (const id of ids) {
            try {
                await this.delete(id);
                results.push({ id, success: true });
            } catch (error) {
                results.push({ id, success: false, error: error.message });
            }
        }
        return results;
    }

    /**
     * Bulk update prospects
     */
    async updateBulk(ids, updates) {
        const results = [];
        for (const id of ids) {
            try {
                const result = await this.update(id, updates);
                results.push({ id, success: true, data: result });
            } catch (error) {
                results.push({ id, success: false, error: error.message });
            }
        }
        return results;
    }

    // ================================================================
    // SYNC TO FIREBASE
    // ================================================================

    async syncToFirebase(prospect, isUpdate = false) {
        if (window.AppState && window.AppState.isFirebaseReady && window.AppState.currentUser) {
            try {
                this.syncInProgress = true;
                const docRef = firebase.firestore()
                    .collection('users')
                    .doc(window.AppState.currentUser.uid)
                    .collection('prospects')
                    .doc(prospect.id);
                
                if (isUpdate) {
                    await docRef.update(prospect);
                } else {
                    await docRef.set(prospect);
                }
                this.syncInProgress = false;
            } catch (error) {
                this.syncInProgress = false;
                console.warn('Failed to sync prospect to Firebase:', error);
                throw error;
            }
        }
    }

    // ================================================================
    // ID GENERATION
    // ================================================================

    generateId() {
        return Date.now().toString() + '_' + Math.random().toString(36).substring(2, 11);
    }

    // ================================================================
    // VALIDATION
    // ================================================================

    validate(data) {
        const errors = [];
        const warnings = [];

        for (const [field, schema] of Object.entries(PROSPECT_SCHEMA)) {
            const value = data[field];
            
            // Required check
            if (schema.required) {
                const isEmpty = value === undefined || 
                               value === null || 
                               value === '' || 
                               (typeof value === 'string' && value.trim() === '') ||
                               (Array.isArray(value) && value.length === 0);
                
                if (isEmpty) {
                    errors.push(`${schema.label} is required`);
                    continue;
                }
            }

            if (value === undefined || value === null || value === '') {
                continue;
            }

            // Type checks
            if (schema.type === 'string') {
                if (typeof value !== 'string') {
                    errors.push(`${schema.label} must be a string`);
                    continue;
                }
                if (schema.minLength && value.length < schema.minLength) {
                    errors.push(`${schema.label} must be at least ${schema.minLength} characters`);
                }
                if (schema.maxLength && value.length > schema.maxLength) {
                    warnings.push(`${schema.label} exceeds ${schema.maxLength} characters (${value.length})`);
                }
                if (schema.pattern && !schema.pattern.test(value)) {
                    warnings.push(`${schema.label} format seems invalid`);
                }
            }

            if (schema.type === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    errors.push(`${schema.label} must be a number`);
                }
                if (schema.min !== undefined && value < schema.min) {
                    warnings.push(`${schema.label} should be at least ${schema.min}`);
                }
                if (schema.max !== undefined && value > schema.max) {
                    warnings.push(`${schema.label} should be at most ${schema.max}`);
                }
            }

            if (schema.type === 'date') {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errors.push(`${schema.label} must be a valid date`);
                }
            }

            if (schema.type === 'array') {
                if (!Array.isArray(value)) {
                    errors.push(`${schema.label} must be an array`);
                }
            }

            if (schema.type === 'text') {
                if (typeof value !== 'string') {
                    errors.push(`${schema.label} must be text`);
                }
                if (schema.maxLength && value.length > schema.maxLength) {
                    warnings.push(`${schema.label} exceeds ${schema.maxLength} characters`);
                }
            }

            // Options check
            if (schema.options && Array.isArray(schema.options) && value) {
                if (!schema.options.includes(value)) {
                    warnings.push(`"${value}" is not in the recommended options for ${schema.label}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // ================================================================
    // DATA NORMALIZATION
    // ================================================================

    normalize(data) {
        const normalized = { ...data };
        
        // Normalize business name
        if (normalized.business) {
            normalized.business = normalized.business.trim();
        }
        
        // Normalize name
        if (normalized.name) {
            normalized.name = normalized.name.trim();
        }
        
        // Normalize phone
        if (normalized.phone) {
            normalized.phone = normalized.phone.replace(/[^\d+]/g, '');
            if (normalized.phone.length === 10 && /^\d{10}$/.test(normalized.phone)) {
                normalized.phone = `(${normalized.phone.substring(0, 3)}) ${normalized.phone.substring(3, 6)}-${normalized.phone.substring(6)}`;
            }
        }
        
        // Normalize email
        if (normalized.email) {
            normalized.email = normalized.email.toLowerCase().trim();
        }
        
        // Normalize tags
        if (normalized.tags) {
            if (typeof normalized.tags === 'string') {
                normalized.tags = normalized.tags.split(',').map(t => t.trim()).filter(t => t);
            } else if (!Array.isArray(normalized.tags)) {
                normalized.tags = [];
            }
        } else {
            normalized.tags = [];
        }
        
        // Normalize status
        if (normalized.status && typeof normalized.status === 'string') {
            const validStatuses = (window.CONFIG && window.CONFIG.STATUS_OPTIONS) ? 
                window.CONFIG.STATUS_OPTIONS : 
                ['Hot Transfer', 'Warm Callback', 'Completed', 'Pending', 'Canceled', 'Meeting Booked', 'Rescheduled', 'Overdue', 'Held'];
            
            const matched = validStatuses.find(s => 
                s.toLowerCase() === normalized.status.toLowerCase() ||
                s.toLowerCase().includes(normalized.status.toLowerCase()) ||
                normalized.status.toLowerCase().includes(s.toLowerCase())
            );
            if (matched) {
                normalized.status = matched;
            }
        }
        
        return normalized;
    }

    // ================================================================
    // LEAD SCORE CALCULATION
    // ================================================================

    calculateLeadScore(prospect) {
        let score = 0;
        
        // Status-based scoring
        const statusScores = {
            'Hot Transfer': 50,
            'Completed': 40,
            'Warm Callback': 30,
            'Meeting Booked': 25,
            'Held': 20,
            'Rescheduled': 15,
            'Pending': 10,
            'Canceled': -20
        };
        score += statusScores[prospect.status] || 0;

        // Contact info scoring
        if (prospect.phone) score += 10;
        if (prospect.email) score += 10;
        if (prospect.website) score += 5;
        if (prospect.address) score += 5;

        // Notes scoring
        if (prospect.notes) {
            if (prospect.notes.length > 10) score += 5;
            if (prospect.notes.length > 50) score += 5;
            if (prospect.notes.length > 200) score += 5;
        }

        // Tags scoring
        if (prospect.tags && prospect.tags.length > 0) {
            const tagScores = {
                'vip': 20,
                'qualified_warm_call': 15,
                'high_interest': 15,
                'decision_maker': 10,
                'callback_requested': 10,
                'referred': 10,
                'negligent_warm_callback': -10
            };
            
            prospect.tags.forEach(tag => {
                score += tagScores[tag] || 0;
            });
        }

        // Sentiment scoring
        if (prospect.sentiment) {
            const sentimentScores = {
                'Very Positive': 20,
                'Positive': 15,
                'Neutral': 5,
                'Negative': -10,
                'Very Negative': -20
            };
            score += sentimentScores[prospect.sentiment] || 0;
        }

        // Role scoring
        if (prospect.role) {
            const roleScores = {
                'Owner': 15,
                'CEO': 15,
                'Director': 12,
                'Manager': 10,
                'Supervisor': 8,
                'Team Lead': 6
            };
            score += roleScores[prospect.role] || 0;
        }

        return Math.max(0, Math.min(100, score));
    }

    // ================================================================
    // SMART IMPORT - Parse text into prospect data
    // ================================================================

    parseFromText(text, defaultDate = null) {
        const result = {};
        const confidence = {};
        const context = {
            hasKeyValue: false,
            hasBulletPoints: false,
            hasNaturalLanguage: false,
            detectedFormat: 'unknown'
        };
        
        const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = cleanText.split('\n').filter(line => line.trim());
        const fullText = lines.join(' ');
        
        // Detect format
        context.hasKeyValue = lines.some(line => line.includes(':') || line.includes('=') || line.includes('->'));
        context.hasBulletPoints = lines.some(line => /^[\s]*[â€¢\-*]\s/.test(line));
        context.hasNaturalLanguage = !context.hasKeyValue && !context.hasBulletPoints;
        
        if (context.hasKeyValue) context.detectedFormat = 'key_value';
        else if (context.hasBulletPoints) context.detectedFormat = 'bullet_points';
        else if (context.hasNaturalLanguage) context.detectedFormat = 'natural_language';
        
        // Parse based on format
        if (context.detectedFormat === 'key_value') {
            this.parseKeyValueFormat(lines, result, confidence);
        } else if (context.detectedFormat === 'bullet_points') {
            this.parseBulletFormat(lines, result, confidence);
        } else {
            this.parseNaturalLanguage(fullText, lines, result, confidence);
        }
        
        // Apply default date if not found
        if (!result.date && defaultDate) {
            result.date = defaultDate;
            confidence.date = 1.0;
        }
        
        // Enhance parsed data
        this.enhanceParsedData(result, confidence, fullText);
        
        return { result, confidence, context };
    }

    parseKeyValueFormat(lines, result, confidence) {
        const separators = [':', '=', '->', '=>'];
        
        lines.forEach(line => {
            let separatorIndex = -1;
            let separatorUsed = '';
            
            for (const sep of separators) {
                const idx = line.indexOf(sep);
                if (idx !== -1 && (separatorIndex === -1 || idx < separatorIndex)) {
                    separatorIndex = idx;
                    separatorUsed = sep;
                }
            }
            
            if (separatorIndex !== -1) {
                let key = line.substring(0, separatorIndex).trim().toLowerCase();
                const value = line.substring(separatorIndex + separatorUsed.length).trim();
                
                if (value) {
                    const matchedField = this.matchFieldName(key);
                    if (matchedField) {
                        result[matchedField] = value;
                        confidence[matchedField] = 0.9;
                        
                        if (matchedField === 'date') {
                            const parsedDate = this.parseDateString(value);
                            if (parsedDate) {
                                result.date = parsedDate;
                                confidence.date = 0.95;
                            }
                        }
                    } else {
                        if (!result.notes) result.notes = '';
                        result.notes += (result.notes ? '\n' : '') + `${key}: ${value}`;
                        confidence.notes = 0.4;
                    }
                }
            }
        });
    }

    parseBulletFormat(lines, result, confidence) {
        const bulletPattern = /^[\s]*[â€¢\-*]\s*(.*)$/;
        
        lines.forEach(line => {
            const match = line.match(bulletPattern);
            if (match) {
                const content = match[1].trim();
                const fieldMatch = content.match(/^([^:]+):\s*(.*)$/);
                if (fieldMatch) {
                    const key = fieldMatch[1].trim().toLowerCase();
                    const value = fieldMatch[2].trim();
                    const matchedField = this.matchFieldName(key);
                    if (matchedField) {
                        result[matchedField] = value;
                        confidence[matchedField] = 0.85;
                    } else {
                        if (!result.notes) result.notes = '';
                        result.notes += (result.notes ? '\n' : '') + content;
                        confidence.notes = 0.4;
                    }
                } else {
                    if (!result.notes) result.notes = '';
                    result.notes += (result.notes ? '\n' : '') + content;
                    confidence.notes = 0.4;
                }
            }
        });
    }

    parseNaturalLanguage(fullText, lines, result, confidence) {
        // Extract name
        const namePatterns = [
            /(?:name|contact|client|customer|person|full name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            /(?:from|with|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
            /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:from|at|with|said|wants|would like)/i
        ];
        for (const pattern of namePatterns) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                result.name = match[1].trim();
                confidence.name = 0.7;
                break;
            }
        }
        
        // Extract business
        const businessPatterns = [
            /(?:business|company|organization|org|firm|brand|store)[:\s]+([A-Z][a-zA-Z0-9\s&]+?)(?:[,.\n]|$)/i,
            /(?:from|at|with)\s+([A-Z][a-zA-Z0-9\s&]+?)(?:[,.\n]|$)/i
        ];
        for (const pattern of businessPatterns) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                result.business = match[1].trim();
                confidence.business = 0.7;
                break;
            }
        }
        
        // Extract phone
        const phonePatterns = [
            /(?:phone|mobile|cell|telephone|number|call)[:\s]+([+\d\s\-\(\)]{7,20})/i,
            /([+\d\s\-\(\)]{10,20})(?:\s*(?:is|was|will be|the|their|his|her))/i,
            /(\d{3}[-.]?\d{3}[-.]?\d{4})/,
            /\(\d{3}\)\s*\d{3}[-.]?\d{4}/
        ];
        for (const pattern of phonePatterns) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                result.phone = match[1].trim();
                confidence.phone = 0.85;
                break;
            }
        }
        
        // Extract email
        const emailMatch = fullText.match(/([^\s@]+@[^\s@]+\.[^\s@]+)/);
        if (emailMatch) {
            result.email = emailMatch[1].trim().toLowerCase();
            confidence.email = 0.9;
        }
        
        // Extract date
        const datePatterns = [
            /(?:date|appointment|scheduled|meeting|call|day)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
            /(\d{1,2}\/\d{1,2}\/\d{4})/,
            /(\d{4}-\d{2}-\d{2})/,
            /([A-Za-z]+\s+\d{1,2},?\s+\d{4})/
        ];
        for (const pattern of datePatterns) {
            const match = fullText.match(pattern);
            if (match && match[1]) {
                result.date = match[1].trim();
                confidence.date = 0.8;
                break;
            }
        }
        
        // Extract time
        const timeMatch = fullText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
        if (timeMatch) {
            result.time = timeMatch[1].trim();
            confidence.time = 0.85;
        }
        
        // Extract status
        const statusValues = (window.CONFIG && window.CONFIG.STATUS_OPTIONS) ? 
            window.CONFIG.STATUS_OPTIONS : 
            ['Hot Transfer', 'Warm Callback', 'Completed', 'Pending', 'Canceled', 'Meeting Booked', 'Rescheduled', 'Overdue', 'Held'];
        
        for (const status of statusValues) {
            if (fullText.toLowerCase().includes(status.toLowerCase())) {
                result.status = status;
                confidence.status = 0.7;
                break;
            }
        }
        
        // Extract role
        const roleMatch = fullText.match(/(?:role|title|position|job title)[:\s]+([A-Za-z\s]+?)(?:[,.\n]|$)/i);
        if (roleMatch && roleMatch[1]) {
            result.role = roleMatch[1].trim();
            confidence.role = 0.6;
        }
        
        // Extract assigned
        const assignedMatch = fullText.match(/(?:assigned|assigned to|owner|agent|representative)[:\s]+([A-Z][a-z]+)/i);
        if (assignedMatch && assignedMatch[1]) {
            result.assigned = assignedMatch[1].trim();
            confidence.assigned = 0.5;
        }
        
        // If nothing was parsed, store everything as notes
        if (Object.keys(result).length === 0) {
            result.notes = fullText;
            confidence.notes = 0.3;
        }
    }

    matchFieldName(key) {
        const normalizedKey = key.toLowerCase().trim();
        const fieldMap = {
            'business': ['business', 'company', 'organization', 'org', 'firm', 'brand', 'store', 'business name', 'company name'],
            'name': ['name', 'contact', 'client', 'customer', 'person', 'full name', 'contact name'],
            'role': ['role', 'title', 'position', 'job title', 'designation'],
            'phone': ['phone', 'mobile', 'cell', 'telephone', 'number', 'contact number', 'phone number'],
            'email': ['email', 'e-mail', 'mail', 'email address'],
            'date': ['date', 'appointment date', 'schedule date', 'meeting date', 'call date', 'day'],
            'time': ['time', 'appointment time', 'schedule time', 'meeting time', 'call time', 'hour'],
            'status': ['status', 'state', 'stage', 'lead status', 'appointment status', 'call status'],
            'notes': ['notes', 'note', 'comment', 'remarks', 'additional notes', 'info', 'details', 'description'],
            'assigned': ['assigned', 'assigned to', 'owner', 'agent', 'representative', 'rep'],
            'source': ['source', 'origin', 'from', 'imported from'],
            'industry': ['industry', 'sector', 'field', 'type'],
            'website': ['website', 'url', 'web', 'site'],
            'address': ['address', 'location', 'street', 'city', 'state', 'zip'],
            'sentiment': ['sentiment', 'feeling', 'tone', 'mood'],
            'tags': ['tags', 'tag', 'label', 'labels']
        };
        
        for (const [field, aliases] of Object.entries(fieldMap)) {
            if (aliases.some(alias => 
                normalizedKey === alias || 
                normalizedKey.includes(alias) || 
                alias.includes(normalizedKey) ||
                normalizedKey.split(' ').some(word => word === alias.split(' ')[0])
            )) {
                return field;
            }
        }
        return null;
    }

    parseDateString(dateStr) {
        if (!dateStr) return null;
        const trimmed = dateStr.trim();
        
        // ISO format: YYYY-MM-DD
        const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            const year = parseInt(isoMatch[1]);
            const month = parseInt(isoMatch[2]) - 1;
            const day = parseInt(isoMatch[3]);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        
        // US format: MM/DD/YYYY
        const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (usMatch) {
            const month = parseInt(usMatch[1]) - 1;
            const day = parseInt(usMatch[2]);
            const year = parseInt(usMatch[3]);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        
        // Natural format: Month Day, Year
        const naturalMatch = trimmed.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
        if (naturalMatch) {
            const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
            const monthName = naturalMatch[1].toLowerCase();
            const monthIndex = months.indexOf(monthName);
            if (monthIndex !== -1) {
                const day = parseInt(naturalMatch[2]);
                const year = parseInt(naturalMatch[3]);
                const date = new Date(year, monthIndex, day);
                if (!isNaN(date.getTime())) {
                    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                }
            }
        }
        
        // Today/Tomorrow/Yesterday
        if (/today/i.test(trimmed)) {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (/tomorrow/i.test(trimmed)) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        }
        if (/yesterday/i.test(trimmed)) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        }
        
        return null;
    }

    enhanceParsedData(result, confidence, fullText) {
        // Auto-detect sentiment from notes
        if (result.notes) {
            const sentimentPatterns = {
                'Very Positive': /(?:amazing|excellent|outstanding|fantastic|perfect|brilliant|incredible|wonderful|extraordinary)/i,
                'Positive': /(?:great|good|nice|positive|happy|pleased|satisfied|impressed|interested|excited|enthusiastic)/i,
                'Neutral': /(?:okay|fine|alright|neutral|average|decent|moderate|standard|normal)/i,
                'Negative': /(?:bad|poor|terrible|awful|horrible|disappointed|unhappy|frustrated|annoyed|irritated)/i,
                'Very Negative': /(?:worst|horrible|disgusting|atrocious|abysmal|appalling|dreadful|unacceptable)/i
            };
            
            for (const [sentiment, pattern] of Object.entries(sentimentPatterns)) {
                if (pattern.test(result.notes)) {
                    result.sentiment = sentiment;
                    confidence.sentiment = 0.6;
                    break;
                }
            }
            
            // Auto-detect source
            if (fullText.toLowerCase().includes('import')) {
                result.source = 'Smart Import';
                confidence.source = 0.8;
            } else if (fullText.toLowerCase().includes('csv')) {
                result.source = 'CSV Import';
                confidence.source = 0.8;
            } else if (result.notes && result.notes.length > 0) {
                result.source = 'Manual Entry';
                confidence.source = 0.6;
            }
            
            // Auto-detect tags from notes
            const tagPatterns = {
                'vip': /(?:vip|priority|important|key|major|top)/i,
                'high_interest': /(?:high interest|very interested|excited|enthusiastic|positive)/i,
                'decision_maker': /(?:owner|ceo|president|founder|director|decision maker)/i,
                'callback_requested': /(?:callback|call back|return call|follow up|follow-up|next steps|schedule call)/i,
                'referred': /(?:referred|reference|referral|recommended|suggested|from)/i,
                'no_website': /(?:no website|doesn't have a website|needs website|wants website|website redesign)/i,
                'qualified_warm_call': /(?:qualified|warm call|good fit|ideal|perfect fit|qualified lead)/i,
                'negligent_warm_callback': /(?:negligent|unqualified|not interested|no interest|poor fit)/i
            };
            
            const tags = result.tags || [];
            for (const [tag, pattern] of Object.entries(tagPatterns)) {
                if (pattern.test(result.notes) && !tags.includes(tag)) {
                    tags.push(tag);
                    confidence.tags = 0.5;
                }
            }
            if (tags.length > 0) {
                result.tags = tags;
            }
        }
    }

    // ================================================================
    // EVENT SYSTEM
    // ================================================================

    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getAll());
            } catch (error) {
                console.warn('Error in prospect listener:', error);
            }
        });
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    getStats() {
        const prospects = this.getAll();
        const stats = {
            total: prospects.length,
            byStatus: {},
            bySource: {},
            byAssigned: {},
            bySentiment: {},
            avgScore: 0,
            hotTransferCount: 0,
            warmCallbackCount: 0,
            completedCount: 0,
            pendingCount: 0,
            canceledCount: 0
        };

        let totalScore = 0;

        prospects.forEach(p => {
            // Status counts
            const status = p.status || 'Unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
            
            if (status === 'Hot Transfer') stats.hotTransferCount++;
            if (status === 'Warm Callback') stats.warmCallbackCount++;
            if (status === 'Completed') stats.completedCount++;
            if (status === 'Pending') stats.pendingCount++;
            if (status === 'Canceled') stats.canceledCount++;

            // Source counts
            const source = p.source || 'Unknown';
            stats.bySource[source] = (stats.bySource[source] || 0) + 1;

            // Assigned counts
            const assigned = p.assigned || 'Unassigned';
            stats.byAssigned[assigned] = (stats.byAssigned[assigned] || 0) + 1;

            // Sentiment counts
            const sentiment = p.sentiment || 'Unknown';
            stats.bySentiment[sentiment] = (stats.bySentiment[sentiment] || 0) + 1;

            // Score
            totalScore += p.leadScore || 0;
        });

        stats.avgScore = prospects.length > 0 ? Math.round(totalScore / prospects.length) : 0;

        return stats;
    }

    search(query) {
        return this.getAll({ search: query });
    }

    getByStatus(status) {
        return this.getAll({ status });
    }

    getByAssigned(assigned) {
        return this.getAll({ assigned });
    }

    getByDateRange(from, to) {
        return this.getAll({ dateFrom: from, dateTo: to });
    }

    getByTags(tags) {
        return this.getAll({ tags });
    }

    getRecent(limit = 10) {
        return this.getAll({ limit });
    }

    getTotals() {
        const prospects = this.getAll();
        return {
            total: prospects.length,
            hotTransfer: prospects.filter(p => p.status === 'Hot Transfer').length,
            warmCallback: prospects.filter(p => p.status === 'Warm Callback').length,
            completed: prospects.filter(p => p.status === 'Completed').length,
            pending: prospects.filter(p => p.status === 'Pending').length,
            canceled: prospects.filter(p => p.status === 'Canceled').length
        };
    }
}

// ================================================================
// PROSPECT UI COMPONENTS
// ================================================================

const ProspectUI = {
    // ================================================================
    // RENDER PROSPECT LIST
    // ================================================================

    renderList(container, prospects, options = {}) {
        if (!container) return;

        const {
            onSelect = null,
            onDelete = null,
            onEdit = null,
            showActions = true,
            compact = false,
            emptyMessage = 'No prospects found'
        } = options;

        if (!prospects || prospects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>${emptyMessage}</p>
                    <span style="font-size:0.8rem; color:var(--text-muted);">Add your first prospect using Smart Import or manual entry</span>
                </div>
            `;
            return;
        }

        let html = `<div class="prospect-grid ${compact ? 'compact' : ''}">`;
        
        prospects.forEach(prospect => {
            const score = prospect.leadScore || 0;
            const scoreClass = score >= 70 ? 'score-hot' : score >= 40 ? 'score-warm' : 'score-cold';
            const statusClass = (window.Utils && window.Utils.getStatusClass) ? window.Utils.getStatusClass(prospect.status) : '';
            
            html += `
                <div class="prospect-card" data-id="${prospect.id}">
                    <div class="prospect-card-header">
                        <div class="prospect-card-title">
                            <span class="prospect-business">${this._escapeHtml(prospect.business)}</span>
                            <span class="prospect-name">${this._escapeHtml(prospect.name)}</span>
                        </div>
                        <div class="prospect-card-badges">
                            ${prospect.status ? `<span class="status-tag ${statusClass}">${this._escapeHtml(prospect.status)}</span>` : ''}
                            <span class="score-badge ${scoreClass}">${score} Pts</span>
                        </div>
                    </div>
                    
                    <div class="prospect-card-body">
                        <div class="prospect-details">
                            ${prospect.role ? `<span class="prospect-detail"><i class="fas fa-briefcase"></i> ${this._escapeHtml(prospect.role)}</span>` : ''}
                            ${prospect.phone ? `<span class="prospect-detail"><i class="fas fa-phone"></i> ${this._escapeHtml(prospect.phone)}</span>` : ''}
                            ${prospect.email ? `<span class="prospect-detail"><i class="fas fa-envelope"></i> ${this._escapeHtml(prospect.email)}</span>` : ''}
                            ${prospect.date ? `<span class="prospect-detail"><i class="fas fa-calendar"></i> ${this._formatDate(prospect.date)}</span>` : ''}
                            ${prospect.time ? `<span class="prospect-detail"><i class="fas fa-clock"></i> ${this._escapeHtml(prospect.time)}</span>` : ''}
                        </div>
                        ${prospect.notes ? `<div class="prospect-notes">${this._escapeHtml(prospect.notes.substring(0, 100))}${prospect.notes.length > 100 ? '...' : ''}</div>` : ''}
                        ${prospect.tags && prospect.tags.length > 0 ? `
                            <div class="prospect-tags">
                                ${prospect.tags.map(tag => `<span class="prospect-tag">#${this._escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                        <div class="prospect-meta">
                            <span class="prospect-source">${prospect.source || 'Manual'}</span>
                            <span class="prospect-date">${prospect.createdAt ? this._formatDate(prospect.createdAt) : ''}</span>
                        </div>
                    </div>
                    
                    ${showActions ? `
                        <div class="prospect-card-actions">
                            <button class="btn-icon prospect-view-btn" data-id="${prospect.id}" title="View Details"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon prospect-edit-btn" data-id="${prospect.id}" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon prospect-delete-btn" data-id="${prospect.id}" title="Delete" style="color:var(--danger);"><i class="fas fa-trash"></i></button>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Attach event listeners
        if (showActions) {
            container.querySelectorAll('.prospect-view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    if (onSelect) onSelect(id);
                });
            });

            container.querySelectorAll('.prospect-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    if (onEdit) onEdit(id);
                });
            });

            container.querySelectorAll('.prospect-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    if (onDelete && confirm('Delete this prospect permanently?')) {
                        onDelete(id);
                    }
                });
            });
        }

        // Click on card to view
        container.querySelectorAll('.prospect-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.prospect-card-actions')) return;
                const id = card.dataset.id;
                if (onSelect) onSelect(id);
            });
        });
    },

    // ================================================================
    // RENDER PROSPECT FORM
    // ================================================================

    renderForm(container, prospect = null, options = {}) {
        if (!container) return;

        const {
            onSave = null,
            onCancel = null,
            onDelete = null,
            title = prospect ? 'Edit Prospect' : 'New Prospect',
            submitLabel = prospect ? 'Update Prospect' : 'Create Prospect',
            disabledFields = []
        } = options;

        const isEdit = !!prospect;

        // Build form fields from schema
        let fieldsHtml = '';
        const sections = {
            core: 'Core Information',
            contact: 'Contact Details',
            appointment: 'Appointment Information',
            notes: 'Notes',
            meta: 'Additional Information'
        };

        for (const [sectionId, sectionLabel] of Object.entries(sections)) {
            const sectionFields = Object.entries(PROSPECT_SCHEMA)
                .filter(([key, schema]) => schema.section === sectionId);
            
            if (sectionFields.length === 0) continue;

            fieldsHtml += `
                <div class="form-section">
                    <h4>${sectionLabel}</h4>
                    <div class="form-section-fields">
            `;

            for (const [key, schema] of sectionFields) {
                const value = prospect ? prospect[key] : '';
                const isRequired = schema.required ? 'required' : '';
                const isDisabled = disabledFields.includes(key) ? 'disabled' : '';
                
                let inputHtml = '';
                if (schema.type === 'select' || (schema.options && Array.isArray(schema.options))) {
                    const optionsHtml = schema.options.map(opt => 
                        `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('');
                    inputHtml = `
                        <select id="prospect_${key}" class="form-input" ${isRequired} ${isDisabled}>
                            <option value="">Select ${schema.label}</option>
                            ${optionsHtml}
                        </select>
                    `;
                } else if (schema.type === 'textarea' || schema.type === 'text') {
                    inputHtml = `
                        <textarea id="prospect_${key}" class="form-input" rows="${key === 'notes' ? 4 : 2}" placeholder="${schema.placeholder || ''}" ${isRequired} ${isDisabled}>${this._escapeHtml(value)}</textarea>
                    `;
                } else if (schema.type === 'date') {
                    inputHtml = `
                        <input type="date" id="prospect_${key}" class="form-input" value="${value}" ${isRequired} ${isDisabled} />
                    `;
                } else if (schema.type === 'number') {
                    inputHtml = `
                        <input type="number" id="prospect_${key}" class="form-input" value="${value}" placeholder="${schema.placeholder || ''}" ${isRequired} ${isDisabled} />
                    `;
                } else if (schema.type === 'array') {
                    const tagsValue = Array.isArray(value) ? value.join(', ') : value;
                    inputHtml = `
                        <input type="text" id="prospect_${key}" class="form-input" value="${this._escapeHtml(tagsValue)}" placeholder="${schema.placeholder || 'Separate with commas'}" ${isRequired} ${isDisabled} />
                    `;
                } else {
                    inputHtml = `
                        <input type="${schema.type === 'email' ? 'email' : 'text'}" id="prospect_${key}" class="form-input" value="${this._escapeHtml(value)}" placeholder="${schema.placeholder || ''}" ${isRequired} ${isDisabled} />
                    `;
                }

                fieldsHtml += `
                    <div class="form-group ${schema.type === 'text' || key === 'notes' ? 'full-width' : ''}">
                        <label for="prospect_${key}">
                            ${schema.icon || ''} ${schema.label}
                            ${isRequired ? '<span class="required-star">*</span>' : ''}
                        </label>
                        ${inputHtml}
                        <div class="field-hint">${schema.type === 'string' && schema.maxLength ? `Max ${schema.maxLength} characters` : ''}</div>
                    </div>
                `;
            }

            fieldsHtml += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="prospect-form-modal">
                <div class="modal-card prospect-form-card">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> ${title}</h3>
                        <button class="modal-close-btn" id="prospectFormCloseBtn"><i class="fas fa-times"></i></button>
                    </div>
                    <form id="prospectForm" class="prospect-form">
                        ${fieldsHtml}
                        <div class="form-actions">
                            ${isEdit && onDelete ? `
                                <button type="button" class="btn-icon delete-btn" id="prospectFormDeleteBtn" style="background:var(--danger); color:white;">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                            <div class="form-actions-right">
                                <button type="button" class="btn-icon cancel-btn" id="prospectFormCancelBtn">Cancel</button>
                                <button type="submit" class="btn-icon submit-btn" style="background:var(--primary); color:white;">
                                    <i class="fas fa-save"></i> ${submitLabel}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Handle array fields (tags)
        const tagsInput = container.querySelector('#prospect_tags');
        if (tagsInput) {
            const form = container.querySelector('#prospectForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    if (tagsInput.value) {
                        // Will be handled in the save handler
                    }
                });
            }
        }

        // Form submission
        const form = container.querySelector('#prospectForm');
        if (form && onSave) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = {};
                for (const [key] of Object.entries(PROSPECT_SCHEMA)) {
                    const input = form.querySelector(`#prospect_${key}`);
                    if (input) {
                        if (input.type === 'select-multiple') {
                            data[key] = Array.from(input.selectedOptions).map(opt => opt.value);
                        } else if (input.type === 'checkbox') {
                            data[key] = input.checked;
                        } else if (key === 'tags' && input.value) {
                            data[key] = input.value.split(',').map(t => t.trim()).filter(t => t);
                        } else {
                            data[key] = input.value;
                        }
                    }
                }
                onSave(data);
            });
        }

        // Close button
        const closeBtn = container.querySelector('#prospectFormCloseBtn');
        if (closeBtn && onCancel) {
            closeBtn.addEventListener('click', onCancel);
        }

        // Cancel button
        const cancelBtn = container.querySelector('#prospectFormCancelBtn');
        if (cancelBtn && onCancel) {
            cancelBtn.addEventListener('click', onCancel);
        }

        // Delete button
        const deleteBtn = container.querySelector('#prospectFormDeleteBtn');
        if (deleteBtn && onDelete) {
            deleteBtn.addEventListener('click', onDelete);
        }

        // Click outside to close
        container.addEventListener('click', (e) => {
            if (e.target === container && onCancel) {
                onCancel();
            }
        });
    },

    // ================================================================
    // RENDER PROSPECT DETAIL VIEW
    // ================================================================

    renderDetail(container, prospect) {
        if (!container || !prospect) return;

        const score = prospect.leadScore || 0;
        const scoreClass = score >= 70 ? 'score-hot' : score >= 40 ? 'score-warm' : 'score-cold';
        const statusClass = (window.Utils && window.Utils.getStatusClass) ? window.Utils.getStatusClass(prospect.status) : '';

        container.innerHTML = `
            <div class="prospect-detail-modal">
                <div class="modal-card prospect-detail-card">
                    <div class="modal-header">
                        <h3><i class="fas fa-user"></i> Prospect Details</h3>
                        <button class="modal-close-btn" id="prospectDetailCloseBtn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="prospect-detail-content">
                        <div class="prospect-detail-header">
                            <div class="prospect-detail-title">
                                <h2>${this._escapeHtml(prospect.business)}</h2>
                                <p>${this._escapeHtml(prospect.name)}</p>
                            </div>
                            <div class="prospect-detail-badges">
                                ${prospect.status ? `<span class="status-tag ${statusClass}">${this._escapeHtml(prospect.status)}</span>` : ''}
                                <span class="score-badge ${scoreClass}">${score} Pts</span>
                            </div>
                        </div>
                        
                        <div class="prospect-detail-grid">
                            ${prospect.role ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-briefcase"></i> Role</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.role)}</span>
                                </div>
                            ` : ''}
                            ${prospect.phone ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-phone"></i> Phone</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.phone)}</span>
                                </div>
                            ` : ''}
                            ${prospect.email ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-envelope"></i> Email</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.email)}</span>
                                </div>
                            ` : ''}
                            ${prospect.date ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-calendar"></i> Date</span>
                                    <span class="detail-value">${this._formatDate(prospect.date)}</span>
                                </div>
                            ` : ''}
                            ${prospect.time ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-clock"></i> Time</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.time)}</span>
                                </div>
                            ` : ''}
                            ${prospect.assigned ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-user"></i> Assigned To</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.assigned)}</span>
                                </div>
                            ` : ''}
                            ${prospect.source ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-source"></i> Source</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.source)}</span>
                                </div>
                            ` : ''}
                            ${prospect.sentiment ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-smile"></i> Sentiment</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.sentiment)}</span>
                                </div>
                            ` : ''}
                            ${prospect.industry ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-industry"></i> Industry</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.industry)}</span>
                                </div>
                            ` : ''}
                            ${prospect.website ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-globe"></i> Website</span>
                                    <span class="detail-value"><a href="${this._escapeHtml(prospect.website)}" target="_blank">${this._escapeHtml(prospect.website)}</a></span>
                                </div>
                            ` : ''}
                            ${prospect.address ? `
                                <div class="detail-item">
                                    <span class="detail-label"><i class="fas fa-location-dot"></i> Address</span>
                                    <span class="detail-value">${this._escapeHtml(prospect.address)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${prospect.notes ? `
                            <div class="prospect-detail-notes">
                                <h4><i class="fas fa-notes"></i> Notes</h4>
                                <p>${this._escapeHtml(prospect.notes)}</p>
                            </div>
                        ` : ''}
                        
                        ${prospect.tags && prospect.tags.length > 0 ? `
                            <div class="prospect-detail-tags">
                                <h4><i class="fas fa-tags"></i> Tags</h4>
                                <div class="prospect-tags">
                                    ${prospect.tags.map(tag => `<span class="prospect-tag">#${this._escapeHtml(tag)}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="prospect-detail-meta">
                            ${prospect.createdAt ? `<span>Created: ${this._formatDate(prospect.createdAt)}</span>` : ''}
                            ${prospect.updatedAt && prospect.updatedAt !== prospect.createdAt ? `<span>Updated: ${this._formatDate(prospect.updatedAt)}</span>` : ''}
                            ${prospect.id ? `<span>ID: ${prospect.id.substring(0, 8)}...</span>` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-icon" id="prospectDetailCloseBtn2" style="background:var(--primary); color:white;">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Close buttons
        const closeBtn1 = container.querySelector('#prospectDetailCloseBtn');
        const closeBtn2 = container.querySelector('#prospectDetailCloseBtn2');
        const closeFn = () => {
            container.innerHTML = '';
            container.style.display = 'none';
        };
        
        if (closeBtn1) closeBtn1.addEventListener('click', closeFn);
        if (closeBtn2) closeBtn2.addEventListener('click', closeFn);
        
        container.addEventListener('click', (e) => {
            if (e.target === container) closeFn();
        });
    },

    // ================================================================
    // RENDER PROSPECT STATS
    // ================================================================

    renderStats(container, stats) {
        if (!container || !stats) return;

        container.innerHTML = `
            <div class="prospect-stats-grid">
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value">${stats.total}</div>
                    <div class="prospect-stat-label">Total Prospects</div>
                </div>
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value" style="color:#dc2626;">${stats.hotTransferCount}</div>
                    <div class="prospect-stat-label">ðŸ”¥ Hot Transfers</div>
                </div>
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value" style="color:var(--warning);">${stats.warmCallbackCount}</div>
                    <div class="prospect-stat-label">ðŸ“ž Warm Callbacks</div>
                </div>
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value" style="color:var(--success);">${stats.completedCount}</div>
                    <div class="prospect-stat-label">âœ… Completed</div>
                </div>
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value" style="color:var(--text-muted);">${stats.pendingCount}</div>
                    <div class="prospect-stat-label">â³ Pending</div>
                </div>
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value" style="color:var(--danger);">${stats.canceledCount}</div>
                    <div class="prospect-stat-label">âŒ Canceled</div>
                </div>
                <div class="prospect-stat-card">
                    <div class="prospect-stat-value" style="color:var(--primary);">${stats.avgScore}</div>
                    <div class="prospect-stat-label">â­ Avg Score</div>
                </div>
            </div>
        `;
    },

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================

    _escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    },

    _formatDate(dateStr) {
        if (!dateStr) return 'No date';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return 'No date';
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
            return 'No date';
        }
    }
};

// ================================================================
// STYLES (injected)
// ================================================================

const PROSPECT_STYLES = `
/* Prospect Grid */
.prospect-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    padding: 4px;
}

.prospect-grid.compact {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
}

/* Prospect Card */
.prospect-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 16px;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
}

.prospect-card:hover {
    border-color: var(--primary);
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
}

.prospect-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 12px;
}

.prospect-card-title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
}

.prospect-business {
    font-weight: 700;
    font-size: 1rem;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.prospect-name {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.prospect-card-badges {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    flex-wrap: wrap;
}

.prospect-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.prospect-details {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.prospect-detail {
    font-size: 0.75rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 4px;
    background: var(--bg-primary);
    padding: 2px 8px;
    border-radius: 12px;
}

.prospect-detail i {
    font-size: 0.7rem;
    color: var(--text-muted);
}

.prospect-notes {
    font-size: 0.8rem;
    color: var(--text-muted);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.prospect-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.prospect-tag {
    font-size: 0.65rem;
    color: var(--primary);
    background: rgba(59, 130, 246, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
}

.prospect-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
}

.prospect-card-actions {
    display: flex;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
    justify-content: flex-end;
}

.prospect-card-actions .btn-icon {
    padding: 4px 10px;
    font-size: 0.75rem;
}

/* Prospect Form */
.prospect-form-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
}

.prospect-form-card {
    width: 100%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
}

.prospect-form-card::-webkit-scrollbar {
    width: 4px;
}
.prospect-form-card::-webkit-scrollbar-track {
    background: transparent;
}
.prospect-form-card::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 4px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
}

.modal-close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: var(--transition);
}

.modal-close-btn:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
}

.form-section {
    margin-bottom: 20px;
}

.form-section h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-color);
}

.form-section-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.form-section-fields .form-group:has(textarea),
.form-section-fields .form-group.full-width {
    grid-column: 1 / -1;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-group label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.form-group .required-star {
    color: var(--danger);
}

.form-input {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.85rem;
    transition: var(--transition);
    width: 100%;
}

.form-input:focus {
    outline: 2px solid var(--primary);
    border-color: var(--primary);
}

.form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.form-input::placeholder {
    color: var(--text-muted);
}

.field-hint {
    font-size: 0.65rem;
    color: var(--text-muted);
}

.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.form-actions-right {
    display: flex;
    gap: 8px;
}

.cancel-btn {
    background: var(--bg-primary);
}

.cancel-btn:hover {
    background: var(--border-color);
}

.delete-btn:hover {
    opacity: 0.85;
}

.submit-btn:hover {
    opacity: 0.9;
    transform: translateY(-2px);
}

/* Prospect Detail Modal */
.prospect-detail-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
}

.prospect-detail-card {
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
}

.prospect-detail-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.prospect-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--border-color);
}

.prospect-detail-title h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
}

.prospect-detail-title p {
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin: 0;
}

.prospect-detail-badges {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.prospect-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    background: var(--bg-primary);
    border-radius: 8px;
}

.detail-label {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 4px;
}

.detail-value {
    font-size: 0.85rem;
    color: var(--text-primary);
    word-break: break-word;
}

.detail-value a {
    color: var(--primary);
    text-decoration: none;
}

.detail-value a:hover {
    text-decoration: underline;
}

.prospect-detail-notes {
    padding: 12px;
    background: var(--bg-primary);
    border-radius: 8px;
}

.prospect-detail-notes h4 {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.prospect-detail-notes p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
}

.prospect-detail-tags {
    padding: 8px 0;
}

.prospect-detail-tags h4 {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.prospect-detail-meta {
    display: flex;
    gap: 16px;
    font-size: 0.65rem;
    color: var(--text-muted);
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
}

.modal-footer {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
}

/* Prospect Stats */
.prospect-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
}

.prospect-stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px;
    text-align: center;
    transition: var(--transition);
}

.prospect-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.prospect-stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
}

.prospect-stat-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-top: 2px;
}

/* Responsive */
@media (max-width: 768px) {
    .prospect-grid {
        grid-template-columns: 1fr;
    }
    
    .form-section-fields {
        grid-template-columns: 1fr;
    }
    
    .prospect-detail-grid {
        grid-template-columns: 1fr;
    }
    
    .prospect-form-card,
    .prospect-detail-card {
        max-width: 95%;
        margin: 10px;
        padding: 16px;
    }
    
    .prospect-card-header {
        flex-direction: column;
        align-items: stretch;
    }
    
    .prospect-card-badges {
        margin-top: 4px;
    }
    
    .form-actions {
        flex-direction: column-reverse;
        align-items: stretch;
    }
    
    .form-actions-right {
        flex-direction: column;
    }
    
    .form-actions .btn-icon {
        width: 100%;
        justify-content: center;
    }
    
    .prospect-stats-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }
}

@media (max-width: 480px) {
    .prospect-card {
        padding: 12px;
    }
    
    .prospect-detail-header {
        flex-direction: column;
        align-items: stretch;
    }
    
    .prospect-detail-badges {
        margin-top: 4px;
    }
    
    .prospect-stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .prospect-stat-value {
        font-size: 1.2rem;
    }
}
`;

// ================================================================
// INITIALIZATION
// ================================================================

// Inject styles
document.addEventListener('DOMContentLoaded', function() {
    const styleEl = document.createElement('style');
    styleEl.id = 'prospect-styles';
    styleEl.textContent = PROSPECT_STYLES;
    document.head.appendChild(styleEl);
});

// Create singleton instance
const ProspectManagerInstance = new ProspectManager();

// ================================================================
// AUTO-INITIALIZATION (FIXED - No property descriptor override)
// ================================================================

// Function to initialize prospect manager when ready
function initProspectManagerWhenReady() {
    // Check if we can initialize
    if (typeof window.AppState !== 'undefined' && window.AppState && window.AppState.currentUser) {
        if (!ProspectManagerInstance.isInitialized) {
            ProspectManagerInstance.init();
        }
        window.ProspectManager = ProspectManagerInstance;
        window.AppState.prospectManager = ProspectManagerInstance;
        window.AppState.prospectManagerReady = true;
        console.log('ðŸ“‹ Prospect Manager initialized successfully');
        return true;
    }
    return false;
}

// Try to initialize immediately
if (typeof window.AppState !== 'undefined' && window.AppState && window.AppState.currentUser) {
    setTimeout(initProspectManagerWhenReady, 100);
}

// Also try after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initProspectManagerWhenReady, 500);
});

// Listen for user changes using a simple interval check
// This is safer than overriding property descriptors
let userCheckInterval = null;

function startUserCheck() {
    if (userCheckInterval) return;
    userCheckInterval = setInterval(function() {
        if (typeof window.AppState !== 'undefined' && window.AppState && window.AppState.currentUser) {
            if (!ProspectManagerInstance.isInitialized) {
                ProspectManagerInstance.init();
                window.ProspectManager = ProspectManagerInstance;
                window.AppState.prospectManager = ProspectManagerInstance;
                window.AppState.prospectManagerReady = true;
                console.log('ðŸ“‹ Prospect Manager initialized via interval check');
                clearInterval(userCheckInterval);
                userCheckInterval = null;
            }
        }
    }, 2000);
}

// Start checking after a delay
setTimeout(startUserCheck, 1000);

// Also expose a manual init function
window.initProspectManager = function() {
    return initProspectManagerWhenReady();
};

// Expose globally
window.ProspectManager = ProspectManagerInstance;
window.ProspectUI = ProspectUI;
window.PROSPECT_SCHEMA = PROSPECT_SCHEMA;

console.log('ðŸ“‹ Prospect Manager module loaded');
console.log('ðŸ“‹ Use window.initProspectManager() to manually initialize');