// Application State
const state = {
    device: {
        diagonal: null,
        type: null,
        ppi: null,
        pxPerMM: null
    },
    results: {
        reading: null,
        contrast: null,
        color: null
    }
};

// CORRECT Lighthouse International Continuous Text Cards M-values
// At 40cm (16 inches) viewing distance: M = Snellen_denominator / 50
// Source: Lighthouse International "Continuous Text" Cards for Near Vision
const readingMValues = [
  { m: 8.0, snellen: "20/400" },   // Largest
  { m: 6.3, snellen: "20/320" },
  { m: 5.0, snellen: "20/250" },
  { m: 4.0, snellen: "20/200" },
  { m: 3.2, snellen: "20/160" },
  { m: 2.5, snellen: "20/125" },
  { m: 2.0, snellen: "20/100" },
  { m: 1.6, snellen: "20/80" },
  { m: 1.25, snellen: "20/63" },   // Sometimes shown as 1.3M
  { m: 1.0, snellen: "20/50" },
  { m: 0.8, snellen: "20/40" },
  { m: 0.6, snellen: "20/32" },    // Sometimes shown as 0.63M
  { m: 0.5, snellen: "20/25" },
  { m: 0.4, snellen: "20/20" }      // Smallest - 20/20 vision ✓
];

// Simple, child-appropriate sentences for Lighthouse-style reading chart
// Each sentence approximately same character length, one complete sentence per line
const mnreadSentences = [
  "The cat sat on the mat and looked at the bird.",
  "My dog likes to play with a red ball in the yard.",
  "We went to the park and saw many flowers there.",
  "The sun is bright and warm on a summer day.",
  "I like to read books about animals and nature.",
  "Mom made cookies for us to eat after school.",
  "The fish swim in the blue water of the lake.",
  "My friend has a bike that is green and fast.",
  "We can see stars in the sky at night time.",
  "The tree has leaves that turn red in the fall.",
  "I help my dad wash the car on the weekends.",
  "The bird sings a song early in the morning.",
  "My sister likes to draw pictures with crayons.",
  "We eat lunch at school with all our friends."
];

// CORRECT M-to-Snellen conversion function
function mToSnellen(mValue) {
  // At 40cm: M = Snellen_denominator / 50
  const snellenDenom = Math.round(mValue * 50);
  return `20/${snellenDenom}`;
}

// CORRECT Snellen-to-M conversion
function snellenToM(snellenDenom) {
  // M = denominator / 50 at 40cm
  return snellenDenom / 50;
}

// Calculate font size from M-value (CORRECT formula)
// Lighthouse standard: At 40cm, 1M = 1.454mm x-height
function calculateFontSizeFromM(mValue, pxPerMM, viewingDistanceCm = 40) {
  // Lighthouse standard: At 40cm, 1M = 1.454mm x-height
  const xHeightMm = mValue * 1.454;
  
  // Convert to pixels
  const xHeightPx = xHeightMm * pxPerMM;
  
  // Font size is approximately 1.4x the x-height
  return xHeightPx * 1.4;
}

// Original sentences for Readthechart demo
// Grade 2-3 level, 50-70 characters each
const sentences = [
    "The cat sat on the mat and looked at the bird.",
    "My dog likes to play with a red ball in the yard.",
    "We went to the park and saw many flowers there.",
    "The sun is bright and warm on a summer day.",
    "I like to read books about animals and nature.",
    "Mom made cookies for us to eat after school.",
    "The fish swim in the blue water of the lake.",
    "My friend has a bike that is green and fast.",
    "We can see stars in the sky at night time.",
    "The tree has leaves that turn red in fall.",
    "I help my dad wash the car on weekends.",
    "The bird sings a song early in the morning.",
    "My sister likes to draw pictures with crayons.",
    "We eat lunch at school with all our friends.",
    "The rain makes puddles on the ground outside.",
    "I wear a coat when it is cold in winter.",
    "The bus takes us to school every morning.",
    "My grandma bakes the best cake for birthdays.",
    "The moon shines bright when the sky is dark.",
    "We play games together after we finish homework.",
    "The butterfly has pretty wings with many colors.",
    "I like to jump rope with my friends at recess.",
    "The teacher reads us stories about far away places.",
    "My pet rabbit likes to eat carrots and lettuce.",
    "We plant seeds in the garden and watch them grow.",
    "The ocean is big and blue with lots of fish.",
    "I brush my teeth every morning and every night.",
    "The train goes fast down the track to the city.",
    "My mom helps me learn new words every day.",
    "We see clouds in the sky that look like shapes.",
    "The library has many books for kids to read.",
    "I share my toys with my little brother sometimes.",
    "The snow falls soft and white in the winter.",
    "We sing songs together in music class at school.",
    "The apple is red and sweet and good to eat."
];

// Device setup handlers
function initDeviceSetup() {
    const deviceBtns = document.querySelectorAll('.device-btn');
    let nextBtn = document.getElementById('device-next-btn');
    
    if (!deviceBtns.length || !nextBtn) {
        console.warn('Device setup elements not found');
        return;
    }
    
    // Function to enable next button
    function enableNextButton() {
        nextBtn = document.getElementById('device-next-btn'); // Get fresh reference
        if (!nextBtn) {
            console.error('Next button not found');
            return;
        }
        
        // Remove disabled state completely
        nextBtn.disabled = false;
        nextBtn.removeAttribute('disabled');
        
        // Force enable styles
        nextBtn.style.cursor = 'pointer';
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
        nextBtn.style.backgroundColor = '#27ae60';
        
        // Update classes
        nextBtn.classList.remove('disabled');
        nextBtn.classList.add('enabled');
        
        console.log('Next button enabled:', {
            disabled: nextBtn.disabled,
            disabledAttr: nextBtn.hasAttribute('disabled'),
            cursor: nextBtn.style.cursor,
            pointerEvents: nextBtn.style.pointerEvents,
            classes: nextBtn.className
        });
    }
    
    // Function to handle next button click
    function handleNextButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        nextBtn = document.getElementById('device-next-btn'); // Get fresh reference
        if (!nextBtn) {
            console.error('Next button not found in click handler');
            return false;
        }
        
        console.log('Next button clicked!', {
            disabled: nextBtn.disabled,
            disabledAttr: nextBtn.hasAttribute('disabled'),
            hasEnabledClass: nextBtn.classList.contains('enabled'),
            deviceState: state.device
        });
        
        // Check if button is actually enabled
        if (nextBtn.disabled || nextBtn.hasAttribute('disabled') || !nextBtn.classList.contains('enabled')) {
            console.warn('Next button is disabled - please select a device first');
            alert('Please select a device size first');
            return false;
        }
        
        if (!state.device || !state.device.pxPerMM) {
            console.error('Device not selected or calibrated', state.device);
            alert('Please select a device size first');
            return false;
        }
        
        console.log('Navigating to reading test...');
        console.log('Device state:', state.device);
        
        // Navigate to reading test
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');
        navButtons.forEach(btn => btn.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        
        const readBtn = document.querySelector('.nav-btn[data-section="readthechart"]');
        const readSection = document.getElementById('readthechart');
        if (readBtn && readSection) {
            readBtn.classList.add('active');
            readSection.classList.add('active');
            console.log('Navigated to reading test section');
            // Initialize reading test after a short delay to ensure DOM is ready
            setTimeout(() => {
                if (typeof initReadingTest === 'function') {
                    initReadingTest();
                } else {
                    console.warn('initReadingTest function not found');
                }
            }, 100);
        } else {
            console.error('Reading test section not found', { readBtn, readSection });
        }
        
        return false;
    }
    
    // Set up device button handlers
    deviceBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Device button clicked:', this.dataset.diagonal, this.dataset.type);
            
            // Remove active from all
            deviceBtns.forEach(b => b.classList.remove('active'));
            // Add active to selected
            this.classList.add('active');
            
            // Store device info
            const diagonal = parseFloat(this.dataset.diagonal);
            const type = this.dataset.type;
            
            // Calculate PPI based on screen metrics
            const screenWidth = window.screen.width * (window.devicePixelRatio || 1);
            const screenHeight = window.screen.height * (window.devicePixelRatio || 1);
            const diagonalPx = Math.sqrt(screenWidth ** 2 + screenHeight ** 2);
            const ppi = diagonalPx / diagonal;
            const pxPerMM = ppi / 25.4;
            
            // Store in state
            state.device = {
                diagonal: diagonal,
                type: type,
                ppi: ppi,
                pxPerMM: pxPerMM
            };
            
            console.log(`Device: ${diagonal}" ${type}, PPI: ${ppi.toFixed(1)}, pxPerMM: ${pxPerMM.toFixed(2)}`);
            
            // Enable next button
            enableNextButton();
        });
    });
    
    // Set up next button handler - use both onclick and addEventListener
    if (nextBtn) {
        // Remove any existing handlers first
        nextBtn.onclick = null;
        nextBtn.removeEventListener('click', handleNextButtonClick);
        
        // Add new handlers
        nextBtn.onclick = handleNextButtonClick;
        nextBtn.addEventListener('click', handleNextButtonClick);
        
        // Also handle mousedown and touchstart for better mobile support
        nextBtn.addEventListener('mousedown', function(e) {
            if (!nextBtn.disabled && nextBtn.classList.contains('enabled')) {
                handleNextButtonClick(e);
            }
        });
        
        console.log('Device setup initialized, next button handler attached');
    } else {
        console.error('Next button not found during initialization');
    }
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing...');
    
    // Initialize device setup - try multiple times if needed
    try {
        initDeviceSetup();
    } catch (error) {
        console.error('Error initializing device setup:', error);
    }
    
    // Fallback initialization if elements weren't ready
    setTimeout(() => {
        const nextBtn = document.getElementById('device-next-btn');
        const deviceBtns = document.querySelectorAll('.device-btn');
        
        console.log('Fallback check:', {
            nextBtn: !!nextBtn,
            deviceBtns: deviceBtns.length,
            initialized: nextBtn?.hasAttribute('data-initialized')
        });
        
        if (nextBtn && deviceBtns.length > 0 && !nextBtn.hasAttribute('data-initialized')) {
            console.log('Re-initializing device setup...');
            try {
                initDeviceSetup();
                nextBtn.setAttribute('data-initialized', 'true');
            } catch (error) {
                console.error('Error re-initializing device setup:', error);
            }
        }
    }, 500);
    
    // Set up navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all buttons and sections
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and corresponding section
            this.classList.add('active');
            const section = document.getElementById(targetSection);
            if (section) {
                section.classList.add('active');
                
                // Initialize tests when navigating to them
                if (targetSection === 'readthechart') {
                    initReadingTest();
                } else if (targetSection === 'contrast') {
                    initContrastTest();
                } else if (targetSection === 'ccolor') {
                    initCcolor();
                }
            }
        });
    });
    
    // Initialize tests if on their sections
    if (document.getElementById('readthechart')?.classList.contains('active')) {
        initReadingTest();
    }
    if (document.getElementById('contrast')?.classList.contains('active')) {
        initContrastTest();
    }
    
    // Initialize Ccolor
    initCcolor();
});

// Voice recognition setup
let recognition = null;
let isListening = false;

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        return true;
    }
    return false;
}

// Initialize Reading Test
function initReadingTest() {
    const container = document.getElementById('reading-container');
    if (!container) return;
    
    const hasMic = initSpeechRecognition();
    
    if (!state.device.pxPerMM) {
        container.innerHTML = '<div class="error" style="padding: 20px; background: #ffebee; border: 2px solid #f44336; border-radius: 5px; color: #c62828;"><strong>Please complete device setup first.</strong> Go to Device Setup section and select your device size.</div>';
        return;
    }
    
    // Create full chart display
    let chartHTML = `
        <div class="reading-instructions">
            <h3>Near Vision Reading Test (Lighthouse International Style)</h3>
            <p style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Standard Viewing Distance: 40cm (16 inches)</strong><br>
                Hold your device at this distance for accurate results.
            </p>
            <p><strong>Instructions:</strong></p>
            <ul>
                <li>Hold device at <strong>40cm (16 inches)</strong> viewing distance</li>
                <li>Sit in good lighting (6500K, CRI >90 recommended)</li>
                <li>Start from the TOP (largest text, 8.0M) and read DOWN to smallest (0.4M)</li>
                <li>Read each line out loud as quickly and accurately as possible</li>
                <li>${hasMic ? 'Allow microphone access to record reading speed' : 'Manual timing will be used'}</li>
            </ul>
            <p><strong>We will measure:</strong></p>
            <ul>
                <li><strong>Critical Print Size (CPS):</strong> Smallest size you can read at maximum speed</li>
                <li><strong>Threshold Print Size (TPS):</strong> Smallest size you can read (even slowly)</li>
                <li><strong>Maximum Reading Speed:</strong> Your fastest reading speed in words per minute</li>
            </ul>
            <p style="font-size: 0.9em; color: #666; margin-top: 15px;">
                <em>This is an educational screening test based on Lighthouse International methodology, not an official clinical test.</em>
            </p>
            <button id="start-reading-test-btn" class="btn btn-primary btn-lg" style="min-height: 60px; font-size: 1.1rem; padding: 1rem 2rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Start Reading Test</button>
        </div>
        
        <div id="reading-chart" class="reading-chart" style="display: none;">
    `;
    
    // Display all sentences from largest (8M) to smallest (0.4M)
    readingMValues.forEach((level, idx) => {
        const sentence = mnreadSentences[idx % mnreadSentences.length];
        const fontSize = calculateFontSizeFromM(level.m, state.device.pxPerMM);
        
        chartHTML += `
            <div class="reading-line" data-index="${idx}" data-m="${level.m}">
                <div class="reading-line-label">
                    <span class="m-value">${level.m}M</span>
                    <span class="snellen-value">${level.snellen}</span>
                </div>
                <div class="reading-sentence" style="font-size: ${fontSize}px; line-height: 1.3;">
                    ${sentence}
                </div>
                <div class="reading-controls">
                    <button class="btn-start-line" data-index="${idx}" style="min-width: 100px; padding: 8px 15px; font-size: 14px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">▶ Start</button>
                    <button class="btn-stop-line" data-index="${idx}" style="display:none; min-width: 100px; padding: 8px 15px; font-size: 14px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">⏹ Stop</button>
                    <span class="reading-time" style="font-weight: bold; color: #4CAF50; min-width: 150px; margin: 0 10px;"></span>
                    <input type="number" class="reading-errors" placeholder="Errors" min="0" max="10" style="width: 80px; padding: 5px; text-align: center; border: 1px solid #ddd; border-radius: 3px;" />
                </div>
            </div>
        `;
    });
    
    chartHTML += `
        </div>
        
        <div id="reading-results" style="display: none;">
            <h3>Reading Test Results</h3>
            <div id="reading-results-content"></div>
            <button id="save-reading-results-btn" class="btn btn-primary" style="min-height: 50px; font-size: 1rem; padding: 10px 30px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Save Results</button>
        </div>
    `;
    
    container.innerHTML = chartHTML;
    
    // Setup event handlers
    setupReadingTestHandlers();
}

// Reading test handlers
function setupReadingTestHandlers() {
    const startTestBtn = document.getElementById('start-reading-test-btn');
    const readingChart = document.getElementById('reading-chart');
    const resultsDiv = document.getElementById('reading-results');
    
    if (!startTestBtn || !readingChart) return;
    
    let readingData = [];
    let currentLineIndex = null;
    let lineStartTime = null;
    let transcriptBuffer = '';
    
    startTestBtn.addEventListener('click', function() {
        document.querySelector('.reading-instructions').style.display = 'none';
        readingChart.style.display = 'block';
        
        // Start microphone if available
        if (recognition) {
            recognition.start();
            isListening = true;
            
            recognition.onresult = function(event) {
                // Capture speech for error checking (optional enhancement)
                transcriptBuffer = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcriptBuffer += event.results[i][0].transcript;
                }
            };
        }
    });
    
    // Setup start/stop buttons for each line
    document.querySelectorAll('.btn-start-line').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const line = document.querySelector(`.reading-line[data-index="${idx}"]`);
            
            // Start timing
            currentLineIndex = idx;
            lineStartTime = performance.now();
            
            // UI updates
            this.style.display = 'none';
            line.querySelector('.btn-stop-line').style.display = 'inline-block';
            line.classList.add('reading-active');
        });
    });
    
    document.querySelectorAll('.btn-stop-line').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const line = document.querySelector(`.reading-line[data-index="${idx}"]`);
            
            // Stop timing
            const endTime = performance.now();
            const readingTimeSeconds = (endTime - lineStartTime) / 1000;
            
            // Get errors
            const errorsInput = line.querySelector('.reading-errors');
            const errors = parseInt(errorsInput.value) || 0;
            
            // Get the sentence and count words
            const sentence = mnreadSentences[idx % mnreadSentences.length];
            const wordCount = sentence.split(/\s+/).length;
            
            // Calculate WPM: 60 × (words_in_sentence - errors) / time_seconds
            const wordsRead = Math.max(0, wordCount - errors);
            const wpm = readingTimeSeconds > 0 ? Math.round(60 * wordsRead / readingTimeSeconds) : 0;
            
            // Store data
            readingData[idx] = {
                mValue: readingMValues[idx].m,
                snellen: readingMValues[idx].snellen,
                readingTime: readingTimeSeconds.toFixed(2),
                errors: errors,
                wpm: wpm > 0 ? wpm : 0
            };
            
            // Display time
            line.querySelector('.reading-time').textContent = `${readingTimeSeconds.toFixed(1)}s - ${wpm} WPM`;
            
            // UI updates
            this.style.display = 'none';
            line.classList.remove('reading-active');
            line.classList.add('reading-complete');
            
            // Check if all lines completed
            if (readingData.filter(d => d).length === readingMValues.length) {
                finishReadingTest(readingData);
            }
        });
    });
}

// Calculate CPS and TPS from reading data
function finishReadingTest(data) {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
    }
    
    // Find maximum reading speed
    const maxWPM = Math.max(...data.map(d => d.wpm));
    
    // Critical Print Size: smallest size where reading speed >= 90% of max
    const cpsThreshold = maxWPM * 0.9;
    let cpsIndex = data.findIndex(d => d.wpm < cpsThreshold);
    if (cpsIndex === -1) cpsIndex = data.length - 1;
    else cpsIndex = Math.max(0, cpsIndex - 1);
    
    const cps = data[cpsIndex];
    
    // Threshold Print Size: smallest size readable (WPM > 0)
    let tpsIndex = data.length - 1;
    for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].wpm > 0) {
            tpsIndex = i;
            break;
        }
    }
    const tps = data[tpsIndex];
    
    // Display results
    const resultsContent = document.getElementById('reading-results-content');
    resultsContent.innerHTML = `
        <div class="result-summary">
            <h4>Maximum Reading Speed</h4>
            <p class="result-value">${maxWPM} words per minute</p>
            
            <h4>Critical Print Size (CPS)</h4>
            <p class="result-value">${cps.mValue}M (${cps.snellen})</p>
            <p class="result-description">Smallest size for effortless reading at maximum speed</p>
            
            <h4>Threshold Print Size (TPS)</h4>
            <p class="result-value">${tps.mValue}M (${tps.snellen})</p>
            <p class="result-description">Smallest size readable (even if slowly)</p>
            
            <h4>Reading Speed by Print Size</h4>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Print Size</th>
                        <th>Snellen</th>
                        <th>Time (s)</th>
                        <th>Errors</th>
                        <th>WPM</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(d => `
                        <tr class="${d.mValue === cps.mValue ? 'highlight-cps' : ''}">
                            <td>${d.mValue}M</td>
                            <td>${d.snellen}</td>
                            <td>${d.readingTime}</td>
                            <td>${d.errors}</td>
                            <td><strong>${d.wpm}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('reading-chart').style.display = 'none';
    document.getElementById('reading-results').style.display = 'block';
    
    // Store results
    state.results.reading = {
        maxWPM: maxWPM,
        cps: { m: cps.mValue, snellen: cps.snellen },
        tps: { m: tps.mValue, snellen: tps.snellen },
        detailedData: data
    };
    
    document.getElementById('save-reading-results-btn').addEventListener('click', function() {
        // Could navigate back to menu or show completion message
        alert('Reading test results saved!');
    });
}

// Ishihara-Style Color Vision Test
// Tests for red-green color deficiency using pseudo-isochromatic plates
// Standard uses confusion lines: protan (red-deficient) vs deutan (green-deficient)
const colorPlates = [
    // Control plate - everyone should see this
    { 
        type: 'control',
        numberNormal: 12,
        numberDeficient: null,
        targetHue: 25, // Orange
        bgHues: [90, 120], // Green-yellow range
        difficulty: 'easy'
    },
    // Protan/Deutan screening plates
    {
        type: 'screening',
        numberNormal: 8,
        numberDeficient: 3,
        targetHue: 120, // Green
        bgHues: [0, 15, 30], // Red-orange range
        difficulty: 'medium'
    },
    {
        type: 'screening',
        numberNormal: 6,
        numberDeficient: null, // Nothing visible
        targetHue: 350, // Red
        bgHues: [100, 120, 140], // Yellow-green range
        difficulty: 'medium'
    },
    {
        type: 'protan',
        numberNormal: 45,
        numberDeficient: null,
        targetHue: 5, // Red
        bgHues: [85, 95, 105], // Yellow-green confusion line
        difficulty: 'hard'
    },
    {
        type: 'deutan',
        numberNormal: 73,
        numberDeficient: null,
        targetHue: 160, // Cyan-green
        bgHues: [345, 355, 5], // Red-pink confusion line
        difficulty: 'hard'
    }
];

// Ccolor functionality - Ishihara-style pseudo-isochromatic plates
function initCcolor() {
    initColorVision();
}

// Generate pseudo-isochromatic plate
function drawIshiharaStylePlate(ctx, width, height, plateConfig) {
    // Clear canvas with light gray
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const plateRadius = Math.min(width, height) * 0.4;
    const dotSize = 6 + Math.random() * 4; // Variable dot size 6-10px
    const spacing = 12;
    
    // Create dot grid
    const rows = Math.floor(height / spacing);
    const cols = Math.floor(width / spacing);
    
    // Generate background dots with color variation
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * spacing + spacing / 2 + (Math.random() - 0.5) * 4;
            const y = row * spacing + spacing / 2 + (Math.random() - 0.5) * 4;
            
            // Check if inside plate circle
            const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            if (distFromCenter > plateRadius) continue;
            
            // Determine if this dot is part of the number
            const isNumberDot = isInsideNumber(x, y, centerX, centerY, plateConfig.numberNormal);
            
            // Select color based on whether it's part of number
            let hue, saturation, lightness;
            
            if (isNumberDot) {
                // Target color (forms the number)
                hue = plateConfig.targetHue + (Math.random() - 0.5) * 15;
                saturation = 35 + Math.random() * 15; // 35-50% - critical for confusion
                lightness = 45 + Math.random() * 15;  // 45-60%
            } else {
                // Background colors (confusing colors)
                const bgHue = plateConfig.bgHues[Math.floor(Math.random() * plateConfig.bgHues.length)];
                hue = bgHue + (Math.random() - 0.5) * 20;
                saturation = 35 + Math.random() * 15; // SAME saturation range - key for pseudo-isochromatic
                lightness = 45 + Math.random() * 15;  // SAME lightness range
            }
            
            // Draw dot with HSL color
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.beginPath();
            const currentDotSize = dotSize + (Math.random() - 0.5) * 2;
            ctx.arc(x, y, currentDotSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
// Check if coordinate is inside number shape
function isInsideNumber(x, y, centerX, centerY, number) {
    // Define 7-segment-style patterns for numbers (similar to previous but more precise)
    // Each segment defined as rectangle [x, y, width, height] relative to center
    
    const digitWidth = 60;
    const digitHeight = 90;
    const segmentThickness = 15;
    
    // Convert number to string to handle 2-digit numbers
    const numberStr = number.toString();
    const startX = centerX - (numberStr.length * digitWidth) / 2;
    
    for (let i = 0; i < numberStr.length; i++) {
        const digit = parseInt(numberStr[i]);
        const digitX = startX + i * digitWidth;
        const digitY = centerY - digitHeight / 2;
        
        // Check if point is inside any segment of this digit
        if (isInsideDigitSegments(x, y, digitX, digitY, digit, digitWidth, digitHeight, segmentThickness)) {
            return true;
        }
    }
    
    return false;
}

// Define digit segment patterns (0-9)
function isInsideDigitSegments(x, y, digitX, digitY, digit, width, height, thickness) {
    // Define segments for each digit (a=top, b=top-right, c=bottom-right, d=bottom, e=bottom-left, f=top-left, g=middle)
    const segmentPatterns = {
        0: ['a', 'b', 'c', 'd', 'e', 'f'],
        1: ['b', 'c'],
        2: ['a', 'b', 'g', 'e', 'd'],
        3: ['a', 'b', 'g', 'c', 'd'],
        4: ['f', 'g', 'b', 'c'],
        5: ['a', 'f', 'g', 'c', 'd'],
        6: ['a', 'f', 'e', 'd', 'c', 'g'],
        7: ['a', 'b', 'c'],
        8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        9: ['a', 'b', 'c', 'd', 'f', 'g']
    };
    
    const segments = segmentPatterns[digit];
    
    // Check if point is inside any active segment
    for (const seg of segments) {
        let rectX, rectY, rectW, rectH;
        
        switch(seg) {
            case 'a': // Top horizontal
                rectX = digitX + thickness;
                rectY = digitY;
                rectW = width - 2 * thickness;
                rectH = thickness;
                break;
            case 'b': // Top-right vertical
                rectX = digitX + width - thickness;
                rectY = digitY;
                rectW = thickness;
                rectH = height / 2;
                break;
            case 'c': // Bottom-right vertical
                rectX = digitX + width - thickness;
                rectY = digitY + height / 2;
                rectW = thickness;
                rectH = height / 2;
                break;
            case 'd': // Bottom horizontal
                rectX = digitX + thickness;
                rectY = digitY + height - thickness;
                rectW = width - 2 * thickness;
                rectH = thickness;
                break;
            case 'e': // Bottom-left vertical
                rectX = digitX;
                rectY = digitY + height / 2;
                rectW = thickness;
                rectH = height / 2;
                break;
            case 'f': // Top-left vertical
                rectX = digitX;
                rectY = digitY;
                rectW = thickness;
                rectH = height / 2;
                break;
            case 'g': // Middle horizontal
                rectX = digitX + thickness;
                rectY = digitY + height / 2 - thickness / 2;
                rectW = width - 2 * thickness;
                rectH = thickness;
                break;
        }
        
        // Check if point is inside this segment rectangle
        if (x >= rectX && x <= rectX + rectW && y >= rectY && y <= rectY + rectH) {
            return true;
        }
    }
    
    return false;
}

// Initialize color vision test
function initColorVision() {
    const container = document.querySelector('.color-demo');
    if (!container) return;
    
    let currentPlate = 0;
    let results = [];
    
    function showPlate() {
        if (currentPlate >= colorPlates.length) {
            showColorResults(results);
            return;
        }
        
        const plate = colorPlates[currentPlate];
        
        container.innerHTML = `
            <div class="color-plate-test">
                <p style="font-size: 1.1em; margin-bottom: 10px;"><strong>Plate ${currentPlate + 1} of ${colorPlates.length}</strong></p>
                <p style="margin-bottom: 15px;">What number do you see? (Enter "0" if you can't see a number)</p>
                <canvas id="color-plate-canvas" width="500" height="500" style="border: 2px solid #999; margin: 20px auto; display: block; background: #E8E8E8;"></canvas>
                <div style="margin-top: 20px;">
                    <input type="number" id="color-answer" min="0" max="99" style="width: 100px; height: 50px; font-size: 24px; text-align: center; margin: 20px; padding: 10px; border: 2px solid #ddd; border-radius: 5px;" />
                    <button id="submit-color-answer" style="min-height: 50px; font-size: 18px; padding: 10px 30px; background-color: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">Submit Answer</button>
                </div>
            </div>
        `;
        
        // Draw the plate
        const canvas = document.getElementById('color-plate-canvas');
        const ctx = canvas.getContext('2d');
        drawIshiharaStylePlate(ctx, canvas.width, canvas.height, plate);
        
        // Handle answer submission
        document.getElementById('submit-color-answer').addEventListener('click', function() {
            const userAnswer = parseInt(document.getElementById('color-answer').value) || 0;
            
            results.push({
                plateNumber: currentPlate + 1,
                correctAnswer: plate.numberNormal,
                userAnswer: userAnswer,
                isCorrect: userAnswer === plate.numberNormal,
                plateType: plate.type
            });
            
            currentPlate++;
            showPlate();
        });
        
        // Allow Enter key to submit
        document.getElementById('color-answer').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('submit-color-answer').click();
            }
        });
    }
    
    showPlate();
}

// Analyze color vision results
function showColorResults(results) {
    const container = document.querySelector('.color-demo');
    if (!container) return;
    
    const totalPlates = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const score = (correctCount / totalPlates * 100).toFixed(0);
    
    let interpretation;
    if (correctCount >= 4 || score >= 80) {
        interpretation = "Normal color vision indicated";
    } else if (score >= 50) {
        interpretation = "Possible mild color vision deficiency - recommend professional evaluation";
    } else {
        interpretation = "Possible color vision deficiency detected - recommend comprehensive eye exam";
    }
    
    // Display results
    container.innerHTML = `
        <div class="color-results" style="padding: 20px; text-align: center;">
            <h3 style="margin-bottom: 15px;">Color Vision Test Results</h3>
            <p style="font-size: 1.2em; margin-bottom: 10px;">Score: ${correctCount} / ${totalPlates} correct (${score}%)</p>
            <p style="font-size: 1.1em; margin: 20px 0; font-weight: bold; color: #2c3e50;">${interpretation}</p>
            <p class="disclaimer" style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; color: #856404;">
                <strong>Note:</strong> This is a screening test only. Clinical diagnosis requires professional Ishihara testing under standardized lighting (6500K, CRI >90). Monitor color calibration and ambient lighting affect results.
            </p>
        </div>
    `;
}

// CORRECT Pelli-Robson Contrast Sensitivity Test
// Letters on WHITE background (not gray!)
// Contrast levels from 100% (black) to 1.25% (very light gray)
const contrastLevels = [
  { contrast: 1.00, logCS: 0.00, label: "100%", percent: 100 },
  { contrast: 0.50, logCS: 0.30, label: "50%", percent: 50 },
  { contrast: 0.25, logCS: 0.60, label: "25%", percent: 25 },
  { contrast: 0.10, logCS: 1.00, label: "10%", percent: 10 },
  { contrast: 0.05, logCS: 1.30, label: "5%", percent: 5 },
  { contrast: 0.025, logCS: 1.60, label: "2.5%", percent: 2.5 },
  { contrast: 0.0125, logCS: 1.90, label: "1.25%", percent: 1.25 }
];

// Sloan letters (Pelli-Robson standard)
const sloanLetters = ['C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z'];

// Generate random 5-letter sequence (no repeats in same line)
function generateLetterSequence() {
  const shuffled = [...sloanLetters].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

// Calculate letter color for contrast level
// CORRECT: White background (255, 255, 255), vary letter darkness
function calculateContrastColor(contrastPercent) {
  // Background: WHITE
  const bgR = 255, bgG = 255, bgB = 255;
  
  // Weber contrast (simpler for text on white):
  // Contrast = (Background - Text) / Background
  // Text luminance = Background × (1 - contrast)
  const contrastValue = contrastPercent / 100;
  const textValue = Math.round(255 * (1 - contrastValue));
  
  return {
    bg: { r: bgR, g: bgG, b: bgB },
    fg: { r: textValue, g: textValue, b: textValue }
  };
}

// Contrast Sensitivity functionality
function initContrast() {
    initContrastTest();
}

// Initialize Contrast Test
function initContrastTest() {
  const container = document.getElementById('contrast-container');
  if (!container) return;
  
  if (!state.device.pxPerMM) {
    container.innerHTML = '<div class="error" style="padding: 20px; background: #ffebee; border: 2px solid #f44336; border-radius: 5px; color: #c62828;"><strong>Please complete device setup first.</strong> Go to Device Setup section and select your device size.</div>';
    return;
  }
  
  // Pelli-Robson: 2.8° at 1m = 49mm height
  // Letter x-height ≈ 35mm at 1m
  const viewingDistanceCm = 100; // 1 meter (Pelli-Robson standard)
  const xHeightMm = 35;
  const letterSizePx = xHeightMm * state.device.pxPerMM * 1.4; // 1.4x for font size
  
  let chartHTML = `
    <div class="contrast-instructions">
      <h3>Contrast Sensitivity Test (Pelli-Robson Style)</h3>
      <p><strong>Instructions:</strong></p>
      <ul>
        <li><strong>Viewing distance: 1 METER (100cm / 40 inches)</strong></li>
        <li>Ensure screen is at <strong>maximum brightness</strong></li>
        <li>View in <strong>bright lighting</strong> (not dim)</li>
        <li>Read each line of <strong>5 letters</strong> from left to right</li>
        <li>Type the letters you see (or your best guess)</li>
        <li><strong>Passing score: 4 out of 5 letters correct</strong></li>
        <li>Test stops when you fail a line (2+ errors)</li>
      </ul>
      <p class="warning" style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">⚠️ <strong>Important:</strong> Letters get lighter (lower contrast), not smaller</p>
      <button id="start-contrast-test-btn" class="btn btn-primary btn-lg" style="min-height: 60px; font-size: 1.1rem; padding: 1rem 2rem; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Start Contrast Test</button>
    </div>
    
    <div id="contrast-chart" class="contrast-chart" style="display: none;">
  `;
  
  // Generate all contrast lines
  const contrastLines = [];
  contrastLevels.forEach((level, idx) => {
    const letters = generateLetterSequence();
    const colors = calculateContrastColor(level.percent);
    
    contrastLines.push({
      level: level,
      letters: letters,
      colors: colors
    });
    
    chartHTML += `
      <div class="contrast-line" data-index="${idx}">
        <div class="contrast-line-header" style="display: flex; gap: 20px; margin-bottom: 15px; font-weight: bold;">
          <span class="contrast-label" style="color: #2196F3; font-size: 20px;">${level.label} Contrast</span>
          <span class="log-cs-label" style="color: #666; font-size: 16px;">Log CS: ${level.logCS.toFixed(2)}</span>
        </div>
        <div class="contrast-letters-box" 
             style="background: rgb(${colors.bg.r}, ${colors.bg.g}, ${colors.bg.b});
                    color: rgb(${colors.fg.r}, ${colors.fg.g}, ${colors.fg.b});
                    font-size: ${letterSizePx}px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    padding: 40px;
                    text-align: center;
                    border: 2px solid #ccc;
                    letter-spacing: ${letterSizePx * 0.5}px;
                    border-radius: 8px;
                    margin: 15px 0;">
          ${letters.join(' ')}
        </div>
        <div class="contrast-response" style="display: flex; gap: 15px; align-items: center; margin-top: 15px;">
          <label>Type 5 letters:</label>
          <input type="text" 
                 class="contrast-input" 
                 data-index="${idx}"
                 maxlength="5" 
                 placeholder="5 letters"
                 style="text-transform: uppercase;
                        font-size: 24px;
                        width: 200px;
                        padding: 10px;
                        text-align: center;
                        font-family: monospace;
                        letter-spacing: 5px;
                        border: 2px solid #ddd;
                        border-radius: 5px;" />
          <button class="btn-check-contrast" data-index="${idx}" style="min-width: 100px; padding: 10px 20px; font-size: 16px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Check Answer</button>
          <span class="contrast-result" style="font-weight: bold; font-size: 16px; min-width: 150px;"></span>
        </div>
      </div>
    `;
  });
  
  chartHTML += `
      <div id="contrast-stop-message" style="display: none; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; margin: 20px 0;">
        <h3>Test Stopped</h3>
        <p>You had 2 or more errors on this line.</p>
        <p>Your contrast sensitivity result is the <strong>previous line</strong> you passed.</p>
        <button id="finish-contrast-btn" class="btn btn-primary" style="min-height: 50px; font-size: 1rem; padding: 10px 30px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">View Results</button>
      </div>
    </div>
    
    <div id="contrast-results" style="display: none;">
      <h3>Contrast Sensitivity Results</h3>
      <div id="contrast-results-content"></div>
      <button id="save-contrast-results-btn" class="btn btn-primary" style="min-height: 50px; font-size: 1rem; padding: 10px 30px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Save Results</button>
    </div>
  `;
  
  container.innerHTML = chartHTML;
  
  // Store line data
  container.contrastLines = contrastLines;
  
  // Setup handlers
  setupContrastTestHandlers(contrastLines);
}

// Contrast test handlers with correct scoring
function setupContrastTestHandlers(contrastLines) {
  const startBtn = document.getElementById('start-contrast-test-btn');
  const chartDiv = document.getElementById('contrast-chart');
  
  let contrastResults = [];
  let testStopped = false;
  let bestContrastLevel = null;
  
  startBtn.addEventListener('click', function() {
    document.querySelector('.contrast-instructions').style.display = 'none';
    chartDiv.style.display = 'block';
    
    // Focus first input
    document.querySelector('.contrast-input[data-index="0"]').focus();
  });
  
  // Check buttons
  document.querySelectorAll('.btn-check-contrast').forEach(btn => {
    btn.addEventListener('click', function() {
      if (testStopped) return;
      
      const idx = parseInt(this.dataset.index);
      const line = document.querySelector(`.contrast-line[data-index="${idx}"]`);
      const input = line.querySelector('.contrast-input');
      const resultSpan = line.querySelector('.contrast-result');
      
      const userAnswer = input.value.toUpperCase().trim().replace(/\s/g, '');
      const correctLetters = contrastLines[idx].letters;
      
      if (userAnswer.length !== 5) {
        alert('Please enter exactly 5 letters');
        return;
      }
      
      // Count correct letters
      let correctCount = 0;
      for (let i = 0; i < 5; i++) {
        if (userAnswer[i] === correctLetters[i]) {
          correctCount++;
        }
      }
      
      const passed = correctCount >= 4; // Need 4/5 to pass
      const errorCount = 5 - correctCount;
      
      // Store result
      contrastResults[idx] = {
        level: contrastLines[idx].level,
        correctLetters: correctLetters.join(''),
        userAnswer: userAnswer,
        correctCount: correctCount,
        errorCount: errorCount,
        passed: passed
      };
      
      // Display result
      resultSpan.innerHTML = `<strong>${correctCount}/5 correct</strong> - ${passed ? '✓ PASSED' : '✗ FAILED'}`;
      resultSpan.className = `contrast-result ${passed ? 'result-pass' : 'result-fail'}`;
      resultSpan.style.color = passed ? '#4CAF50' : '#f44336';
      
      // Disable input and button
      input.disabled = true;
      this.disabled = true;
      line.classList.add(passed ? 'line-passed' : 'line-failed');
      
      // If FAILED (2+ errors), STOP test - previous line is result
      if (!passed) {
        testStopped = true;
        
        // Best contrast is the previous line (last one passed)
        if (idx > 0) {
          bestContrastLevel = contrastResults[idx - 1]?.level || contrastLines[0].level;
        } else {
          // Failed first line - no measurable CS
          bestContrastLevel = { contrast: 0, logCS: 0, label: "0%", percent: 0 };
        }
        
        // Hide remaining lines
        for (let i = idx + 1; i < contrastLines.length; i++) {
          document.querySelector(`.contrast-line[data-index="${i}"]`).style.display = 'none';
        }
        
        // Show stop message
        document.getElementById('contrast-stop-message').style.display = 'block';
        
      } else if (idx === contrastLines.length - 1) {
        // Passed all lines!
        bestContrastLevel = contrastLines[idx].level;
        testStopped = true;
        finishContrastTest(contrastResults, bestContrastLevel);
      } else {
        // Focus next input
        const nextInput = document.querySelector(`.contrast-input[data-index="${idx + 1}"]`);
        if (nextInput) nextInput.focus();
      }
    });
  });
  
  // Enter key to submit
  document.querySelectorAll('.contrast-input').forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
    
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const idx = parseInt(this.dataset.index);
        document.querySelector(`.btn-check-contrast[data-index="${idx}"]`).click();
      }
    });
  });
  
  // Finish button (when test stopped early)
  const finishBtn = document.getElementById('finish-contrast-btn');
  if (finishBtn) {
    finishBtn.addEventListener('click', function() {
      finishContrastTest(contrastResults, bestContrastLevel);
    });
  }
}

// Display results with correct interpretation
function finishContrastTest(results, bestLevel) {
  const resultsContent = document.getElementById('contrast-results-content');
  
  // Interpret results (Pelli-Robson normal: 1.5-2.0 log CS)
  let interpretation;
  let recommendation;
  
  if (bestLevel.logCS === 0) {
    interpretation = 'Unable to measure - failed first line';
    recommendation = 'Immediate professional evaluation recommended';
  } else if (bestLevel.logCS >= 1.50) {
    interpretation = 'Normal contrast sensitivity';
    recommendation = 'No concerns detected in this screening';
  } else if (bestLevel.logCS >= 1.00) {
    interpretation = 'Mild reduction in contrast sensitivity';
    recommendation = 'Consider professional evaluation if experiencing vision difficulties';
  } else if (bestLevel.logCS >= 0.60) {
    interpretation = 'Moderate reduction in contrast sensitivity';
    recommendation = 'Professional eye examination recommended';
  } else {
    interpretation = 'Significant reduction in contrast sensitivity';
    recommendation = 'Comprehensive eye exam strongly recommended';
  }
  
  resultsContent.innerHTML = `
    <div class="result-summary-box">
      <h4>Your Contrast Sensitivity Result</h4>
      <div class="result-main">
        <p class="result-value-large" style="font-size: 32px; font-weight: bold; color: #4CAF50; margin: 10px 0;">${bestLevel.label}</p>
        <p class="result-logcs" style="font-size: 20px; color: #666; margin-bottom: 20px;">Log CS: ${bestLevel.logCS.toFixed(2)}</p>
      </div>
      
      <div class="result-interpretation" style="background: #e8f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
        <h5>Interpretation:</h5>
        <p><strong>${interpretation}</strong></p>
        <p>${recommendation}</p>
      </div>
      
      <div class="result-reference" style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Reference Values (Pelli-Robson):</strong></p>
        <ul>
          <li><strong>Normal:</strong> 1.5 - 2.0 log CS (5% to 1.25% contrast)</li>
          <li><strong>Mild impairment:</strong> 1.0 - 1.5 log CS (10% to 5% contrast)</li>
          <li><strong>Moderate impairment:</strong> 0.6 - 1.0 log CS (25% to 10% contrast)</li>
          <li><strong>Severe impairment:</strong> < 0.6 log CS (> 25% contrast)</li>
        </ul>
      </div>
      
      <h4>Line-by-Line Results</h4>
      <table class="results-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background: #f5f5f5; font-weight: bold;">Contrast</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background: #f5f5f5; font-weight: bold;">Log CS</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background: #f5f5f5; font-weight: bold;">Correct Letters</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background: #f5f5f5; font-weight: bold;">Your Answer</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background: #f5f5f5; font-weight: bold;">Score</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center; background: #f5f5f5; font-weight: bold;">Result</th>
          </tr>
        </thead>
        <tbody>
          ${results.filter(r => r).map((r, idx) => `
            <tr class="${r.level.contrast === bestLevel.contrast ? 'highlight-best' : ''} ${r.passed ? '' : 'failed-line'}" style="${r.level.contrast === bestLevel.contrast ? 'background: #fff9c4 !important; font-weight: bold;' : ''}">
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${r.level.label}</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${r.level.logCS.toFixed(2)}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-family: monospace; font-weight: bold;">${r.correctLetters}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${r.userAnswer}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${r.correctCount}/5</strong> (${r.errorCount} errors)</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <span style="background: ${r.passed ? '#4CAF50' : '#f44336'}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">
                  ${r.passed ? 'PASS' : 'FAIL'}
                </span>
                ${!r.passed ? '<br><small>(Test stopped here)</small>' : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="test-conditions" style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Test Conditions:</strong></p>
        <ul>
          <li>Viewing distance: 1 meter (100cm)</li>
          <li>Device: ${state.device.diagonal}" screen</li>
          <li>Background: White (clinical standard)</li>
          <li>Letter size: 2.8° (Pelli-Robson standard)</li>
        </ul>
      </div>
    </div>
  `;
  
  document.getElementById('contrast-chart').style.display = 'none';
  document.getElementById('contrast-results').style.display = 'block';
  
  // Store results
  state.results.contrast = {
    bestContrast: bestLevel.label,
    logCS: bestLevel.logCS,
    interpretation: interpretation,
    recommendation: recommendation,
    detailedResults: results.filter(r => r)
  };
  
  document.getElementById('save-contrast-results-btn').addEventListener('click', function() {
    alert('Contrast test results saved!');
  });
}



