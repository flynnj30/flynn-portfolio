// ================================================================
// CRM SYNC SERVICE
// Integration layer between parser and CRM data model
// All features consume this single source of truth
// ================================================================

class CRMSyncService {
    constructor() {
        this.version = '1.0.0';
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.syncStats = {
            total: 0,
            created: 0,
            updated: 0,
            failed: 0
        };
    }

    // ================================================================
    // IMPORT TRANSCRIPT TO CRM
    // ================================================================

    /**
     * Import a transcript into the CRM
     * @param {string} transcript - The conversation transcript
     * @param {Object} options - Import options
     * @returns {Object} Import result
     */
    async importTranscript(transcript, options = {}) {
        try {
            this.syncInProgress = true;
            const startTime = Date.now();
            
            // Parse the transcript
            const metadata = {
                phone: options.phone || null,
                date: options.date || null,
                source: options.source || 'Smart Import'
            };
            
            const parsed = smartParser.parse(transcript, metadata);
            
            // Validate parsed data
            const validation = smartParser.validate(parsed);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Create CRM record
            const crmRecord = smartParser.toCRMRecord(parsed);
            
            // Upsert contact
            const contact = await this._upsertContact(crmRecord);
            
            // Create/update appointment if appointment is confirmed
            let appointment = null;
            if (parsed.appointment && parsed.appointment.confirmed) {
                appointment = await this._createAppointment(contact, parsed, crmRecord);
            }
            
            // Update analytics
            await this._updateAnalytics(parsed, contact, appointment);
            
            // Update pipeline
            await this._updatePipeline(parsed, contact);
            
            // Update sync stats
            this.syncStats.total++;
            this.syncStats.updated++;
            this.lastSyncTime = new Date();
            
            this.syncInProgress = false;
            
            return {
                success: true,
                parsed: parsed,
                contact: contact,
                appointment: appointment,
                crmRecord: crmRecord,
                validation: validation,
                syncTime: Date.now() - startTime,
                warnings: validation.warnings
            };
            
        } catch (error) {
            console.error('CRM Import Error:', error);
            this.syncStats.failed++;
            this.syncInProgress = false;
            
            return {
                success: false,
                error: error.message,
                parsed: null,
                contact: null,
                appointment: null
            };
        }
    }

    // ================================================================
    // CONTACT OPERATIONS
    // ================================================================

    async _upsertContact(crmRecord) {
        // Check if contact exists
        const existingContacts = Data.getAllAppointments();
        let existing = null;
        
        for (const appt of existingContacts) {
            if (appt.business && crmRecord.businessName && 
                appt.business.toLowerCase().trim() === crmRecord.businessName.toLowerCase().trim()) {
                existing = appt;
                break;
            }
            if (appt.phone && crmRecord.phone && 
                appt.phone.replace(/[^\d+]/g, '') === crmRecord.phone.replace(/[^\d+]/g, '')) {
                existing = appt;
                break;
            }
        }
        
        if (existing) {
            // Update existing contact
            const updates = {
                business: crmRecord.businessName || existing.business,
                contactName: crmRecord.contactName || existing.contactName,
                role: crmRecord.role || existing.role,
                phone: crmRecord.phone || existing.phone,
                email: crmRecord.email || existing.email,
                notes: crmRecord.notes || existing.notes,
                tags: crmRecord.tags || existing.tags,
                updatedAt: new Date().toISOString()
            };
            
            Data.updateAppointment(existing.date, existing.id, updates);
            return { ...existing, ...updates, id: existing.id, isNew: false };
        } else {
            // Create new contact
            const newAppt = Data.addAppointment(
                crmRecord.date || Utils.getTodayStr(),
                crmRecord.businessName || 'Unknown Business',
                crmRecord.contactName || 'Unknown Contact',
                crmRecord.role || 'Owner',
                crmRecord.phone || '',
                crmRecord.time || '',
                crmRecord.notes || '',
                crmRecord.assigned || 'Daniel',
                null,
                crmRecord.status || 'Pending',
                '',
                crmRecord.tags || []
            );
            
            this.syncStats.created++;
            return { ...newAppt, isNew: true };
        }
    }

    // ================================================================
    // APPOINTMENT OPERATIONS
    // ================================================================

    async _createAppointment(contact, parsed, crmRecord) {
        if (!parsed.appointment || !parsed.appointment.confirmed) {
            return null;
        }
        
        const appointmentDate = parsed.appointment.datetime || Utils.getTodayStr();
        const appointmentTime = this._formatTimeForDisplay(parsed.appointment.datetime);
        
        // Check if appointment already exists
        const existingAppointments = Data.getAllAppointments();
        let existing = null;
        
        for (const appt of existingAppointments) {
            if (appt.contactName === contact.contactName && 
                appt.business === contact.business &&
                appt.date === appointmentDate) {
                existing = appt;
                break;
            }
        }
        
        if (existing) {
            // Update existing appointment
            const updates = {
                time: appointmentTime || existing.time,
                status: 'Meeting Booked',
                notes: (existing.notes || '') + '\n' + (crmRecord.notes || ''),
                updatedAt: new Date().toISOString()
            };
            Data.updateAppointment(existing.date, existing.id, updates);
            return { ...existing, ...updates, isNew: false };
        } else {
            // Create new appointment
            const newAppt = Data.addAppointment(
                appointmentDate,
                contact.business,
                contact.contactName,
                contact.role || 'Owner',
                contact.phone || '',
                appointmentTime || '',
                crmRecord.notes || '',
                contact.assigned || 'Daniel',
                null,
                'Meeting Booked',
                '',
                crmRecord.tags || []
            );
            
            this.syncStats.created++;
            return { ...newAppt, isNew: true };
        }
    }

    _formatTimeForDisplay(datetime) {
        if (!datetime) return '';
        try {
            const date = new Date(datetime);
            if (!isNaN(date.getTime())) {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }
        } catch (e) {}
        return '';
    }

    // ================================================================
    // ANALYTICS UPDATE
    // ================================================================

    async _updateAnalytics(parsed, contact, appointment) {
        try {
            // Refresh analytics data
            Stats.updateAll();
            
            // Update meeting stats if appointment was created
            if (appointment) {
                const meetingStats = Stats.getMeetingStats();
                // Update UI with new stats
                if (typeof FeaturePanel !== 'undefined') {
                    FeaturePanel.refreshCurrentView();
                }
            }
            
            // Log analytics update
            console.log('📊 Analytics updated:', {
                contact: contact.contactName,
                status: parsed.status,
                appointment: appointment ? 'Created' : 'Not created'
            });
            
        } catch (error) {
            console.warn('Analytics update error:', error);
        }
    }

    // ================================================================
    // PIPELINE UPDATE
    // ================================================================

    async _updatePipeline(parsed, contact) {
        try {
            // Update pipeline based on status
            const pipelineStatus = this._mapStatusToPipeline(parsed.status);
            
            // Update prospect status if Prospect Manager is available
            if (AppState.prospectManagerReady && AppState.prospectManager) {
                const prospects = AppState.prospectManager.getAll();
                const existingProspect = prospects.find(p => 
                    p.business && contact.business && 
                    p.business.toLowerCase().trim() === contact.business.toLowerCase().trim()
                );
                
                if (existingProspect) {
                    // Update existing prospect
                    const updates = {
                        status: parsed.status,
                        leadScore: Utils.calculateLeadScore(contact),
                        notes: parsed.notes ? parsed.notes.join('\n') : existingProspect.notes,
                        tags: parsed.tags || existingProspect.tags,
                        updatedAt: new Date().toISOString()
                    };
                    await AppState.prospectManager.update(existingProspect.id, updates);
                } else {
                    // Create new prospect
                    const newProspect = {
                        business: contact.business,
                        name: contact.contactName,
                        role: contact.role,
                        phone: contact.phone,
                        email: contact.email,
                        status: parsed.status,
                        notes: parsed.notes ? parsed.notes.join('\n') : '',
                        tags: parsed.tags || [],
                        source: 'Smart Import',
                        leadScore: Utils.calculateLeadScore(contact),
                        createdAt: new Date().toISOString()
                    };
                    await AppState.prospectManager.create(newProspect);
                }
            }
            
        } catch (error) {
            console.warn('Pipeline update error:', error);
        }
    }

    _mapStatusToPipeline(status) {
        const pipelineMap = {
            'Hot Transfer': 'qualified',
            'Warm Callback': 'interested',
            'Meeting Booked': 'meeting_scheduled',
            'Held': 'meeting_held',
            'Completed': 'converted',
            'Rescheduled': 'meeting_scheduled',
            'Canceled': 'lost',
            'Pending': 'new'
        };
        return pipelineMap[status] || 'new';
    }

    // ================================================================
    // BATCH IMPORT
    // ================================================================

    /**
     * Batch import multiple transcripts
     * @param {Array} transcripts - Array of transcripts with metadata
     * @returns {Object} Batch import results
     */
    async batchImport(transcripts) {
        const results = {
            total: transcripts.length,
            successful: 0,
            failed: 0,
            errors: [],
            results: []
        };
        
        for (const item of transcripts) {
            const result = await this.importTranscript(
                item.transcript,
                item.options || {}
            );
            
            results.results.push(result);
            if (result.success) {
                results.successful++;
            } else {
                results.failed++;
                results.errors.push({
                    transcript: item.transcript.substring(0, 100) + '...',
                    error: result.error
                });
            }
        }
        
        // Update analytics after batch import
        Stats.updateAll();
        if (typeof FeaturePanel !== 'undefined') {
            FeaturePanel.refreshCurrentView();
        }
        
        return results;
    }

    // ================================================================
    // GET SYNC STATUS
    // ================================================================

    getStatus() {
        return {
            version: this.version,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            stats: { ...this.syncStats }
        };
    }

    // ================================================================
    // RESET SYNC STATS
    // ================================================================

    resetStats() {
        this.syncStats = {
            total: 0,
            created: 0,
            updated: 0,
            failed: 0
        };
        this.lastSyncTime = null;
        return this.syncStats;
    }
}

// ================================================================
// EXPOSE GLOBALLY
// ================================================================

// Create singleton instance
const crmSync = new CRMSyncService();

// Expose to window
window.CRMSyncService = CRMSyncService;
window.crmSync = crmSync;

console.log('🔄 CRM Sync Service initialized');
console.log(`📝 Version: ${crmSync.version}`);