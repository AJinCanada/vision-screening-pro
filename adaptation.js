// Dark Adaptation Manager - 30-second adaptation timer for contrast testing
class DarkAdaptation {
  constructor() {
    this.adaptationTime = 30; // seconds (standard clinical protocol)
    this.currentTime = 0;
    this.isAdapting = false;
    this.timer = null;
  }

  // Show adaptation screen
  async startAdaptation(container) {
    return new Promise((resolve) => {
      this.isAdapting = true;
      this.currentTime = this.adaptationTime;
      
      const adaptationHTML = `
        <div class="adaptation-screen">
          <div class="adaptation-container">
            <h2>Dark Adaptation Phase</h2>
            <p>Please wait while your eyes adapt to the testing conditions.</p>
            
            <div class="adaptation-timer-circle">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" 
                        fill="none" 
                        stroke="#e0e0e0" 
                        stroke-width="10"/>
                <circle id="progress-circle" 
                        cx="100" cy="100" r="90" 
                        fill="none" 
                        stroke="#4CAF50" 
                        stroke-width="10"
                        stroke-dasharray="565.48"
                        stroke-dashoffset="565.48"
                        transform="rotate(-90 100 100)"
                        style="transition: stroke-dashoffset 1s linear;"/>
              </svg>
              <div class="timer-text">
                <span id="adaptation-countdown">${this.adaptationTime}</span>
                <span class="timer-label">seconds</span>
              </div>
            </div>
            
            <div class="adaptation-instructions">
              <h3>During Adaptation:</h3>
              <ul>
                <li>Look at the center of the screen</li>
                <li>Blink normally</li>
                <li>Stay at 40cm viewing distance</li>
                <li>Keep room lighting constant</li>
              </ul>
            </div>
            
            <button id="skip-adaptation-btn" class="btn btn-secondary">
              Skip Adaptation
            </button>
          </div>
        </div>
      `;
      
      container.innerHTML = adaptationHTML;
      
      // Setup skip button
      document.getElementById('skip-adaptation-btn').addEventListener('click', () => {
        this.stopAdaptation();
        resolve();
      });
      
      // Start countdown
      this.startCountdown(resolve);
    });
  }

  startCountdown(callback) {
    const countdownEl = document.getElementById('adaptation-countdown');
    const progressCircle = document.getElementById('progress-circle');
    const circumference = 565.48; // 2 * π * 90
    
    this.timer = setInterval(() => {
      this.currentTime--;
      
      // Update countdown text
      countdownEl.textContent = this.currentTime;
      
      // Update progress circle
      const progress = (this.adaptationTime - this.currentTime) / this.adaptationTime;
      const offset = circumference - (progress * circumference);
      progressCircle.style.strokeDashoffset = offset;
      
      // Play sound at 10, 5, 3, 2, 1 seconds
      if ([10, 5, 3, 2, 1].includes(this.currentTime)) {
        this.playBeep();
      }
      
      // Complete
      if (this.currentTime <= 0) {
        this.stopAdaptation();
        this.playCompletionSound();
        callback();
      }
    }, 1000);
  }

  stopAdaptation() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isAdapting = false;
  }

  playBeep() {
    // Simple beep sound using Web Audio API
    if (!window.audioContext) {
      window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = window.audioContext.createOscillator();
    const gainNode = window.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(window.audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, window.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.1);
    
    oscillator.start(window.audioContext.currentTime);
    oscillator.stop(window.audioContext.currentTime + 0.1);
  }

  playCompletionSound() {
    // Double beep for completion
    this.playBeep();
    setTimeout(() => this.playBeep(), 200);
  }

  // Configure adaptation time
  setAdaptationTime(seconds) {
    this.adaptationTime = seconds;
  }
}

// Initialize global adaptation manager
const adaptationManager = new DarkAdaptation();

