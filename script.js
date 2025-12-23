// M-values for reading chart (nominal values, approximate)
// These assume specific screen DPI and viewing distance
const mValues = [
    "1.0M", "1.1M", "1.2M", "1.3M", "1.4M", "1.5M", "1.6M", "1.7M", "1.8M", "1.9M",
    "2.0M", "2.1M", "2.2M", "2.3M", "2.4M", "2.5M", "2.6M", "2.7M", "2.8M", "2.9M",
    "3.0M", "3.2M", "3.4M", "3.6M", "3.8M", "4.0M", "4.2M", "4.4M", "4.6M", "4.8M",
    "5.0M", "5.5M", "6.0M", "6.5M", "7.0M"
];

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

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
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
            document.getElementById(targetSection).classList.add('active');
        });
    });
    
    // Initialize Readthechart
    initReadthechart();
    
    // Initialize Ccolor
    initCcolor();
    
    // Initialize Contrast
    initContrast();
    
    // Initialize Depth
    initDepth();
});

// Readthechart functionality
let currentSentenceIndex = 0;
let startTime = null;
let isReading = false;

function initReadthechart() {
    const startBtn = document.getElementById('start-btn');
    const doneBtn = document.getElementById('done-btn');
    const nextBtn = document.getElementById('next-btn');
    const sentenceDisplay = document.getElementById('sentence-display');
    const timerDisplay = document.getElementById('timer-display');
    const progressInfo = document.getElementById('progress-info');
    
    // Display first sentence
    displaySentence();
    
    // Start button - begin timing
    startBtn.addEventListener('click', function() {
        startTime = performance.now();
        isReading = true;
        startBtn.disabled = true;
        doneBtn.disabled = false;
        timerDisplay.textContent = 'Reading...';
        nextBtn.style.display = 'none';
    });
    
    // Done button - show time taken
    doneBtn.addEventListener('click', function() {
        if (startTime && isReading) {
            const endTime = performance.now();
            const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
            timerDisplay.textContent = `Time: ${timeTaken} seconds`;
            isReading = false;
            startBtn.disabled = false;
            doneBtn.disabled = false;
            nextBtn.style.display = 'inline-block';
        }
    });
    
    // Next button - move to next sentence
    nextBtn.addEventListener('click', function() {
        currentSentenceIndex++;
        if (currentSentenceIndex >= sentences.length) {
            currentSentenceIndex = 0; // Loop back to start
        }
        displaySentence();
        startBtn.disabled = false;
        doneBtn.disabled = true;
        nextBtn.style.display = 'none';
        timerDisplay.textContent = '';
        startTime = null;
    });
}

function displaySentence() {
    const sentenceDisplay = document.getElementById('sentence-display');
    const progressInfo = document.getElementById('progress-info');
    const mLabel = document.getElementById('m-label');
    const sentence = sentences[currentSentenceIndex];
    
    // Calculate font size - decreases with each sentence
    // Start at 48px, decrease by ~1.2px per sentence
    const baseSize = 48;
    const decreaseRate = 1.2;
    const fontSize = Math.max(12, baseSize - (currentSentenceIndex * decreaseRate));
    
    sentenceDisplay.innerHTML = `<p style="font-size: ${fontSize}px;">${sentence}</p>`;
    
    // Display M-value label
    const mValue = mValues[currentSentenceIndex] || "";
    mLabel.textContent = mValue;
    
    progressInfo.textContent = `Sentence ${currentSentenceIndex + 1} of ${sentences.length}`;
}

// Ccolor functionality - draw custom dot pattern with number
function initCcolor() {
    const canvas = document.getElementById('color-canvas');
    const ctx = canvas.getContext('2d');
    const checkBtn = document.getElementById('check-color-btn');
    const answerInput = document.getElementById('color-answer');
    const feedback = document.getElementById('color-feedback');
    
    // Generate a random number between 12 and 99 for this session
    const correctNumber = Math.floor(Math.random() * 88) + 12; // 12 to 99
    
    // Draw the dot pattern
    drawColorPattern(ctx, canvas.width, canvas.height, correctNumber);
    
    // Check button functionality
    checkBtn.addEventListener('click', function() {
        const userAnswer = parseInt(answerInput.value.trim());
        
        if (isNaN(userAnswer)) {
            feedback.textContent = 'Please enter a number.';
            feedback.className = 'feedback incorrect';
        } else if (userAnswer === correctNumber) {
            feedback.textContent = 'Correct! Well done.';
            feedback.className = 'feedback correct';
        } else {
            feedback.textContent = `Not quite. Try again! (Hint: The number is ${correctNumber < 50 ? 'less than 50' : '50 or greater'})`;
            feedback.className = 'feedback incorrect';
        }
    });
    
    // Allow Enter key to check
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkBtn.click();
        }
    });
}

function drawColorPattern(ctx, width, height, number) {
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const dotSize = 8;
    const spacing = 12;
    const rows = Math.floor(height / spacing);
    const cols = Math.floor(width / spacing);
    
    // Convert number to string to draw digit by digit
    const numberStr = number.toString();
    const digitWidth = 40;
    const digitHeight = 60;
    const startX = centerX - (numberStr.length * digitWidth) / 2;
    const startY = centerY - digitHeight / 2;
    
    // Draw background dots in two colors (green and orange)
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * spacing + spacing / 2;
            const y = row * spacing + spacing / 2;
            
            // Skip dots in the number area - we'll draw those differently
            const inNumberArea = (x >= startX - 20 && x <= startX + numberStr.length * digitWidth + 20 &&
                                  y >= startY - 20 && y <= startY + digitHeight + 20);
            
            if (!inNumberArea) {
                // Randomly choose between two background colors
                ctx.fillStyle = Math.random() > 0.5 ? '#90EE90' : '#FFB347'; // Light green or light orange
                ctx.beginPath();
                ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw number using different colored dots (red)
    drawNumber(ctx, numberStr, startX, startY, digitWidth, digitHeight, dotSize, spacing);
}

function drawNumber(ctx, numberStr, startX, startY, digitWidth, digitHeight, dotSize, spacing) {
    // Simple 7-segment style pattern for digits
    // Each digit is represented by a pattern of dots
    ctx.fillStyle = '#FF6B6B'; // Red color for the number
    
    for (let i = 0; i < numberStr.length; i++) {
        const digit = parseInt(numberStr[i]);
        const digitX = startX + i * digitWidth;
        
        // Define patterns for each digit (0-9) as dot positions
        // Using a simple grid pattern
        const patterns = {
            0: [[1,0],[2,0],[0,1],[0,2],[0,3],[3,1],[3,2],[3,3],[1,4],[2,4]],
            1: [[2,0],[2,1],[2,2],[2,3],[2,4]],
            2: [[0,0],[1,0],[2,0],[3,1],[2,2],[1,2],[0,3],[0,4],[1,4],[2,4],[3,4]],
            3: [[0,0],[1,0],[2,0],[3,1],[2,2],[1,2],[3,3],[0,4],[1,4],[2,4]],
            4: [[0,0],[0,1],[0,2],[1,2],[2,2],[3,0],[3,1],[3,2],[3,3],[3,4]],
            5: [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[1,2],[2,2],[3,3],[0,4],[1,4],[2,4]],
            6: [[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[0,3],[3,3],[0,4],[1,4],[2,4]],
            7: [[0,0],[1,0],[2,0],[3,0],[3,1],[2,2],[2,3],[2,4]],
            8: [[1,0],[2,0],[0,1],[3,1],[0,2],[1,2],[2,2],[3,2],[0,3],[3,3],[1,4],[2,4]],
            9: [[1,0],[2,0],[0,1],[3,1],[0,2],[1,2],[2,2],[3,2],[3,3],[1,4],[2,4]]
        };
        
        const pattern = patterns[digit] || [];
        const cellSize = digitWidth / 4;
        
        pattern.forEach(([col, row]) => {
            const x = digitX + col * cellSize + cellSize / 2;
            const y = startY + row * (digitHeight / 5) + (digitHeight / 5) / 2;
            ctx.beginPath();
            ctx.arc(x, y, dotSize / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Contrast Sensitivity functionality
function initContrast() {
    setupContrastTest();
}

// Calculate relative luminance from RGB (WCAG formula)
function getRelativeLuminance(r, g, b) {
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Calculate approximate Michelson contrast
function calculateMichelsonContrast(textR, textG, textB, bgR, bgG, bgB) {
    const textLum = getRelativeLuminance(textR, textG, textB);
    const bgLum = getRelativeLuminance(bgR, bgG, bgB);
    
    const maxLum = Math.max(textLum, bgLum);
    const minLum = Math.min(textLum, bgLum);
    
    if (maxLum + minLum === 0) return 0;
    return (maxLum - minLum) / (maxLum + minLum);
}

function setupContrastTest() {
    const list = document.getElementById('contrast-list');
    list.innerHTML = "";

    // Contrast levels (approximate Michelson contrast values)
    const contrastLevels = [0.8, 0.5, 0.3, 0.2, 0.1, 0.05];

    contrastLevels.forEach(c => {
        const li = document.createElement('li');
        li.className = 'contrast-item';

        // Background is white (255, 255, 255)
        const bgR = 255;
        const bgG = 255;
        const bgB = 255;

        // Calculate text color to achieve desired contrast
        // Higher "c" -> darker text (lower RGB values)
        const textGray = Math.round(255 * (1 - c * 1.2)); // Adjust multiplier for better visibility
        const textR = Math.max(0, textGray);
        const textG = Math.max(0, textGray);
        const textB = Math.max(0, textGray);

        // Calculate actual Michelson contrast
        const actualContrast = calculateMichelsonContrast(textR, textG, textB, bgR, bgG, bgB);
        const percent = Math.round(actualContrast * 100);

        li.style.backgroundColor = `rgb(${bgR},${bgG},${bgB})`;
        li.style.color = `rgb(${textR},${textG},${textB})`;

        li.textContent = `Contrast ${percent}% – Example text for contrast sensitivity demonstration.`;
        list.appendChild(li);
    });
}

// Depth Perception - Titmus-style concept
function initDepth() {
    setupDepthDemo();
}

function setupDepthDemo() {
    const canvas = document.getElementById('depth-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const groups = [
        { x: 60, y: 100, label: 1 },
        { x: 150, y: 90, label: 2 },
        { x: 240, y: 80, label: 3 } // slightly higher / with shadow to appear "closer"
    ];

    groups.forEach((g, idx) => {
        ctx.save();
        ctx.translate(g.x, g.y);
        
        // Give group 3 a shadow to look "closer" (monocular depth cue)
        if (g.label === 3) {
            ctx.shadowColor = "rgba(0,0,0,0.3)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;
        }
        
        // Draw 4 circles in each group
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc((i - 1.5) * 15, 0, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#4a6fa5";
            ctx.fill();
        }
        ctx.restore();

        // Draw label
        ctx.fillStyle = "#000";
        ctx.font = "12px Arial";
        ctx.fillText(g.label.toString(), g.x - 3, g.y + 30);
    });
}


