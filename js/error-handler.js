// ================================================================
// ERROR HANDLER - Global Error Management
// ================================================================

const ErrorHandler = {
    config: {
        showErrorPage: true,
        logErrors: true,
        maxLogEntries: 100,
        errorLog: [],
        autoDismissDelay: 0,
        showDetails: false
    },

    init() {
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
        const originalConsoleError = console.error;
        console.error = (...args) => {
            originalConsoleError.apply(console, args);
            this.logError(args.join(' '));
        };
        this.loadErrorLog();
        console.log('🛡️ Error Handler initialized');
    },

    loadErrorLog() {
        try {
            const stored = localStorage.getItem('error_log');
            if (stored) {
                this.config.errorLog = JSON.parse(stored);
                if (!Array.isArray(this.config.errorLog)) this.config.errorLog = [];
            }
        } catch (e) { this.config.errorLog = []; }
    },

    handleGlobalError(event) {
        const error = {
            message: event.message || 'Unknown error',
            filename: event.filename || 'unknown',
            line: event.lineno || 0,
            col: event.colno || 0,
            stack: event.error?.stack || '',
            timestamp: new Date().toISOString(),
            type: 'global',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        this.logError(error);
        this.showErrorPage(error);
        return true;
    },

    handlePromiseRejection(event) {
        const error = {
            message: event.reason?.message || 'Unhandled Promise Rejection',
            stack: event.reason?.stack || '',
            timestamp: new Date().toISOString(),
            type: 'promise',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        this.logError(error);
        this.showErrorPage(error);
    },

    logError(error) {
        if (!this.config.logErrors) return;
        let logEntry;
        if (typeof error === 'string') {
            logEntry = { message: error, timestamp: new Date().toISOString(), type: 'console' };
        } else {
            logEntry = { ...error, timestamp: error.timestamp || new Date().toISOString() };
        }
        this.config.errorLog.unshift(logEntry);
        if (this.config.errorLog.length > this.config.maxLogEntries) this.config.errorLog.pop();
        try {
            localStorage.setItem('error_log', JSON.stringify(this.config.errorLog.slice(0, 50)));
        } catch (e) {}
    },

    showErrorPage(error) {
        if (!this.config.showErrorPage) return;
        if (document.getElementById('errorPage')) return;
        if (error.message && error.message.includes('error-handler')) return;
        const errorPage = document.createElement('div');
        errorPage.id = 'errorPage';
        errorPage.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: var(--bg-primary, #0f172a); display: flex; align-items: center;
            justify-content: center; z-index: 99999; padding: 20px;
            animation: fadeIn 0.3s ease; font-family: 'Inter', -apple-system, sans-serif;
        `;
        const errorMessage = error?.message || 'An unexpected error occurred';
        const errorDetails = error?.stack || (error?.filename ? `File: ${error.filename}\nLine: ${error.line || 'unknown'}` : '');
        const errorType = error?.type || 'Unknown';
        const timestamp = error?.timestamp ? new Date(error.timestamp).toLocaleString() : new Date().toLocaleString();
        errorPage.innerHTML = `
            <div style="max-width: 520px; width: 100%; text-align: center; padding: 32px;
                background: var(--bg-secondary, #1e293b); border-radius: 24px;
                border: 1px solid var(--border-color, #334155);
                box-shadow: var(--shadow-lg, 0 20px 35px -8px rgba(0,0,0,0.4));">
                <div style="font-size: 4rem; margin-bottom: 16px;">⚠️</div>
                <h1 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; color: var(--text-primary, #f1f5f9);">
                    Something Went Wrong
                </h1>
                <p style="color: var(--text-secondary, #cbd5e1); margin-bottom: 16px; font-size: 0.95rem; line-height: 1.5;">
                    ${this.escapeHtml(errorMessage)}
                </p>
                <div style="background: var(--bg-primary, #0f172a); border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 16px; border: 1px solid var(--border-color, #334155);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <span style="font-size: 0.7rem; color: var(--text-muted, #94a3b8); font-weight: 600; text-transform: uppercase;">Error Details</span>
                        <span style="font-size: 0.65rem; color: var(--text-muted, #94a3b8);">${timestamp}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted, #94a3b8); margin-top: 4px;">
                        Type: ${this.escapeHtml(errorType)}
                        ${error?.filename ? ` · File: ${this.escapeHtml(error.filename.split('/').pop())}` : ''}
                        ${error?.line ? ` · Line: ${error.line}` : ''}
                    </div>
                </div>
                <details style="background: var(--bg-card, #1e293b); border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 20px; border: 1px solid var(--border-color, #334155);">
                    <summary style="cursor: pointer; color: var(--text-muted, #94a3b8); font-weight: 600; font-size: 0.8rem; user-select: none;">
                        <i class="fas fa-chevron-right" style="font-size: 0.6rem; margin-right: 6px; transition: transform 0.2s ease;"></i>
                        Show Technical Details
                    </summary>
                    <pre style="white-space: pre-wrap; font-size: 0.7rem; color: var(--text-secondary, #cbd5e1); margin-top: 8px; padding: 12px; background: var(--bg-primary, #0f172a); border-radius: 8px; overflow: auto; max-height: 200px; font-family: 'Courier New', monospace; border: 1px solid var(--border-color, #334155);">${this.escapeHtml(errorDetails || 'No additional details available')}</pre>
                </details>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.reload()" class="btn-icon" style="background: var(--primary, #3b82f6); color: white; padding: 10px 28px; border: none; border-radius: 40px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-sync-alt"></i> Reload Page
                    </button>
                    <button onclick="document.getElementById('errorPage').remove()" class="btn-icon" style="background: var(--bg-primary, #0f172a); color: var(--text-primary, #f1f5f9); padding: 10px 28px; border: 1px solid var(--border-color, #334155); border-radius: 40px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                </div>
                <div style="margin-top: 16px; font-size: 0.65rem; color: var(--text-muted, #94a3b8);">
                    If the problem persists, please contact support.
                    <span style="display: block; margin-top: 4px;">Error ID: ${this.generateErrorId()}</span>
                </div>
            </div>
        `;
        this.injectErrorStyles();
        document.body.appendChild(errorPage);
        if (this.config.autoDismissDelay > 0) {
            setTimeout(() => { const el = document.getElementById('errorPage'); if (el) el.remove(); }, this.config.autoDismissDelay);
        }
    },

    injectErrorStyles() {
        if (document.getElementById('error-handler-styles')) return;
        const style = document.createElement('style');
        style.id = 'error-handler-styles';
        style.textContent = `
            #errorPage .btn-icon:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            #errorPage .btn-icon:active { transform: translateY(0px); }
            #errorPage details summary::-webkit-details-marker { display: none; }
            #errorPage details[open] summary .fa-chevron-right { transform: rotate(90deg); }
            @media (max-width: 480px) {
                #errorPage > div { padding: 20px 16px !important; border-radius: 16px !important; }
                #errorPage h1 { font-size: 1.1rem !important; }
                #errorPage .btn-icon { padding: 8px 20px !important; font-size: 0.75rem !important; width: 100%; justify-content: center; }
                #errorPage > div > div:last-child { flex-direction: column; }
            }
            @media (max-width: 768px) {
                #errorPage > div { max-width: 95% !important; padding: 24px 20px !important; }
            }
        `;
        document.head.appendChild(style);
    },

    generateErrorId() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    },

    escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    getErrorLog() { return this.config.errorLog; },

    getErrorSummary() {
        const log = this.config.errorLog;
        if (log.length === 0) return { total: 0, types: {}, recent: null };
        const types = {};
        log.forEach(err => { const type = err.type || 'unknown'; types[type] = (types[type] || 0) + 1; });
        return { total: log.length, types: types, recent: log[0] || null, lastError: log[0]?.timestamp || null };
    },

    clearErrorLog() {
        this.config.errorLog = [];
        try { localStorage.removeItem('error_log'); } catch (e) {}
        console.log('🗑️ Error log cleared');
        return true;
    },

    report(error, context = '') {
        const errorObj = {
            message: error?.message || String(error),
            stack: error?.stack || '',
            context: context || 'manual',
            timestamp: new Date().toISOString(),
            type: 'manual',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        this.logError(errorObj);
        console.error(`📢 Error reported from ${context}:`, error);
        if (typeof showToast === 'function') {
            showToast(`Error reported: ${errorObj.message.substring(0, 50)}`, 'error');
        } else {
            this.showErrorToast(errorObj.message.substring(0, 50));
        }
        return errorObj;
    },

    showErrorToast(message, duration = 5000) {
        if (typeof showToast === 'function') { showToast(message, 'error'); return; }
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; background: #ef4444; color: white;
            padding: 12px 24px; border-radius: 12px; z-index: 99998; animation: slideInRight 0.3s ease;
            box-shadow: 0 8px 20px rgba(0,0,0,0.3); font-family: 'Inter', -apple-system, sans-serif;
            font-size: 0.85rem; max-width: 90%;
        `;
        toast.textContent = '❌ ' + message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    hasStoredErrors() { return this.config.errorLog.length > 0; },
    getLastError() { return this.config.errorLog[0] || null; },
    sendErrorReport(error) { console.log('📤 Error report would be sent:', error); return true; }
};

// ================================================================
// AUTO-INITIALIZE
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        ErrorHandler.init();
    }, 100);
});

// Expose globally
window.ErrorHandler = ErrorHandler;

console.log('🛡️ Error Handler module loaded');
console.log(`📋 Error log contains ${ErrorHandler.getErrorLog().length} entries`);