/* ============================================
   Vision Screening PRO - Main Application
   
   CALIBRATION SYSTEM UPDATE:
   - REMOVED: Credit card drag/resize calibration (complex, error-prone)
   - REMOVED: Ruler measurement calibration (required physical ruler)
   - ADDED: Device-based calibration using screen metrics and device type selection
   - NEW FEATURES:
     * 5-step calibration flow (device type → screen size → warning → calculation → sanity check)
     * Low-vision friendly UI (large buttons, high contrast)
     * Zoom detection and warnings
     * Level-based mode fallback when uncalibrated
     * Copy results fallback modal for file:// protocol
   - BUG FIXES:
     * Fixed step 3 rendering issue (calibration step 3 now properly displays warning)
     * Enhanced copyResults with fallback for file:// protocol
     * Improved uncalibrated test handling with level-based sizing
   ============================================ */

// Application State
const state = {
    currentScreen: 'welcome',
    calibration: {
        completed: false,
        skipped: false,
        pxPerMM: null,
        method: null, // 'device_inches', 'none', or null
        deviceType: null, // 'phone', 'tablet', 'laptop', 'monitor'
        diagonalInches: null,
        initialDevicePixelRatio: null,
        timestamp: null
    },
    calibrationStep: 0, // 0-4 for calibration steps
    settings: {
        highContrast: false,
        largeText: false,
        reduceMotion: false,
        saveProgress: false,
        caregiverMode: false
    },
    testResults: {},
    testMenu: [
        {
            id: 'distance-va',
            name: 'Distance Visual Acuity',
            description: 'Approximate distance vision screening',
            completed: false
        },
        {
            id: 'near-vision',
            name: 'Near Vision Reading',
            description: 'Reading ability at close distances',
            completed: false
        },
        {
            id: 'amsler',
            name: 'Amsler Grid',
            description: 'Check for distortion or missing areas',
            completed: false
        },
        {
            id: 'contrast',
            name: 'Contrast Sensitivity',
            description: 'Ability to see low contrast targets',
            completed: false
        },
        {
            id: 'glare',
            name: 'Glare Sensitivity',
            description: 'Tolerance to bright light and glare',
            completed: false
        },
        {
            id: 'color',
            name: 'Color Vision Check',
            description: 'Basic color discrimination screening',
            completed: false
        },
        {
            id: 'questionnaire',
            name: 'Functional Vision Questionnaire',
            description: 'Daily vision-related activities',
            completed: false
        }
    ],
    currentTest: null,
    testStep: 0,
    testData: {}
};

// Screen flow configuration
const screenFlow = [
    { id: 'welcome', name: 'Welcome' },
    { id: 'calibration', name: 'Calibration' },
    { id: 'test-menu', name: 'Test Menu' },
    { id: 'test-flow', name: 'Test Flow' },
    { id: 'results', name: 'Results' }
];

// DOM Elements
const elements = {
    screens: {},
    backBtn: null,
    nextBtn: null,
    settingsBtn: null,
    settingsModal: null,
    progressText: null
};

// Initialize DOM references
function initElements() {
    // Screens
    elements.screens.welcome = document.getElementById('welcome-screen');
    elements.screens.calibration = document.getElementById('calibration-screen');
    elements.screens.testMenu = document.getElementById('test-menu-screen');
    elements.screens.testFlow = document.getElementById('test-flow-screen');
    elements.screens.results = document.getElementById('results-screen');
    
    // Navigation
    elements.backBtn = document.getElementById('back-btn');
    elements.nextBtn = document.getElementById('next-btn');
    elements.settingsBtn = document.getElementById('settings-btn');
    elements.progressText = document.getElementById('progress-text');
    
    // Modals
    elements.settingsModal = document.getElementById('settings-modal');
    elements.resumeDialog = document.getElementById('resume-dialog');
}

// State Management
function updateState(updates) {
    Object.assign(state, updates);
    if (state.settings.saveProgress) {
        saveToLocalStorage();
    }
    render();
}

function setScreen(screenId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:139',message:'setScreen called',data:{from:state.currentScreen,to:screenId,calibrationStep:state.calibrationStep},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    updateState({ currentScreen: screenId });
}

// LocalStorage Management
const STORAGE_KEY = 'visionScreeningPro';

function saveToLocalStorage() {
    if (!state.settings.saveProgress) return;
    try {
        const data = {
            calibration: state.calibration,
            testResults: state.testResults,
            settings: state.settings,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            // Restore settings
            if (parsed.settings) {
                state.settings = { ...state.settings, ...parsed.settings };
                applySettings();
            }
            // Restore calibration
            if (parsed.calibration) {
                state.calibration = parsed.calibration;
            }
            // Restore test results
            if (parsed.testResults) {
                state.testResults = parsed.testResults;
                // Update test menu completion status
                state.testMenu.forEach(test => {
                    test.completed = !!parsed.testResults[test.id];
                });
            }
            return true;
        }
    } catch (e) {
        console.warn('Failed to load from localStorage:', e);
    }
    return false;
}

function clearLocalStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear localStorage:', e);
    }
}

// Settings Management
function applySettings() {
    const body = document.body;
    if (state.settings.highContrast) {
        body.setAttribute('data-theme', 'high-contrast');
    } else {
        body.removeAttribute('data-theme');
    }
    
    if (state.settings.largeText) {
        body.setAttribute('data-text-size', 'large');
    } else {
        body.removeAttribute('data-text-size');
    }
    
    if (state.settings.reduceMotion) {
        body.setAttribute('data-reduce-motion', 'true');
    } else {
        body.removeAttribute('data-reduce-motion');
    }
    
    if (state.settings.caregiverMode) {
        body.setAttribute('data-caregiver-mode', 'true');
    } else {
        body.removeAttribute('data-caregiver-mode');
    }
}

// Progress Indicator
function updateProgress() {
    const currentIndex = screenFlow.findIndex(s => s.id === state.currentScreen);
    const totalSteps = screenFlow.length;
    if (currentIndex >= 0) {
        elements.progressText.textContent = `Step ${currentIndex + 1} of ${totalSteps}`;
    }
}

// Navigation
function canGoBack() {
    return state.currentScreen !== 'welcome';
}

function canGoNext() {
    switch (state.currentScreen) {
        case 'welcome':
            return true;
        case 'calibration':
            // Can proceed if calibration completed or skipped
            // Note: Next button is hidden during calibration steps, only shown after completion
            return state.calibration.completed || (state.calibration.method === 'none');
        case 'test-menu':
            return Object.keys(state.testResults).length > 0;
        case 'test-flow':
            return false; // Handled by test logic
        case 'results':
            return false;
        default:
            return false;
    }
}

function handleBack() {
    if (!canGoBack()) return;
    
    if (state.currentScreen === 'test-flow') {
        // Return to test menu from test flow
        setScreen('test-menu');
    } else {
        const currentIndex = screenFlow.findIndex(s => s.id === state.currentScreen);
        if (currentIndex > 0) {
            setScreen(screenFlow[currentIndex - 1].id);
        }
    }
}

function handleNext() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:274',message:'handleNext ENTRY',data:{currentScreen:state.currentScreen,calibrationStep:state.calibrationStep,calibrationCompleted:state.calibration.completed,calibrationMethod:state.calibration.method,canGoNext:canGoNext()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('handleNext called, currentScreen:', state.currentScreen, 'canGoNext:', canGoNext(), 'calibrationStep:', state.calibrationStep);
    console.log('Calibration state:', {
        completed: state.calibration.completed,
        method: state.calibration.method,
        skipped: state.calibration.skipped
    });
    
    // Special handling for calibration screen during steps (0-4)
    // If user clicks Next during calibration, skip it and go to test menu
    if (state.currentScreen === 'calibration') {
        if (state.calibrationStep < 5 && 
            !state.calibration.completed && 
            state.calibration.method !== 'none') {
            // User clicked Next during calibration - skip calibration
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:289',message:'BEFORE skipCalibration call',data:{calibrationStep:state.calibrationStep},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.log('Next clicked during calibration step', state.calibrationStep, '- skipping calibration');
            skipCalibration();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:291',message:'AFTER skipCalibration call',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            return;
        } else if (state.calibration.completed || state.calibration.method === 'none') {
            // Calibration is done, proceed to test menu
            console.log('Calibration complete/skipped, navigating to test-menu');
            setScreen('test-menu');
            return;
        }
    }
    
    if (!canGoNext()) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:300',message:'canGoNext returned false',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log('Cannot go next - canGoNext returned false');
        return;
    }
    
    switch (state.currentScreen) {
        case 'welcome':
            console.log('Navigating from welcome to calibration');
            setScreen('calibration');
            break;
        case 'calibration':
            console.log('Navigating from calibration to test-menu');
            setScreen('test-menu');
            break;
        case 'test-menu':
            console.log('Navigating from test-menu to results');
            setScreen('results');
            break;
        default:
            console.log('No navigation handler for screen:', state.currentScreen);
            break;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:318',message:'handleNext EXIT',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
}

// Device-based Calibration System
const DEVICE_PRESETS = {
    phone: [5.8, 6.1, 6.7],
    tablet: [8, 10.2, 11, 12.9],
    laptop: [13.3, 14, 15.6, 16],
    monitor: [22, 24, 27, 32]
};

// Store initial devicePixelRatio for zoom detection
if (!state.calibration.initialDevicePixelRatio && typeof window !== 'undefined') {
    state.calibration.initialDevicePixelRatio = window.devicePixelRatio || 1;
}

function initCalibration() {
    // Only initialize if truly undefined - NEVER reset if already set
    if (typeof state.calibrationStep === 'undefined' || state.calibrationStep === null) {
        // Only set to 0 if we're truly starting fresh (not completed and not skipped)
        if (!state.calibration.completed && state.calibration.method !== 'none') {
            state.calibrationStep = 0;
        } else {
            // If already completed or skipped, don't reset
            state.calibrationStep = state.calibrationStep || 0;
        }
    }
    
    // Always render the current step - use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        renderCalibrationStep();
    });
    
    // Skip button - use event delegation or check if already bound
    const skipBtn = document.getElementById('skip-calibration');
    if (skipBtn && !skipBtn.dataset.listenerBound) {
        skipBtn.addEventListener('click', skipCalibration);
        skipBtn.dataset.listenerBound = 'true';
    }
}

function renderCalibrationStep() {
    // CRITICAL: Only render if we're actually on the calibration screen
    if (state.currentScreen !== 'calibration') {
        console.log('Skipping calibration render - not on calibration screen. Current screen:', state.currentScreen);
        return;
    }
    
    const content = document.getElementById('calibration-content');
    if (!content) {
        console.error('calibration-content element not found');
        // Try to find it with a delay
        setTimeout(() => {
            // Check again if we're still on calibration screen
            if (state.currentScreen === 'calibration') {
                const retryContent = document.getElementById('calibration-content');
                if (retryContent) {
                    renderCalibrationStep();
                } else {
                    console.error('calibration-content still not found after retry');
                }
            }
        }, 100);
        return;
    }
    
    // Ensure calibrationStep is valid and initialized - but DON'T reset if already set
    if (typeof state.calibrationStep === 'undefined' || state.calibrationStep === null) {
        state.calibrationStep = 0;
    }
    // Only clamp if out of bounds, don't reset valid values
    if (state.calibrationStep < 0) {
        console.warn('calibrationStep was negative, clamping to 0');
        state.calibrationStep = 0;
    }
    if (state.calibrationStep > 4) {
        console.warn('calibrationStep was > 4, clamping to 4');
        state.calibrationStep = 4;
    }
    
    // Debug log
    console.log('Rendering calibration step:', state.calibrationStep, 'Current screen:', state.currentScreen);
    
    switch (state.calibrationStep) {
        case 0:
            renderCalibrationStep1_DeviceType(content);
            break;
        case 1:
            renderCalibrationStep2_ScreenSize(content);
            break;
        case 2:
            renderCalibrationStep3_Warning(content);
            break;
        case 3:
            renderCalibrationStep4_Calculation(content);
            break;
        case 4:
            renderCalibrationStep5_SanityCheck(content);
            break;
        default:
            content.innerHTML = `<div style="padding: 2rem;"><p>Calibration step error. Step: ${state.calibrationStep}</p><p>Please refresh the page.</p></div>`;
            console.error('Invalid calibration step:', state.calibrationStep);
    }
}

function renderCalibrationStep1_DeviceType(container) {
    container.innerHTML = `
        <h3>Step 1: Choose Your Device Type</h3>
        <p>Select the type of device you're using:</p>
        <div class="device-type-grid">
            <button class="btn btn-primary device-type-btn" onclick="selectDeviceType('phone')" style="min-height: 80px; font-size: 1.2rem;">
                📱 Phone
            </button>
            <button class="btn btn-primary device-type-btn" onclick="selectDeviceType('tablet')" style="min-height: 80px; font-size: 1.2rem;">
                📱 Tablet
            </button>
            <button class="btn btn-primary device-type-btn" onclick="selectDeviceType('laptop')" style="min-height: 80px; font-size: 1.2rem;">
                💻 Laptop
            </button>
            <button class="btn btn-primary device-type-btn" onclick="selectDeviceType('monitor')" style="min-height: 80px; font-size: 1.2rem;">
                🖥️ Monitor
            </button>
        </div>
    `;
}

function renderCalibrationStep2_ScreenSize(container) {
    const deviceType = state.calibration.deviceType;
    const presets = DEVICE_PRESETS[deviceType] || [];
    
    container.innerHTML = `
        <h3>Step 2: Choose Screen Size</h3>
        <p>Select your screen's diagonal size in inches:</p>
        <div class="screen-size-grid">
            ${presets.map(size => `
                <button class="btn btn-secondary screen-size-btn" onclick="selectScreenSize(${size})" style="min-height: 70px; font-size: 1.1rem;">
                    ${size}"
                </button>
            `).join('')}
            <button class="btn btn-secondary screen-size-btn" onclick="showCustomSizeInput()" style="min-height: 70px; font-size: 1.1rem;">
                Other
            </button>
        </div>
        <div id="custom-size-container" style="display: none; margin-top: 1.5rem;">
            <label class="calibration-label">Enter diagonal size (inches):</label>
            <div class="custom-size-controls">
                <button class="btn btn-secondary" onclick="adjustCustomSize(-0.5)" style="min-width: 60px;">−</button>
                <input type="number" id="custom-size-input" class="calibration-input" min="1" max="100" step="0.1" value="13.3" style="max-width: 150px; text-align: center;">
                <button class="btn btn-secondary" onclick="adjustCustomSize(0.5)" style="min-width: 60px;">+</button>
            </div>
            <button class="btn btn-primary" onclick="selectCustomScreenSize()" style="margin-top: 1rem;">Use This Size</button>
        </div>
    `;
}

function renderCalibrationStep3_Warning(container) {
    console.log('renderCalibrationStep3_Warning called, container:', container, 'step:', state.calibrationStep);
    
    if (!container) {
        console.error('Container is null in renderCalibrationStep3_Warning');
        // Try to find it again
        container = document.getElementById('calibration-content');
        if (!container) {
            console.error('calibration-content still not found');
            // Last resort - try to create it
            const calibrationScreen = document.getElementById('calibration-screen');
            if (calibrationScreen) {
                const contentCard = calibrationScreen.querySelector('.content-card');
                if (contentCard) {
                    container = document.createElement('div');
                    container.id = 'calibration-content';
                    contentCard.insertBefore(container, contentCard.firstChild);
                }
            }
            if (!container) {
                console.error('Could not create calibration-content element');
                return;
            }
        }
    }
    
    try {
        const html = `
            <h3>Step 3: Important Information</h3>
            <div class="disclaimer-box" role="alert" style="margin-top: 1.5rem;">
                <h3>⚠️ Important: Approximate Calibration</h3>
                <p><strong>Accuracy depends on:</strong></p>
                <ul>
                    <li>Browser zoom level (should be 100%)</li>
                    <li>Display scaling settings</li>
                    <li>Screen resolution</li>
                </ul>
                <p>This method provides an <strong>approximate</strong> calibration. For more accurate results, consider professional eye care.</p>
            </div>
            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn btn-primary" id="continue-calibration-btn" onclick="event.preventDefault(); event.stopPropagation(); advanceCalibrationStep(); return false;" style="min-height: 60px; font-size: 1.1rem; padding: 1rem 2rem;">
                    I Understand - Continue
                </button>
            </div>
        `;
        console.log('Setting innerHTML for step 3');
        container.innerHTML = html;
        // Force visibility
        container.style.display = 'block';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.minHeight = '200px'; // Ensure it has height
        // Ensure parent is visible
        const parent = container.parentElement;
        if (parent) {
            parent.style.display = 'block';
            parent.style.visibility = 'visible';
        }
        // Ensure calibration screen is visible
        const calibrationScreen = document.getElementById('calibration-screen');
        if (calibrationScreen) {
            calibrationScreen.style.display = 'block';
            calibrationScreen.classList.add('active');
        }
        console.log('Step 3 content rendered successfully');
    } catch (e) {
        console.error('Error rendering step 3:', e);
        container.innerHTML = `<div style="padding: 2rem; color: red;"><p>Error rendering step 3: ${e.message}</p><p>Step value: ${state.calibrationStep}</p><button onclick="location.reload()">Reload Page</button></div>`;
    }
}

function renderCalibrationStep4_Calculation(container) {
    // Calculate pxPerMM using screen metrics
    let pxPerMM = null;
    let errorMsg = null;
    
    try {
        if (typeof screen !== 'undefined' && screen.width && screen.height && state.calibration.diagonalInches) {
            const physicalWidthPx = screen.width * (window.devicePixelRatio || 1);
            const physicalHeightPx = screen.height * (window.devicePixelRatio || 1);
            const diagonalPx = Math.sqrt(physicalWidthPx * physicalWidthPx + physicalHeightPx * physicalHeightPx);
            const diagonalInches = state.calibration.diagonalInches;
            const PPI = diagonalPx / diagonalInches;
            pxPerMM = PPI / 25.4;
            
            // Sanity check
            if (pxPerMM < 0.5 || pxPerMM > 20) {
                errorMsg = 'Calculated value seems implausible. Screen metrics may be incorrect.';
            }
        } else {
            errorMsg = 'Unable to access screen metrics. Please use Level-based mode instead.';
        }
    } catch (e) {
        errorMsg = 'Error calculating calibration: ' + e.message;
    }
    
    if (errorMsg || !pxPerMM) {
        container.innerHTML = `
            <div class="disclaimer-box" style="border-color: var(--color-error);">
                <h3>⚠️ Calibration Error</h3>
                <p>${errorMsg || 'Unable to calculate calibration.'}</p>
                <button class="btn btn-secondary" onclick="useLevelBasedMode()" style="margin-top: 1rem;">
                    Use Level-based Mode Instead
                </button>
            </div>
        `;
        return;
    }
    
    // Store calculated value
    state.calibration.pxPerMM = pxPerMM;
    
    container.innerHTML = `
        <h3>Step 4: Calibration Calculated</h3>
        <div class="calibration-result-box">
            <p><strong>Device:</strong> ${state.calibration.deviceType}</p>
            <p><strong>Screen Size:</strong> ${state.calibration.diagonalInches}" diagonal</p>
            <p><strong>Calculated:</strong> ${pxPerMM.toFixed(2)} pixels per mm</p>
        </div>
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="advanceCalibrationStep()" style="min-height: 60px; font-size: 1.1rem;">
                Continue to Verification
            </button>
        </div>
    `;
}

function renderCalibrationStep5_SanityCheck(container) {
    // Calculate 5cm in pixels
    const pxPerMM = state.calibration.pxPerMM;
    const fiveCmPx = pxPerMM ? pxPerMM * 50 : 100; // Fallback to 100px if no calibration
    
    container.innerHTML = `
        <h3>Step 5: Verify Calibration</h3>
        <p>Look at the reference bar below. Does it look approximately 5 cm (2 inches)?</p>
        
        <div class="reference-bar-container">
            <div class="reference-bar" id="reference-bar" style="width: ${fiveCmPx}px; height: 20px; background-color: var(--color-primary); border: 3px solid var(--color-text); margin: 2rem auto;"></div>
            <p class="reference-label" style="text-align: center; font-weight: bold; font-size: 1.1rem;">5 cm reference</p>
        </div>
        
        <div class="sanity-check-buttons">
            <button class="btn btn-primary sanity-check-btn" onclick="completeCalibration('correct')" style="min-height: 70px; font-size: 1.1rem;">
                ✓ Looks Right
            </button>
            <button class="btn btn-secondary sanity-check-btn" onclick="completeCalibration('unsure')" style="min-height: 70px; font-size: 1.1rem;">
                ? Not Sure
            </button>
            <button class="btn btn-secondary sanity-check-btn" onclick="showZoomInstructions()" style="min-height: 70px; font-size: 1.1rem;">
                ✗ Looks Wrong
            </button>
        </div>
        
        <div id="zoom-instructions" style="display: none; margin-top: 2rem; padding: 1rem; background-color: var(--color-surface); border-radius: var(--border-radius);">
            <h4>Browser Zoom Instructions</h4>
            <p>Set your browser zoom to 100%:</p>
            <ul>
                <li><strong>Chrome/Edge:</strong> Press Ctrl+0 (Windows) or Cmd+0 (Mac)</li>
                <li><strong>Firefox:</strong> Press Ctrl+0 (Windows) or Cmd+0 (Mac)</li>
                <li><strong>Safari:</strong> View → Zoom → Actual Size</li>
            </ul>
            <p>Then refresh this page and try again.</p>
            <button class="btn btn-link" onclick="useLevelBasedMode()" style="margin-top: 1rem;">
                Use Level-based Mode Instead
            </button>
        </div>
    `;
}

// Calibration step handlers
function selectDeviceType(type) {
    state.calibration.deviceType = type;
    state.calibrationStep = 1;
    console.log('Selected device type:', type, 'Setting step to 1');
    renderCalibrationStep();
}

function selectScreenSize(inches) {
    state.calibration.diagonalInches = inches;
    state.calibrationStep = 2;
    console.log('Selected screen size:', inches, 'Setting step to 2');
    renderCalibrationStep();
}

function showCustomSizeInput() {
    const container = document.getElementById('custom-size-container');
    if (container) {
        container.style.display = 'block';
        const input = document.getElementById('custom-size-input');
        if (input) input.focus();
    }
}

function adjustCustomSize(delta) {
    const input = document.getElementById('custom-size-input');
    if (input) {
        const current = parseFloat(input.value) || 13.3;
        const newValue = Math.max(1, Math.min(100, current + delta));
        input.value = newValue.toFixed(1);
    }
}

function selectCustomScreenSize() {
    const input = document.getElementById('custom-size-input');
    if (input) {
        const inches = parseFloat(input.value);
        if (inches > 0 && inches <= 100) {
            selectScreenSize(inches);
        }
    }
}

function advanceCalibrationStep() {
    console.log('advanceCalibrationStep called, currentScreen:', state.currentScreen, 'calibrationStep:', state.calibrationStep);
    
    // Ensure we're on calibration screen - if not, set it
    if (state.currentScreen !== 'calibration') {
        console.log('Fixing screen to calibration');
        state.currentScreen = 'calibration';
    }
    
    const oldStep = state.calibrationStep;
    state.calibrationStep++;
    // Ensure step is within bounds
    if (state.calibrationStep > 4) {
        state.calibrationStep = 4;
    }
    console.log('Advancing calibration step from', oldStep, 'to', state.calibrationStep);
    
    // Update state and render - but keep screen as calibration
    state.currentScreen = 'calibration';
    renderCalibrationStep();
    
    // Force screen visibility
    const calibrationScreen = document.getElementById('calibration-screen');
    if (calibrationScreen) {
        calibrationScreen.classList.add('active');
        // Hide other screens
        document.querySelectorAll('.screen').forEach(screen => {
            if (screen.id !== 'calibration-screen') {
                screen.classList.remove('active');
            }
        });
    }
    
    // Update navigation
    if (elements.nextBtn) {
        elements.nextBtn.style.display = 'none'; // Hide during calibration steps
    }
}

function showZoomInstructions() {
    const instructions = document.getElementById('zoom-instructions');
    if (instructions) {
        instructions.style.display = 'block';
    }
}

function useLevelBasedMode() {
    skipCalibration();
}

function completeCalibration(result) {
    console.log('completeCalibration called with result:', result);
    
    // Check for zoom changes
    const currentDPR = window.devicePixelRatio || 1;
    const initialDPR = state.calibration.initialDevicePixelRatio || currentDPR;
    const zoomChanged = Math.abs(currentDPR - initialDPR) > 0.1;
    
    updateState({
        calibration: {
            completed: true,
            skipped: false,
            pxPerMM: state.calibration.pxPerMM,
            method: 'device_inches',
            deviceType: state.calibration.deviceType,
            diagonalInches: state.calibration.diagonalInches,
            initialDevicePixelRatio: initialDPR,
            zoomChanged: zoomChanged,
            timestamp: new Date().toISOString()
        }
    });
    
    // Show Next button and enable it
    if (elements.nextBtn) {
        elements.nextBtn.style.display = '';
        elements.nextBtn.disabled = false;
        elements.nextBtn.style.pointerEvents = 'auto';
        elements.nextBtn.style.cursor = 'pointer';
    }
    
    // Navigate to test menu
    console.log('Calibration complete, navigating to test-menu');
    handleNext();
}

function skipCalibration() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:773',message:'skipCalibration ENTRY',data:{currentScreen:state.currentScreen,calibrationStep:state.calibrationStep,calibrationMethod:state.calibration.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    console.log('Skip calibration called, currentScreen:', state.currentScreen, 'calibrationStep:', state.calibrationStep);
    
    // Prevent multiple calls
    if (state.calibration.method === 'none') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:777',message:'Already skipped branch',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.log('Already skipped, ignoring');
        // But still navigate if we're on calibration screen
        if (state.currentScreen === 'calibration') {
            console.log('Already skipped but still on calibration screen, navigating to test-menu');
            state.currentScreen = 'test-menu';
            render();
        }
        return;
    }
    
    // Update state
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:788',message:'BEFORE state update',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    state.calibration.completed = false;
    state.calibration.skipped = true;
    state.calibration.pxPerMM = null;
    state.calibration.method = 'none';
    state.calibration.deviceType = null;
    state.calibration.diagonalInches = null;
    state.calibration.timestamp = new Date().toISOString();
    state.calibrationStep = 0;
    
    // Save to localStorage if enabled
    if (state.settings.saveProgress) {
        saveToLocalStorage();
    }
    
    // Navigate to test menu - use setScreen which triggers render
    console.log('Skipping calibration, setting screen to test-menu');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:805',message:'BEFORE setScreen call',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    state.currentScreen = 'test-menu';
    render();
    
    // Also call setScreen to ensure state is updated
    setScreen('test-menu');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:810',message:'skipCalibration EXIT',data:{currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
}

// Test Menu
function renderTestMenu() {
    const grid = document.getElementById('test-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    state.testMenu.forEach(test => {
        const card = document.createElement('div');
        card.className = `test-card ${test.completed ? 'completed' : ''}`;
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${test.name}. ${test.description}`);
        
        card.innerHTML = `
            <h3>${test.name}</h3>
            <p>${test.description}</p>
            ${test.completed ? '<span class="test-status">✓ Completed</span>' : ''}
        `;
        
        card.addEventListener('click', () => startTest(test.id));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startTest(test.id);
            }
        });
        
        grid.appendChild(card);
    });
}

function startTest(testId) {
    const test = state.testMenu.find(t => t.id === testId);
    if (!test) return;
    
    state.currentTest = testId;
    state.testStep = 0;
    state.testData = {};
    setScreen('test-flow');
}

// Test Modules
function renderTestFlow() {
    const content = document.getElementById('test-content');
    const title = document.getElementById('test-flow-title');
    if (!content || !title) return;
    
    if (!state.currentTest) {
        content.innerHTML = '<p>No test selected.</p>';
        return;
    }
    
    const test = state.testMenu.find(t => t.id === state.currentTest);
    title.textContent = test.name;
    
    switch (state.currentTest) {
        case 'distance-va':
            renderDistanceVATest();
            break;
        case 'near-vision':
            renderNearVisionTest();
            break;
        case 'amsler':
            renderAmslerTest();
            break;
        case 'contrast':
            renderContrastTest();
            break;
        case 'glare':
            renderGlareTest();
            break;
        case 'color':
            renderColorTest();
            break;
        case 'questionnaire':
            renderQuestionnaireTest();
            break;
        default:
            content.innerHTML = '<p>Test not implemented.</p>';
    }
}

// Distance VA Test
function renderDistanceVATest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This test screens approximate distance vision using optotypes (letter-like shapes).' },
        { type: 'setup', text: 'Choose your testing distance and follow the instructions for each eye.' },
        { type: 'distance-select', text: 'Select your testing distance:' },
        { type: 'eye-select', text: 'Select which eye to test:' },
        { type: 'test', text: 'Test in progress' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'setup') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Setup Instructions</h3>
                <div class="test-instructions">
                    <p><strong>Distance:</strong> Stand or sit at your chosen distance from the screen.</p>
                    <p><strong>Lighting:</strong> Ensure adequate lighting without glare on the screen.</p>
                    <p><strong>Covering:</strong> Use your hand or an eye patch to cover the non-testing eye.</p>
                </div>
                <button class="btn btn-primary" onclick="advanceTestStep()">Start Test</button>
            </div>
        `;
    } else if (step.type === 'distance-select') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Select Testing Distance</h3>
                <p>Choose the distance you will be from the screen:</p>
                <div class="questionnaire-options">
                    <button class="btn btn-secondary questionnaire-option" onclick="selectDistance(1)">1 meter (3.3 ft)</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="selectDistance(2)">2 meters (6.6 ft)</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="selectDistance(3)">3 meters (9.8 ft)</button>
                </div>
            </div>
        `;
    } else if (step.type === 'eye-select') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Select Eye to Test</h3>
                <p>Which eye would you like to test?</p>
                <div class="questionnaire-options">
                    <button class="btn btn-secondary questionnaire-option" onclick="selectEye('OD')">Right Eye (OD)</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="selectEye('OS')">Left Eye (OS)</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="selectEye('OU')">Both Eyes (OU)</button>
                </div>
            </div>
        `;
    } else if (step.type === 'test') {
        renderDistanceVATestInterface();
    } else if (step.type === 'review') {
        renderDistanceVAReview();
    }
}

function selectDistance(meters) {
    state.testData.distance = meters;
    advanceTestStep();
}

function selectEye(eye) {
    state.testData.currentEye = eye;
    state.testData.eyeResults = state.testData.eyeResults || {};
    state.testData.eyeResults[eye] = {
        level: 10,
        correct: 0,
        incorrect: 0,
        trials: []
    };
    advanceTestStep();
}

let currentOptotypeLevel = 10;
let currentOptotypeDirection = 0;
const optotypeDirections = ['↑', '↓', '←', '→'];
const directionNames = ['Up', 'Down', 'Left', 'Right'];
let optotypeKeyboardHandler = null;

function renderDistanceVATestInterface() {
    const content = document.getElementById('test-content');
    const eye = state.testData.currentEye;
    const distance = state.testData.distance || 2;
    const eyeResult = state.testData.eyeResults[eye];
    
    if (!eyeResult) {
        advanceTestStep(-1);
        return;
    }
    
    // Calculate optotype size - use pxPerMM if calibrated, otherwise use level-based sizing
    let finalSizePx;
    const isCalibrated = state.calibration.completed && state.calibration.pxPerMM;
    
    if (isCalibrated) {
        // Calibrated mode: use pxPerMM for scaling
        const baseSizeMM = 8.73; // Standard 20/20 equivalent at 6m
        const pxPerMM = state.calibration.pxPerMM;
        const distanceFactor = distance / 6; // Normalize to 6m standard
        const levelFactor = (11 - currentOptotypeLevel) / 10;
        finalSizePx = baseSizeMM * pxPerMM * distanceFactor * levelFactor;
    } else {
        // Level-based mode: use predefined size array
        const levelSizes = [120, 100, 85, 70, 60, 50, 42, 35, 28, 24, 20]; // px sizes for levels 1-11
        const sizeIndex = Math.max(0, Math.min(10, 11 - currentOptotypeLevel));
        finalSizePx = levelSizes[sizeIndex];
    }
    
    // Ensure minimum size for visibility
    const minSizePx = 20;
    finalSizePx = Math.max(finalSizePx, minSizePx);
    
    currentOptotypeDirection = Math.floor(Math.random() * 4);
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Testing ${eye === 'OD' ? 'Right Eye (cover LEFT)' : eye === 'OS' ? 'Left Eye (cover RIGHT)' : 'Both Eyes'}</h3>
            <p class="test-instructions">Look at the shape below and select its orientation:</p>
            
            <div class="optotype-container">
                ${!isCalibrated ? '<p style="color: var(--color-warning); font-size: 0.9rem; margin-bottom: 1rem;">⚠ Level-based mode - results approximate</p>' : ''}
                <div class="optotype" id="optotype-display" style="font-size: ${finalSizePx}px;">
                    ${optotypeDirections[currentOptotypeDirection]}
                </div>
            </div>
            
            <div class="optotype-controls">
                <button class="optotype-btn" onclick="answerOptotype('Up')" aria-label="Up">↑ Up</button>
                <button class="optotype-btn" onclick="answerOptotype('Down')" aria-label="Down">↓ Down</button>
                <button class="optotype-btn" onclick="answerOptotype('Left')" aria-label="Left">← Left</button>
                <button class="optotype-btn" onclick="answerOptotype('Right')" aria-label="Right">→ Right</button>
            </div>
            
            <div style="margin-top: 2rem; text-align: center;">
                <button class="btn btn-link" onclick="skipCurrentEye()">Not sure / Unable to see</button>
            </div>
        </div>
    `;
    
    // Keyboard support
    if (optotypeKeyboardHandler) {
        document.removeEventListener('keydown', optotypeKeyboardHandler);
    }
    optotypeKeyboardHandler = handleOptotypeKeyboard;
    document.addEventListener('keydown', optotypeKeyboardHandler);
}

function handleOptotypeKeyboard(e) {
    if (state.currentScreen !== 'test-flow' || state.currentTest !== 'distance-va') return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '');
        answerOptotype(direction);
    }
}

function answerOptotype(answer) {
    const eye = state.testData.currentEye;
    const eyeResult = state.testData.eyeResults[eye];
    const correct = directionNames[currentOptotypeDirection] === answer;
    
    eyeResult.trials.push({ level: currentOptotypeLevel, correct });
    
    if (correct) {
        eyeResult.correct++;
        currentOptotypeLevel = Math.max(1, currentOptotypeLevel - 1);
    } else {
        eyeResult.incorrect++;
        if (eyeResult.incorrect >= 2 || currentOptotypeLevel >= 10) {
            // Test complete for this eye
            eyeResult.finalLevel = currentOptotypeLevel;
            finishEyeTest();
            return;
        }
        currentOptotypeLevel = Math.min(10, currentOptotypeLevel + 1);
    }
    
    // Continue with next optotype
    if (eyeResult.trials.length >= 15) {
        eyeResult.finalLevel = currentOptotypeLevel;
        finishEyeTest();
    } else {
        renderDistanceVATestInterface();
    }
}

function skipCurrentEye() {
    const eye = state.testData.currentEye;
    const eyeResult = state.testData.eyeResults[eye];
    eyeResult.finalLevel = null;
    eyeResult.skipped = true;
    finishEyeTest();
}

function finishEyeTest() {
    // Remove keyboard handler
    if (optotypeKeyboardHandler) {
        document.removeEventListener('keydown', optotypeKeyboardHandler);
        optotypeKeyboardHandler = null;
    }
    
    const eyes = ['OD', 'OS', 'OU'];
    const currentIndex = eyes.indexOf(state.testData.currentEye);
    
    if (currentIndex < eyes.length - 1) {
        // Test next eye
        state.testData.currentEye = eyes[currentIndex + 1];
        state.testData.eyeResults[state.testData.currentEye] = {
            level: 10,
            correct: 0,
            incorrect: 0,
            trials: []
        };
        currentOptotypeLevel = 10;
        state.testStep = 3; // Back to eye select
        renderTestFlow();
    } else {
        // All eyes tested, go to review
        state.testStep = 5;
        renderTestFlow();
    }
}

function renderDistanceVAReview() {
    const content = document.getElementById('test-content');
    const results = state.testData.eyeResults;
    
    let html = '<div class="test-section"><h3>Test Results</h3>';
    
    Object.keys(results).forEach(eye => {
        const result = results[eye];
        const eyeName = eye === 'OD' ? 'Right Eye' : eye === 'OS' ? 'Left Eye' : 'Both Eyes';
        html += `<p><strong>${eyeName}:</strong> `;
        if (result.skipped) {
            html += 'Test skipped or unable to complete.</p>';
        } else {
            html += `Level ${result.finalLevel || currentOptotypeLevel} (approximate)</p>`;
        }
    });
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
            <button class="btn btn-secondary" onclick="state.testStep = 1; renderTestFlow()">Restart Test</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Near Vision Test
function renderNearVisionTest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This test screens reading ability at close distances.' },
        { type: 'setup', text: 'Setup instructions' },
        { type: 'distance-select', text: 'Select reading distance' },
        { type: 'test', text: 'Test in progress' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'setup') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Setup Instructions</h3>
                <div class="test-instructions">
                    <p>Hold your device or sit at your chosen reading distance.</p>
                    <p>Ensure good lighting without glare.</p>
                </div>
                <button class="btn btn-primary" onclick="advanceTestStep()">Start Test</button>
            </div>
        `;
    } else if (step.type === 'distance-select') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Select Reading Distance</h3>
                <p>How far will you hold the reading material?</p>
                <div class="questionnaire-options">
                    <button class="btn btn-secondary questionnaire-option" onclick="selectReadingDistance(30)">30 cm (12 in)</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="selectReadingDistance(40)">40 cm (16 in)</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="selectReadingDistance(50)">50 cm (20 in)</button>
                </div>
            </div>
        `;
    } else if (step.type === 'test') {
        renderNearVisionTestInterface();
    } else if (step.type === 'review') {
        renderNearVisionReview();
    }
}

function selectReadingDistance(cm) {
    state.testData.readingDistance = cm;
    state.testData.currentSize = 5; // Start with larger text
    advanceTestStep();
}

const readingSizes = [
    { level: 1, size: 48, label: 'Very Large' },
    { level: 2, size: 36, label: 'Large' },
    { level: 3, size: 28, label: 'Medium-Large' },
    { level: 4, size: 24, label: 'Medium' },
    { level: 5, size: 20, label: 'Small' },
    { level: 6, size: 16, label: 'Very Small' },
    { level: 7, size: 14, label: 'Extra Small' }
];

const readingText = "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for testing readability.";

function renderNearVisionTestInterface() {
    const content = document.getElementById('test-content');
    const sizeInfo = readingSizes[state.testData.currentSize - 1] || readingSizes[4];
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Reading Test</h3>
            <p>Can you read this text comfortably?</p>
            <p style="font-size: 0.9rem; color: var(--color-text-light);">Size: ${sizeInfo.label} (Level ${sizeInfo.level})</p>
            
            <div class="reading-text" style="font-size: ${sizeInfo.size}px;">
                ${readingText}
            </div>
            
            <div class="reading-controls">
                <button class="btn btn-primary" onclick="answerReading(true)">Readable</button>
                <button class="btn btn-secondary" onclick="answerReading(false)">Not Readable</button>
            </div>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-link" onclick="skipReadingTest()">Skip Test</button>
            </div>
        </div>
    `;
}

function answerReading(readable) {
    if (readable) {
        // Try smaller size
        if (state.testData.currentSize < readingSizes.length) {
            state.testData.currentSize++;
            renderNearVisionTestInterface();
        } else {
            // Reached smallest, record result
            state.testData.finalSize = state.testData.currentSize;
            state.testStep = 4;
            renderTestFlow();
        }
    } else {
        // Record previous size as best
        state.testData.finalSize = Math.max(1, state.testData.currentSize - 1);
        state.testStep = 4;
        renderTestFlow();
    }
}

function skipReadingTest() {
    state.testData.finalSize = null;
    state.testData.skipped = true;
    state.testStep = 4;
    renderTestFlow();
}

function renderNearVisionReview() {
    const content = document.getElementById('test-content');
    const result = state.testData;
    
    let html = '<div class="test-section"><h3>Test Results</h3>';
    if (result.skipped) {
        html += '<p>Test was skipped.</p>';
    } else {
        const sizeInfo = readingSizes[result.finalSize - 1] || readingSizes[4];
        html += `<p><strong>Best readable size:</strong> ${sizeInfo.label} (Level ${result.finalSize})</p>`;
        html += `<p><strong>Reading distance:</strong> ${result.readingDistance} cm</p>`;
    }
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Amsler Grid Test
function renderAmslerTest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This test helps identify distortion or missing areas in central vision.' },
        { type: 'setup', text: 'Setup instructions' },
        { type: 'test', text: 'Test in progress' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'setup') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Setup Instructions</h3>
                <div class="test-instructions">
                    <p>Cover one eye at a time. Look at the central dot and report what you see.</p>
                    <p>Do the lines look straight, wavy, or are there missing areas?</p>
                </div>
                <button class="btn btn-primary" onclick="advanceTestStep()">Start Test</button>
            </div>
        `;
    } else if (step.type === 'test') {
        renderAmslerTestInterface();
    } else if (step.type === 'review') {
        renderAmslerReview();
    }
}

let amslerCanvas = null;
let amslerCtx = null;
let isMarking = false;
let markedPoints = [];

function renderAmslerTestInterface() {
    const content = document.getElementById('test-content');
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Amsler Grid Test</h3>
            <p>Look at the central dot. What do you see?</p>
            
            <div class="amsler-container">
                <div class="amsler-canvas-wrapper">
                    <canvas id="amsler-canvas" width="400" height="400"></canvas>
                </div>
                
                <div class="amsler-controls">
                    <button class="btn btn-secondary amsler-btn" onclick="setAmslerResult('straight')">Lines look straight</button>
                    <button class="btn btn-secondary amsler-btn" onclick="setAmslerResult('wavy')">Some lines wavy</button>
                    <button class="btn btn-secondary amsler-btn" onclick="setAmslerResult('missing')">Missing/blurred area</button>
                    <button class="btn btn-link" onclick="toggleAmslerMarking()" id="toggle-marking-btn">Enable marking tool</button>
                </div>
                
                <p class="amsler-marking-info" id="marking-info" style="display: none;">Click or tap on the grid to mark areas of concern.</p>
            </div>
        </div>
    `;
    
    initAmslerCanvas();
}

function initAmslerCanvas() {
    amslerCanvas = document.getElementById('amsler-canvas');
    if (!amslerCanvas) return;
    
    amslerCtx = amslerCanvas.getContext('2d');
    markedPoints = state.testData.markedPoints || [];
    
    drawAmslerGrid();
    
    amslerCanvas.addEventListener('mousedown', handleAmslerMark);
    amslerCanvas.addEventListener('mousemove', handleAmslerMarkMove);
    amslerCanvas.addEventListener('touchstart', handleAmslerMark, { passive: false });
    amslerCanvas.addEventListener('touchmove', handleAmslerMarkMove, { passive: false });
}

function drawAmslerGrid() {
    if (!amslerCtx) return;
    
    const size = 400;
    const gridSize = 20;
    
    // Clear canvas
    amslerCtx.clearRect(0, 0, size, size);
    amslerCtx.fillStyle = '#ffffff';
    amslerCtx.fillRect(0, 0, size, size);
    
    // Draw grid
    amslerCtx.strokeStyle = '#000000';
    amslerCtx.lineWidth = 1;
    
    for (let i = 0; i <= gridSize; i++) {
        const pos = (size / gridSize) * i;
        // Horizontal lines
        amslerCtx.beginPath();
        amslerCtx.moveTo(0, pos);
        amslerCtx.lineTo(size, pos);
        amslerCtx.stroke();
        // Vertical lines
        amslerCtx.beginPath();
        amslerCtx.moveTo(pos, 0);
        amslerCtx.lineTo(pos, size);
        amslerCtx.stroke();
    }
    
    // Draw central dot
    amslerCtx.fillStyle = '#000000';
    amslerCtx.beginPath();
    amslerCtx.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
    amslerCtx.fill();
    
    // Draw marked points
    markedPoints.forEach(point => {
        amslerCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        amslerCtx.beginPath();
        amslerCtx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        amslerCtx.fill();
    });
}

function toggleAmslerMarking() {
    isMarking = !isMarking;
    const btn = document.getElementById('toggle-marking-btn');
    const info = document.getElementById('marking-info');
    if (btn && info) {
        btn.textContent = isMarking ? 'Disable marking tool' : 'Enable marking tool';
        info.style.display = isMarking ? 'block' : 'none';
    }
}

function handleAmslerMark(e) {
    if (!isMarking) return;
    e.preventDefault();
    const rect = amslerCanvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    markedPoints.push({ x, y });
    state.testData.markedPoints = markedPoints;
    drawAmslerGrid();
}

function handleAmslerMarkMove(e) {
    if (!isMarking) return;
    e.preventDefault();
    handleAmslerMark(e);
}

function setAmslerResult(result) {
    state.testData.result = result;
    state.testStep = 3;
    renderTestFlow();
}

function renderAmslerReview() {
    const content = document.getElementById('test-content');
    const result = state.testData;
    
    let html = '<div class="test-section"><h3>Test Results</h3>';
    html += `<p><strong>Result:</strong> `;
    if (result.result === 'straight') {
        html += 'Lines appeared straight</p>';
    } else if (result.result === 'wavy') {
        html += 'Some lines appeared wavy</p>';
    } else if (result.result === 'missing') {
        html += 'Missing or blurred areas reported</p>';
    }
    
    if (result.markedPoints && result.markedPoints.length > 0) {
        html += `<p><strong>Marked areas:</strong> ${result.markedPoints.length} point(s) marked</p>`;
    }
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Contrast Sensitivity Test
function renderContrastTest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This test screens ability to see low contrast targets.' },
        { type: 'setup', text: 'Setup instructions' },
        { type: 'test', text: 'Test in progress' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'setup') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Setup Instructions</h3>
                <div class="test-instructions">
                    <p>Ensure adequate lighting. Look at the target and select which option matches.</p>
                </div>
                <button class="btn btn-primary" onclick="advanceTestStep()">Start Test</button>
            </div>
        `;
    } else if (step.type === 'test') {
        if (!state.testData.currentLevel) {
            state.testData.currentLevel = 5; // Start at middle contrast
        }
        renderContrastTestInterface();
    } else if (step.type === 'review') {
        renderContrastReview();
    }
}

const contrastLevels = [
    { level: 1, contrast: 0.95, label: 'Very High' },
    { level: 2, contrast: 0.85, label: 'High' },
    { level: 3, contrast: 0.70, label: 'Medium-High' },
    { level: 4, contrast: 0.55, label: 'Medium' },
    { level: 5, contrast: 0.40, label: 'Medium-Low' },
    { level: 6, contrast: 0.25, label: 'Low' },
    { level: 7, contrast: 0.15, label: 'Very Low' }
];

function renderContrastTestInterface() {
    const content = document.getElementById('test-content');
    const levelInfo = contrastLevels[state.testData.currentLevel - 1] || contrastLevels[4];
    const correctAnswer = Math.floor(Math.random() * 4) + 1;
    state.testData.currentCorrect = correctAnswer;
    
    const bgColor = 128; // Mid-gray
    const textColor = bgColor + (255 - bgColor) * levelInfo.contrast;
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Contrast Sensitivity Test</h3>
            <p>Which number matches the target? (Level ${state.testData.currentLevel})</p>
            
            <div class="contrast-container">
                <div class="contrast-target" style="background-color: rgb(${bgColor}, ${bgColor}, ${bgColor}); color: rgb(${textColor}, ${textColor}, ${textColor});">
                    ${correctAnswer}
                </div>
                
                <div class="contrast-options">
                    <button class="btn btn-secondary contrast-option" onclick="answerContrast(1)">1</button>
                    <button class="btn btn-secondary contrast-option" onclick="answerContrast(2)">2</button>
                    <button class="btn btn-secondary contrast-option" onclick="answerContrast(3)">3</button>
                    <button class="btn btn-secondary contrast-option" onclick="answerContrast(4)">4</button>
                </div>
            </div>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-link" onclick="skipContrastTest()">I can't do this test</button>
            </div>
        </div>
    `;
}

function answerContrast(answer) {
    const correct = answer === state.testData.currentCorrect;
    state.testData.trials = state.testData.trials || [];
    state.testData.trials.push({ level: state.testData.currentLevel, correct });
    
    if (correct) {
        // Try lower contrast
        if (state.testData.currentLevel < contrastLevels.length) {
            state.testData.currentLevel++;
            renderContrastTestInterface();
        } else {
            // Reached lowest, record result
            state.testData.finalLevel = state.testData.currentLevel;
            state.testStep = 3;
            renderTestFlow();
        }
    } else {
        // Record previous level as best
        state.testData.finalLevel = Math.max(1, state.testData.currentLevel - 1);
        state.testStep = 3;
        renderTestFlow();
    }
    
    // Stop after 10 trials
    if (state.testData.trials.length >= 10) {
        state.testData.finalLevel = state.testData.currentLevel;
        state.testStep = 3;
        renderTestFlow();
    }
}

function skipContrastTest() {
    state.testData.finalLevel = null;
    state.testData.skipped = true;
    state.testStep = 3;
    renderTestFlow();
}

function renderContrastReview() {
    const content = document.getElementById('test-content');
    const result = state.testData;
    
    let html = '<div class="test-section"><h3>Test Results</h3>';
    if (result.skipped) {
        html += '<p>Test was skipped.</p>';
    } else {
        const levelInfo = contrastLevels[result.finalLevel - 1] || contrastLevels[4];
        html += `<p><strong>Best contrast level achieved:</strong> Level ${result.finalLevel} (${levelInfo.label} contrast)</p>`;
    }
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Glare Sensitivity Test
function renderGlareTest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This test screens sensitivity to glare and bright light.' },
        { type: 'setup', text: 'Setup instructions' },
        { type: 'test', text: 'Test in progress' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'setup') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Setup Instructions</h3>
                <div class="test-instructions">
                    <p>Adjust the glare intensity slider to match your real-world discomfort level.</p>
                    <p>Report whether the target remains readable.</p>
                </div>
                <button class="btn btn-primary" onclick="advanceTestStep()">Start Test</button>
            </div>
        `;
    } else if (step.type === 'test') {
        if (state.testData.glareLevel === undefined) {
            state.testData.glareLevel = 5;
        }
        renderGlareTestInterface();
    } else if (step.type === 'review') {
        renderGlareReview();
    }
}

function renderGlareTestInterface() {
    const content = document.getElementById('test-content');
    const glareIntensity = state.testData.glareLevel / 10;
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Glare Sensitivity Test</h3>
            <p>Adjust the glare intensity and report your experience:</p>
            
            <div class="glare-container">
                <div class="glare-target" style="position: relative; background-color: #f0f0f0; color: #000;">
                    <span style="font-size: 48px;">A</span>
                    <div class="glare-overlay" style="opacity: ${glareIntensity};"></div>
                </div>
                
                <div class="glare-slider-container">
                    <div class="glare-slider-label">
                        <span>Glare Intensity</span>
                        <span>${state.testData.glareLevel}/10</span>
                    </div>
                    <input type="range" min="0" max="10" value="${state.testData.glareLevel}" 
                           class="glare-slider" id="glare-slider" 
                           oninput="updateGlareLevel(this.value)">
                </div>
                
                <div class="questionnaire-options">
                    <button class="btn btn-secondary questionnaire-option" onclick="answerGlare('comfortable')">Comfortable</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="answerGlare('uncomfortable')">Uncomfortable</button>
                    <button class="btn btn-secondary questionnaire-option" onclick="answerGlare('unreadable')">Target Unreadable</button>
                </div>
            </div>
        </div>
    `;
}

function updateGlareLevel(value) {
    state.testData.glareLevel = parseInt(value);
    const overlay = document.querySelector('.glare-overlay');
    if (overlay) {
        overlay.style.opacity = value / 10;
    }
    const label = document.querySelector('.glare-slider-label span:last-child');
    if (label) {
        label.textContent = `${value}/10`;
    }
}

function answerGlare(answer) {
    state.testData.result = answer;
    state.testData.tolerance = state.testData.glareLevel;
    state.testStep = 3;
    renderTestFlow();
}

function renderGlareReview() {
    const content = document.getElementById('test-content');
    const result = state.testData;
    
    let html = '<div class="test-section"><h3>Test Results</h3>';
    html += `<p><strong>Glare tolerance level:</strong> ${result.tolerance}/10</p>`;
    html += `<p><strong>Response:</strong> `;
    if (result.result === 'comfortable') {
        html += 'Comfortable at this glare level</p>';
    } else if (result.result === 'uncomfortable') {
        html += 'Uncomfortable but readable</p>';
    } else {
        html += 'Target became unreadable</p>';
    }
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Color Vision Test
function renderColorTest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This test screens basic color discrimination ability.' },
        { type: 'setup', text: 'Setup instructions' },
        { type: 'test', text: 'Test in progress' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'setup') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Setup Instructions</h3>
                <div class="test-instructions">
                    <p>Look at the grid of colored dots. Tap the one that looks different from the others.</p>
                </div>
                <button class="btn btn-primary" onclick="advanceTestStep()">Start Test</button>
            </div>
        `;
    } else if (step.type === 'test') {
        if (!state.testData.trials) {
            state.testData.trials = [];
            state.testData.currentTrial = 0;
        }
        renderColorTestInterface();
    } else if (step.type === 'review') {
        renderColorReview();
    }
}

function renderColorTestInterface() {
    const content = document.getElementById('test-content');
    const trialNum = state.testData.currentTrial + 1;
    const totalTrials = 5;
    
    if (trialNum > totalTrials) {
        state.testStep = 3;
        renderTestFlow();
        return;
    }
    
    // Generate color grid with one different dot
    const baseColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
    const differentIndex = Math.floor(Math.random() * 25);
    const difficulty = Math.min(trialNum, 3); // Increase difficulty
    const colorShift = 30 - (difficulty * 8); // Smaller shift = harder
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Color Vision Test</h3>
            <p>Trial ${trialNum} of ${totalTrials}: Tap the dot that looks different</p>
            
            <div class="color-grid-container">
                <div class="color-grid" id="color-grid"></div>
            </div>
        </div>
    `;
    
    const grid = document.getElementById('color-grid');
    for (let i = 0; i < 25; i++) {
        const dot = document.createElement('div');
        dot.className = 'color-dot';
        
        if (i === differentIndex) {
            // Slightly different color
            const baseHue = parseInt(baseColor.match(/\d+/)[0]);
            const differentHue = (baseHue + colorShift) % 360;
            dot.style.backgroundColor = `hsl(${differentHue}, 70%, 50%)`;
            dot.dataset.correct = 'true';
        } else {
            dot.style.backgroundColor = baseColor;
        }
        
        dot.addEventListener('click', () => answerColor(i === differentIndex));
        grid.appendChild(dot);
    }
    
    state.testData.currentCorrectIndex = differentIndex;
}

function answerColor(correct) {
    state.testData.trials.push({ correct });
    state.testData.currentTrial++;
    renderColorTestInterface();
}

function renderColorReview() {
    const content = document.getElementById('test-content');
    const trials = state.testData.trials || [];
    const correct = trials.filter(t => t.correct).length;
    const total = trials.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let html = '<div class="test-section"><h3>Test Results</h3>';
    html += `<p><strong>Score:</strong> ${correct} out of ${total} correct (${score}%)</p>`;
    
    if (score < 60) {
        html += '<p class="result-interpretation">Possible color discrimination difficulty detected. This is a screening result only.</p>';
    } else {
        html += '<p class="result-interpretation">No significant color discrimination issues detected in this screening.</p>';
    }
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Functional Vision Questionnaire
const questionnaireItems = [
    { id: 'phone', text: 'Reading text on a phone', category: 'Reading' },
    { id: 'medication', text: 'Reading medication labels', category: 'Reading' },
    { id: 'faces', text: 'Recognizing faces at a distance', category: 'Mobility' },
    { id: 'stairs', text: 'Seeing stairs and curbs clearly', category: 'Mobility' },
    { id: 'glare-outdoor', text: 'Dealing with glare outdoors', category: 'Glare' },
    { id: 'night-driving', text: 'Driving at night (if applicable)', category: 'Mobility' },
    { id: 'tv', text: 'Watching television', category: 'Reading' },
    { id: 'navigation', text: 'Navigating in unfamiliar places', category: 'Mobility' },
    { id: 'reading-small', text: 'Reading small print', category: 'Reading' },
    { id: 'contrast-real', text: 'Seeing objects in low contrast (e.g., gray on gray)', category: 'Glare' }
];

function renderQuestionnaireTest() {
    const content = document.getElementById('test-content');
    const steps = [
        { type: 'purpose', text: 'This questionnaire screens how vision affects daily activities.' },
        { type: 'test', text: 'Answer questions' },
        { type: 'review', text: 'Review results' }
    ];
    
    const step = steps[state.testStep] || steps[0];
    
    if (step.type === 'purpose') {
        content.innerHTML = `
            <div class="test-section">
                <h3>Purpose</h3>
                <p>${step.text}</p>
                <button class="btn btn-primary" onclick="advanceTestStep()">Continue</button>
            </div>
        `;
    } else if (step.type === 'test') {
        renderQuestionnaireInterface();
    } else if (step.type === 'review') {
        renderQuestionnaireReview();
    }
}

function renderQuestionnaireInterface() {
    const content = document.getElementById('test-content');
    const currentIndex = state.testData.currentIndex || 0;
    
    if (currentIndex >= questionnaireItems.length) {
        state.testStep = 2;
        renderTestFlow();
        return;
    }
    
    const item = questionnaireItems[currentIndex];
    const answers = ['Never', 'Sometimes', 'Often', 'Always'];
    
    content.innerHTML = `
        <div class="test-section">
            <h3>Functional Vision Questionnaire</h3>
            <p>Question ${currentIndex + 1} of ${questionnaireItems.length}</p>
            
            <div class="questionnaire-item">
                <h4>How often do you have difficulty with: ${item.text}?</h4>
                <div class="questionnaire-options">
                    ${answers.map((ans, i) => `
                        <button class="btn btn-secondary questionnaire-option" 
                                onclick="answerQuestionnaire(${i})">
                            ${ans}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function answerQuestionnaire(answerIndex) {
    const currentIndex = state.testData.currentIndex || 0;
    const item = questionnaireItems[currentIndex];
    
    state.testData.answers = state.testData.answers || {};
    state.testData.answers[item.id] = answerIndex;
    
    state.testData.currentIndex = currentIndex + 1;
    renderQuestionnaireInterface();
}

function renderQuestionnaireReview() {
    const content = document.getElementById('test-content');
    const answers = state.testData.answers || {};
    
    // Calculate scores by category
    const categories = {
        Reading: 0,
        Mobility: 0,
        Glare: 0
    };
    let totalScore = 0;
    let totalQuestions = 0;
    
    questionnaireItems.forEach(item => {
        if (answers[item.id] !== undefined) {
            const score = answers[item.id]; // 0-3 scale
            categories[item.category] += score;
            totalScore += score;
            totalQuestions++;
        }
    });
    
    const avgScore = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(1) : 0;
    
    let html = '<div class="test-section"><h3>Questionnaire Results</h3>';
    html += `<p><strong>Overall Score:</strong> ${avgScore}/3.0 (higher = more difficulty)</p>`;
    html += '<p><strong>Category Scores:</strong></p><ul>';
    Object.keys(categories).forEach(cat => {
        const count = questionnaireItems.filter(i => i.category === cat).length;
        const avg = count > 0 ? (categories[cat] / count).toFixed(1) : 0;
        html += `<li><strong>${cat}:</strong> ${avg}/3.0</li>`;
    });
    html += '</ul>';
    
    html += `
        <div style="margin-top: 2rem;">
            <button class="btn btn-primary" onclick="completeTest()">Save Results</button>
        </div>
    </div>`;
    
    content.innerHTML = html;
}

// Test Navigation
function advanceTestStep(step = 1) {
    state.testStep += step;
    renderTestFlow();
}

function completeTest() {
    if (!state.currentTest) return;
    
    // Save test results
    state.testResults[state.currentTest] = { ...state.testData };
    
    // Mark test as completed
    const test = state.testMenu.find(t => t.id === state.currentTest);
    if (test) {
        test.completed = true;
    }
    
    // Return to test menu
    state.currentTest = null;
    state.testStep = 0;
    state.testData = {};
    setScreen('test-menu');
}

// Results Screen
function renderResults() {
    const content = document.getElementById('results-content');
    const dateEl = document.getElementById('results-date');
    const calStatusEl = document.getElementById('results-calibration-status');
    
    if (dateEl) {
        const date = new Date();
        dateEl.textContent = `Screening Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    }
    
    if (calStatusEl) {
        if (state.calibration.completed && state.calibration.method === 'device_inches') {
            let statusText = `✓ Device-based calibration (${state.calibration.deviceType}, ${state.calibration.diagonalInches}")`;
            if (state.calibration.pxPerMM) {
                statusText += ` - ${state.calibration.pxPerMM.toFixed(2)} px/mm`;
            }
            if (state.calibration.zoomChanged) {
                statusText += ' ⚠ Zoom may have changed';
            }
            calStatusEl.textContent = statusText;
            calStatusEl.style.color = 'var(--color-success)';
        } else if (state.calibration.method === 'none' || state.calibration.skipped) {
            calStatusEl.textContent = 'Level-based mode (uncalibrated - approximate)';
            calStatusEl.style.color = 'var(--color-warning)';
        } else {
            calStatusEl.textContent = '⚠ Not calibrated (results approximate)';
            calStatusEl.style.color = 'var(--color-warning)';
        }
    }
    
    if (!content) return;
    
    let html = '';
    
    Object.keys(state.testResults).forEach(testId => {
        const test = state.testMenu.find(t => t.id === testId);
        const result = state.testResults[testId];
        
        if (!test || !result) return;
        
        html += `<div class="result-item">`;
        html += `<h3>${test.name}</h3>`;
        
        // Format result based on test type
        if (testId === 'distance-va') {
            html += formatDistanceVAResult(result);
        } else if (testId === 'near-vision') {
            html += formatNearVisionResult(result);
        } else if (testId === 'amsler') {
            html += formatAmslerResult(result);
        } else if (testId === 'contrast') {
            html += formatContrastResult(result);
        } else if (testId === 'glare') {
            html += formatGlareResult(result);
        } else if (testId === 'color') {
            html += formatColorResult(result);
        } else if (testId === 'questionnaire') {
            html += formatQuestionnaireResult(result);
        }
        
        html += `</div>`;
    });
    
    if (html === '') {
        html = '<p>No test results available. Please complete at least one test.</p>';
    }
    
    content.innerHTML = html;
}

function formatDistanceVAResult(result) {
    let html = '';
    const isCalibrated = state.calibration.completed && state.calibration.pxPerMM;
    const modeLabel = isCalibrated ? ' (Device-calibrated, approx.)' : ' (Level-based, approx.)';
    
    if (result.eyeResults) {
        Object.keys(result.eyeResults).forEach(eye => {
            const eyeResult = result.eyeResults[eye];
            const eyeName = eye === 'OD' ? 'Right Eye' : eye === 'OS' ? 'Left Eye' : 'Both Eyes';
            if (eyeResult.skipped) {
                html += `<p class="result-value">${eyeName}: Test skipped</p>`;
            } else {
                html += `<p class="result-value">${eyeName}: Level ${eyeResult.finalLevel || 'N/A'}${modeLabel}</p>`;
            }
        });
    }
    html += '<p class="result-interpretation">This is an approximate screening result. Professional assessment recommended.</p>';
    if (!isCalibrated) {
        html += '<p class="result-interpretation"><strong>Note:</strong> Level-based mode used (uncalibrated).</p>';
    }
    return html;
}

function formatNearVisionResult(result) {
    let html = '';
    const isCalibrated = state.calibration.completed && state.calibration.pxPerMM;
    const modeLabel = isCalibrated ? ' (Device-calibrated, approx.)' : ' (Level-based, approx.)';
    
    if (result.skipped) {
        html += '<p class="result-value">Test skipped</p>';
    } else {
        const sizeInfo = readingSizes[result.finalSize - 1] || readingSizes[4];
        html += `<p class="result-value">Best readable: ${sizeInfo.label} at ${result.readingDistance} cm${modeLabel}</p>`;
    }
    html += '<p class="result-interpretation">Reading ability varies with lighting and print quality.</p>';
    if (!isCalibrated) {
        html += '<p class="result-interpretation"><strong>Note:</strong> Level-based mode used (uncalibrated).</p>';
    }
    return html;
}

function formatAmslerResult(result) {
    let html = '';
    if (result.result === 'straight') {
        html += '<p class="result-value">Lines appeared straight</p>';
    } else if (result.result === 'wavy') {
        html += '<p class="result-value">Some lines appeared wavy</p>';
        html += '<p class="result-interpretation">Wavy lines may indicate macular issues. Consider professional evaluation.</p>';
    } else if (result.result === 'missing') {
        html += '<p class="result-value">Missing or blurred areas reported</p>';
        html += '<p class="result-interpretation">Missing areas warrant professional evaluation, especially if sudden onset.</p>';
    }
    return html;
}

function formatContrastResult(result) {
    let html = '';
    if (result.skipped) {
        html += '<p class="result-value">Test skipped</p>';
    } else {
        const levelInfo = contrastLevels[result.finalLevel - 1] || contrastLevels[4];
        html += `<p class="result-value">Best contrast level: ${levelInfo.label} (Level ${result.finalLevel})</p>`;
    }
    html += '<p class="result-interpretation">Contrast sensitivity affects ability to see in various lighting conditions.</p>';
    return html;
}

function formatGlareResult(result) {
    let html = `<p class="result-value">Glare tolerance: ${result.tolerance}/10</p>`;
    html += `<p>Response: ${result.result === 'comfortable' ? 'Comfortable' : result.result === 'uncomfortable' ? 'Uncomfortable but readable' : 'Target unreadable'}</p>`;
    html += '<p class="result-interpretation">Glare sensitivity can affect daily activities, especially driving.</p>';
    return html;
}

function formatColorResult(result) {
    const trials = result.trials || [];
    const correct = trials.filter(t => t.correct).length;
    const total = trials.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    let html = `<p class="result-value">Score: ${correct}/${total} (${score}%)</p>`;
    if (score < 60) {
        html += '<p class="result-interpretation">Possible color discrimination difficulty detected. Professional color vision testing recommended.</p>';
    } else {
        html += '<p class="result-interpretation">No significant color discrimination issues detected in this screening.</p>';
    }
    return html;
}

function formatQuestionnaireResult(result) {
    const answers = result.answers || {};
    const categories = { Reading: 0, Mobility: 0, Glare: 0 };
    let totalScore = 0;
    let totalQuestions = 0;
    
    questionnaireItems.forEach(item => {
        if (answers[item.id] !== undefined) {
            const score = answers[item.id];
            categories[item.category] += score;
            totalScore += score;
            totalQuestions++;
        }
    });
    
    const avgScore = totalQuestions > 0 ? (totalScore / totalQuestions).toFixed(1) : 0;
    
    let html = `<p class="result-value">Overall Score: ${avgScore}/3.0</p>`;
    html += '<p>Category Scores: ';
    Object.keys(categories).forEach(cat => {
        const count = questionnaireItems.filter(i => i.category === cat).length;
        const avg = count > 0 ? (categories[cat] / count).toFixed(1) : 0;
        html += `${cat}: ${avg}/3.0; `;
    });
    html += '</p>';
    html += '<p class="result-interpretation">Higher scores indicate more difficulty with daily vision-related activities.</p>';
    return html;
}

// Export Functions
function copyResults() {
    const date = new Date();
    let text = `Vision Screening PRO - Results\n`;
    text += `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
    
    // Calibration info
    if (state.calibration.completed && state.calibration.method === 'device_inches') {
        text += `Calibration: Device-based (${state.calibration.deviceType}, ${state.calibration.diagonalInches}")\n`;
        text += `Calculated: ${state.calibration.pxPerMM ? state.calibration.pxPerMM.toFixed(2) : 'N/A'} px/mm\n`;
        if (state.calibration.zoomChanged) {
            text += `⚠ Warning: Browser zoom may have changed during session\n`;
        }
    } else if (state.calibration.method === 'none' || state.calibration.skipped) {
        text += `Calibration: Level-based mode (uncalibrated)\n`;
    } else {
        text += `Calibration: Not completed (results approximate)\n`;
    }
    text += `\n`;
    
    Object.keys(state.testResults).forEach(testId => {
        const test = state.testMenu.find(t => t.id === testId);
        const result = state.testResults[testId];
        if (!test || !result) return;
        
        text += `${test.name}\n`;
        text += formatResultAsText(testId, result);
        text += '\n';
    });
    
    text += '\n---\n';
    text += 'This is a screening tool only, not a diagnosis.\n';
    text += 'Consider booking a comprehensive eye exam with an eye care professional.\n';
    
    // Try clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Results copied to clipboard!');
        }).catch(() => {
            // Fallback to modal for file:// protocol
            showCopyFallbackModal(text);
        });
    } else {
        // Fallback for browsers without clipboard API (file:// protocol)
        showCopyFallbackModal(text);
    }
}

function showCopyFallbackModal(text) {
    const modal = document.getElementById('copy-fallback-modal');
    const textarea = document.getElementById('copy-textarea');
    const closeBtn = document.getElementById('close-copy-modal');
    const closeBtn2 = document.getElementById('close-copy-modal-btn');
    const selectAllBtn = document.getElementById('select-all-text');
    const overlay = document.getElementById('copy-modal-overlay');
    
    if (!modal || !textarea) return;
    
    textarea.value = text;
    modal.setAttribute('aria-hidden', 'false');
    textarea.focus();
    textarea.select();
    
    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            textarea.select();
            textarea.focus();
        });
    }
    
    // Close on Escape
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function formatResultAsText(testId, result) {
    // Simplified text format for clipboard
    return JSON.stringify(result, null, 2);
}

function exportJSON() {
    const data = {
        timestamp: new Date().toISOString(),
        calibration: state.calibration,
        testResults: state.testResults,
        settings: state.settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-screening-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function restartScreening() {
    if (confirm('Are you sure you want to restart? All progress will be lost.')) {
        // Clear state
        state.testResults = {};
        state.calibration = { completed: false, skipped: false, pxPerMM: null, method: null, deviceType: null, diagonalInches: null, initialDevicePixelRatio: null, timestamp: null };
        state.calibrationStep = 0;
        state.testMenu.forEach(test => test.completed = false);
        state.currentTest = null;
        state.testStep = 0;
        state.testData = {};
        
        // Clear localStorage
        clearLocalStorage();
        
        // Return to welcome
        setScreen('welcome');
    }
}

// Settings Modal
function initSettings() {
    const modal = elements.settingsModal;
    const overlay = document.getElementById('settings-overlay');
    const closeBtn = document.getElementById('close-settings');
    
    // Toggle buttons
    const toggles = {
        'high-contrast-toggle': 'highContrast',
        'large-text-toggle': 'largeText',
        'reduce-motion-toggle': 'reduceMotion',
        'save-progress-toggle': 'saveProgress',
        'caregiver-mode-toggle': 'caregiverMode'
    };
    
    Object.keys(toggles).forEach(toggleId => {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.checked = state.settings[toggles[toggleId]];
            toggle.addEventListener('change', (e) => {
                state.settings[toggles[toggleId]] = e.target.checked;
                applySettings();
                if (state.settings.saveProgress) {
                    saveToLocalStorage();
                }
            });
        }
    });
    
    // Open modal
    elements.settingsBtn.addEventListener('click', () => {
        modal.setAttribute('aria-hidden', 'false');
        // Focus trap
        const firstFocusable = modal.querySelector('input, button');
        if (firstFocusable) firstFocusable.focus();
    });
    
    // Close modal
    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        elements.settingsBtn.focus();
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
    
    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });
}

// Resume Dialog
function showResumeDialog() {
    const dialog = elements.resumeDialog;
    const yesBtn = document.getElementById('resume-yes');
    const noBtn = document.getElementById('resume-no');
    const overlay = document.getElementById('resume-overlay');
    
    dialog.setAttribute('aria-hidden', 'false');
    
    yesBtn.addEventListener('click', () => {
        dialog.setAttribute('aria-hidden', 'true');
        // State already loaded, just continue
    });
    
    noBtn.addEventListener('click', () => {
        clearLocalStorage();
        dialog.setAttribute('aria-hidden', 'true');
    });
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            dialog.setAttribute('aria-hidden', 'true');
        });
    }
}

// Main Render Function
function render() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:2405',message:'render ENTRY',data:{currentScreen:state.currentScreen,calibrationStep:state.calibrationStep},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Hide all screens
    Object.values(elements.screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
    
    // Show current screen
    if (elements.screens[state.currentScreen]) {
        elements.screens[state.currentScreen].classList.add('active');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:2416',message:'Screen activated',data:{screenId:state.currentScreen,hasClass:elements.screens[state.currentScreen].classList.contains('active')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
    }
    
    // Update navigation buttons
    if (elements.backBtn) {
        elements.backBtn.disabled = !canGoBack();
    }
    if (elements.nextBtn) {
        // Show Next button if calibration is completed or skipped
        // OR if user wants to skip during calibration (allow it to work)
        const calibrationInProgress = state.currentScreen === 'calibration' && 
            state.calibrationStep < 5 && 
            !state.calibration.completed && 
            state.calibration.method !== 'none';
        
        if (calibrationInProgress) {
            // During calibration steps, show Next button and make it work (it will skip calibration)
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:2448',message:'Setting Next button state for calibration',data:{calibrationStep:state.calibrationStep,currentScreen:state.currentScreen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            elements.nextBtn.style.display = '';
            elements.nextBtn.disabled = false;
            elements.nextBtn.style.pointerEvents = 'auto';
            elements.nextBtn.style.cursor = 'pointer';
            elements.nextBtn.style.opacity = '1';
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:2455',message:'Next button state AFTER setting',data:{disabled:elements.nextBtn.disabled,display:elements.nextBtn.style.display,pointerEvents:elements.nextBtn.style.pointerEvents},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            console.log('Next button enabled during calibration step', state.calibrationStep);
        } else {
            // Normal Next button behavior
            elements.nextBtn.style.display = '';
            const canGo = canGoNext();
            elements.nextBtn.disabled = !canGo;
            // Ensure button is clickable
            if (canGo) {
                elements.nextBtn.style.pointerEvents = 'auto';
                elements.nextBtn.style.cursor = 'pointer';
                elements.nextBtn.style.opacity = '1';
            } else {
                elements.nextBtn.style.pointerEvents = 'none';
                elements.nextBtn.style.cursor = 'not-allowed';
                elements.nextBtn.style.opacity = '0.5';
            }
        }
    }
    
    // Update progress
    updateProgress();
    
    // Render screen-specific content
    switch (state.currentScreen) {
        case 'calibration':
            // Only initialize calibration if we're actually on that screen
            // Don't reset the step if it's already been set
            if (state.calibrationScreenInitialized !== true) {
                state.calibrationScreenInitialized = true;
            }
            initCalibration();
            break;
        case 'test-menu':
            renderTestMenu();
            break;
        case 'test-flow':
            renderTestFlow();
            break;
        case 'results':
            renderResults();
            break;
    }
}

// Event Listeners
function initEventListeners() {
    // Navigation
    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', handleBack);
    }
    if (elements.nextBtn) {
        // Remove any existing listeners to prevent duplicates
        const newNextBtn = elements.nextBtn.cloneNode(true);
        elements.nextBtn.parentNode.replaceChild(newNextBtn, elements.nextBtn);
        elements.nextBtn = newNextBtn;
        // Add click handler
        elements.nextBtn.addEventListener('click', (e) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/834df13f-dfd4-4b04-85d6-f9a103b57adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app.js:2474',message:'Next button click event',data:{disabled:elements.nextBtn.disabled,currentScreen:state.currentScreen,calibrationStep:state.calibrationStep},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            e.preventDefault();
            e.stopPropagation();
            console.log('Next button clicked');
            handleNext();
            return false;
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && canGoNext() && state.currentScreen !== 'test-flow') {
            handleNext();
        }
    });
    
    // Export buttons
    const copyBtn = document.getElementById('copy-results-btn');
    if (copyBtn) copyBtn.addEventListener('click', copyResults);
    
    const printBtn = document.getElementById('print-results-btn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
    
    const exportBtn = document.getElementById('export-json-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportJSON);
    
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', restartScreening);
}

// Make functions globally accessible for inline handlers
window.advanceTestStep = advanceTestStep;
window.selectDistance = selectDistance;
window.selectEye = selectEye;
window.answerOptotype = answerOptotype;
window.skipCurrentEye = skipCurrentEye;
window.completeTest = completeTest;
window.selectReadingDistance = selectReadingDistance;
window.answerReading = answerReading;
window.skipReadingTest = skipReadingTest;
window.setAmslerResult = setAmslerResult;
window.toggleAmslerMarking = toggleAmslerMarking;
window.answerContrast = answerContrast;
window.skipContrastTest = skipContrastTest;
window.updateGlareLevel = updateGlareLevel;
window.answerGlare = answerGlare;
window.answerColor = answerColor;
window.answerQuestionnaire = answerQuestionnaire;
window.startTest = startTest;
// Calibration handlers
window.selectDeviceType = selectDeviceType;
window.selectScreenSize = selectScreenSize;
window.showCustomSizeInput = showCustomSizeInput;
window.adjustCustomSize = adjustCustomSize;
window.selectCustomScreenSize = selectCustomScreenSize;
window.advanceCalibrationStep = advanceCalibrationStep;
window.showZoomInstructions = showZoomInstructions;
window.useLevelBasedMode = useLevelBasedMode;
window.completeCalibration = completeCalibration;
window.skipCalibration = skipCalibration;

// Initialize App
function init() {
    initElements();
    applySettings();
    initEventListeners();
    initSettings();
    
    // Check for saved session
    if (loadFromLocalStorage() && state.settings.saveProgress) {
        showResumeDialog();
    }
    
    render();
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

