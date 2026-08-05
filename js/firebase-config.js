// ================================================================
// FIREBASE CONFIGURATION - COMPLETE FIXED
// ================================================================

const firebaseConfig = {
    apiKey: "AIzaSyD_Ry0pM7EKSDJeTegt0rY5muiw-xCgrhw",
    authDomain: "scriptflow-pro-2cf4c.firebaseapp.com",
    projectId: "scriptflow-pro-2cf4c",
    storageBucket: "scriptflow-pro-2cf4c.firebasestorage.app",
    messagingSenderId: "250157640936",
    appId: "1:250157640936:web:cd6218470c302b305aed5d"
};

/**
 * Firebase Status Tracker
 */
const FirebaseStatus = {
    isInitialized: false,
    isReady: false,
    lastError: null,
    persistenceMode: 'none',
    connectionStatus: 'unknown',
    blockedByClient: false
};

// ================================================================
// FIREBASE INITIALIZATION - FIXED
// ================================================================

let firebaseInitAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function initializeFirebase() {
    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase SDK not loaded');
            FirebaseStatus.isReady = false;
            FirebaseStatus.lastError = 'Firebase SDK not loaded';
            return false;
        }

        // Initialize Firebase app if not already initialized
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase app initialized successfully');
        } else {
            console.log('✅ Firebase app already initialized');
        }

        // Get Firestore instance
        const db = firebase.firestore();
        
        // FIXED: Use modern Firestore settings with cache
        try {
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                ignoreUndefinedProperties: true,
                merge: true
            });
            console.log('✅ Firestore settings configured');
        } catch (settingsError) {
            console.warn('⚠️ Firestore settings warning:', settingsError.message);
        }

        // FIXED: Try to enable persistence with fallback
        // If persistence fails, we still continue with online-only mode
        if (typeof db.enablePersistence === 'function') {
            console.log('📋 Attempting to enable Firebase persistence...');
            
            // Try with synchronizeTabs: true
            db.enablePersistence({
                synchronizeTabs: true
            })
            .then(() => {
                console.log('✅ Firebase persistence enabled (multi-tab)');
                FirebaseStatus.persistenceMode = 'multi-tab';
                FirebaseStatus.isReady = true;
                FirebaseStatus.isInitialized = true;
                window.__FIREBASE_READY__ = true;
                
                if (typeof AppState !== 'undefined') {
                    AppState.isFirebaseReady = true;
                    AppState.firebaseStatus = FirebaseStatus;
                }
                
                document.dispatchEvent(new CustomEvent('firebase-ready'));
            })
            .catch(err => {
                console.warn('⚠️ Multi-tab persistence failed:', err.code || err.message);
                
                // Try single-tab mode
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Multiple tabs open - trying single-tab mode');
                    db.enablePersistence({
                        synchronizeTabs: false
                    })
                    .then(() => {
                        console.log('✅ Firebase persistence enabled (single-tab)');
                        FirebaseStatus.persistenceMode = 'single-tab';
                        FirebaseStatus.isReady = true;
                        FirebaseStatus.isInitialized = true;
                        window.__FIREBASE_READY__ = true;
                        
                        if (typeof AppState !== 'undefined') {
                            AppState.isFirebaseReady = true;
                            AppState.firebaseStatus = FirebaseStatus;
                        }
                        
                        document.dispatchEvent(new CustomEvent('firebase-ready'));
                    })
                    .catch(fallbackErr => {
                        console.warn('⚠️ Single-tab persistence failed:', fallbackErr.message);
                        this._handlePersistenceFallback(db);
                    });
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Persistence not supported in this browser');
                    this._handlePersistenceFallback(db);
                } else {
                    console.warn('⚠️ Persistence error:', err.message);
                    this._handlePersistenceFallback(db);
                }
            });
        } else {
            console.warn('⚠️ enablePersistence not available');
            this._handlePersistenceFallback(db);
        }

        console.log('🔥 Firebase initialization complete');
        console.log(`📋 Status: ${FirebaseStatus.isReady ? '✅ Ready' : '⚠️ Limited mode'}`);
        console.log(`📋 Persistence mode: ${FirebaseStatus.persistenceMode}`);
        return true;

    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        FirebaseStatus.isInitialized = false;
        FirebaseStatus.isReady = false;
        FirebaseStatus.lastError = error.message;
        window.__FIREBASE_READY__ = false;
        
        if (typeof AppState !== 'undefined') {
            AppState.isFirebaseReady = false;
            AppState.firebaseStatus = FirebaseStatus;
        }
        
        // Retry if attempts are less than max
        firebaseInitAttempts++;
        if (firebaseInitAttempts < MAX_INIT_ATTEMPTS) {
            console.log(`🔄 Retrying Firebase initialization (${firebaseInitAttempts}/${MAX_INIT_ATTEMPTS})...`);
            setTimeout(() => {
                initializeFirebase();
            }, 2000 * firebaseInitAttempts);
        }
        
        return false;
    }
}

// ================================================================
// PERSISTENCE FALLBACK
// ================================================================

function _handlePersistenceFallback(db) {
    FirebaseStatus.persistenceMode = 'none';
    FirebaseStatus.isReady = true;
    FirebaseStatus.isInitialized = true;
    window.__FIREBASE_READY__ = true;
    
    if (typeof AppState !== 'undefined') {
        AppState.isFirebaseReady = true;
        AppState.firebaseStatus = FirebaseStatus;
    }
    
    document.dispatchEvent(new CustomEvent('firebase-ready'));
    console.info('ℹ️ Running in online-only mode (no persistence)');
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && 
           firebase.apps && 
           firebase.apps.length > 0 && 
           FirebaseStatus.isReady;
}

function getFirestore() {
    try {
        if (isFirebaseAvailable()) {
            return firebase.firestore();
        }
        return null;
    } catch (error) {
        console.warn('⚠️ Could not get Firestore:', error.message);
        return null;
    }
}

function getAuth() {
    try {
        if (isFirebaseAvailable()) {
            return firebase.auth();
        }
        return null;
    } catch (error) {
        console.warn('⚠️ Could not get Auth:', error.message);
        return null;
    }
}

function getCurrentUser() {
    try {
        if (isFirebaseAvailable()) {
            return firebase.auth().currentUser;
        }
        return null;
    } catch (error) {
        console.warn('⚠️ Could not get current user:', error.message);
        return null;
    }
}

function getFirebaseStatus() {
    return {
        ...FirebaseStatus,
        isAvailable: isFirebaseAvailable(),
        sdkLoaded: typeof firebase !== 'undefined'
    };
}

/**
 * Wait for Firebase to be ready
 */
function waitForFirebaseReady(timeout = 10000) {
    return new Promise((resolve) => {
        if (FirebaseStatus.isReady) {
            resolve(true);
            return;
        }
        
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
            if (FirebaseStatus.isReady) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                console.warn('⚠️ Firebase ready timeout');
                resolve(false);
            }
        }, 200);
    });
}

// ================================================================
// IMMEDIATE INITIALIZATION
// ================================================================

console.log('🔥 Initializing Firebase...');
const isFirebaseReady = initializeFirebase();

// ================================================================
// EXPOSE GLOBALLY
// ================================================================

window.firebaseConfig = firebaseConfig;
window.FirebaseStatus = FirebaseStatus;
window.isFirebaseReady = isFirebaseReady;
window.isFirebaseAvailable = isFirebaseAvailable;
window.getFirestore = getFirestore;
window.getAuth = getAuth;
window.getCurrentUser = getCurrentUser;
window.getFirebaseStatus = getFirebaseStatus;
window.waitForFirebaseReady = waitForFirebaseReady;
window.__FIREBASE_READY__ = isFirebaseReady;

// Update AppState if available
if (typeof AppState !== 'undefined') {
    AppState.isFirebaseReady = isFirebaseReady;
    AppState.firebaseStatus = FirebaseStatus;
}

console.log(`🔥 Firebase status: ${isFirebaseReady ? '✅ Connected' : '❌ Offline mode'}`);

// ES Module support
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig,
        FirebaseStatus,
        isFirebaseReady,
        initializeFirebase,
        isFirebaseAvailable,
        getFirestore,
        getAuth,
        getCurrentUser,
        getFirebaseStatus,
        waitForFirebaseReady
    };
}