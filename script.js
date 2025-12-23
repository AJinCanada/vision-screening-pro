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
    
    // Initialize Astigmatism
    initAstigmatism();
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
    const sentence = sentences[currentSentenceIndex];
    
    // Calculate font size - decreases with each sentence
    // Start at 48px, decrease by ~1.2px per sentence
    const baseSize = 48;
    const decreaseRate = 1.2;
    const fontSize = Math.max(12, baseSize - (currentSentenceIndex * decreaseRate));
    
    sentenceDisplay.innerHTML = `<p style="font-size: ${fontSize}px;">${sentence}</p>`;
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

// Astigmatism functionality - draw radial lines
function initAstigmatism() {
    const canvas = document.getElementById('astigmatism-canvas');
    const ctx = canvas.getContext('2d');
    
    drawAstigmatismPattern(ctx, canvas.width, canvas.height);
}

function drawAstigmatismPattern(ctx, width, height) {
    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const numLines = 24; // 24 radial lines like a clock
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    // Draw radial lines from center
    for (let i = 0; i < numLines; i++) {
        const angle = (i * 2 * Math.PI) / numLines;
        const endX = centerX + Math.cos(angle) * radius;
        const endY = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // Draw a small circle in the center
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
}

