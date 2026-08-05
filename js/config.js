// ================================================================
// APPLICATION CONFIGURATION - NO AI
// ================================================================

const APP_CONFIG = {
    features: {
        enableAI: false,
        enableFallback: true,
        enableConfidenceScoring: true,
        enableDuplicateDetection: true,
        enableAIInsights: false,
        enableQualityScoring: true
    },
    ui: {
        showConfidence: true,
        showEvidence: true,
        showAIStatus: false,
        showQualityScore: true,
        showMissingFields: true
    },
    storageKeys: {
        userData: 'userData_fallback',
        appointments: 'appointments_fallback',
        tasks: 'tasks_fallback',
        teamMembers: 'teamMembers_fallback',
        scripts: 'scripts_fallback',
        scriptFavorites: 'scriptFavorites',
        customShortcuts: 'customShortcuts',
        toolsMenuOpen: 'toolsMenuOpen',
        analyticsFilters: 'analyticsFilters',
        prospectsCache: 'prospects_cache',
        objectionFavorites: 'objectionFavorites'
    }
};

function isAIConfigured() { return false; }
function isAIEnabled() { return false; }
function getAIConfig() { return { isConfigured: false, isEnabled: false }; }
function getApiKeyStatus() { return { hasKey: false, isValid: false, length: 0, masked: null, source: 'none' }; }

window.APP_CONFIG = APP_CONFIG;
window.isAIConfigured = isAIConfigured;
window.isAIEnabled = isAIEnabled;
window.getAIConfig = getAIConfig;
window.getApiKeyStatus = getApiKeyStatus;

console.log('⚙️ Configuration loaded (AI disabled)');