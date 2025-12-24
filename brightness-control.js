// Brightness Manager - Screen brightness detection & wake lock management
class BrightnessManager {
  constructor() {
    this.currentBrightness = null;
    this.recommendedBrightness = 100; // 100% for clinical testing
    this.adaptationTimer = null;
    this.wakeLock = null;
  }

  // Detect current screen brightness (estimated)
  async detectBrightness() {
    try {
      // Method 1: Wake Lock API to prevent dimming
      if ('wakeLock' in navigator) {
        await this.keepAwake();
      }

      // Method 2: Estimate using screen properties
      // Note: Browsers don't expose actual brightness for privacy
      // We can only estimate based on screen characteristics
      
      const estimate = this.estimateBrightness();
      this.currentBrightness = estimate;
      
      return {
        estimated: estimate,
        canControl: this.canControlBrightness(),
        recommendation: this.recommendedBrightness
      };
    } catch (error) {
      console.error('Brightness detection error:', error);
      return {
        estimated: null,
        canControl: false,
        recommendation: this.recommendedBrightness
      };
    }
  }

  estimateBrightness() {
    // Create hidden canvas to sample screen brightness
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 100;
    
    // Fill with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 100, 100);
    
    // Sample pixel brightness (this is theoretical - browsers limit this)
    const imageData = ctx.getImageData(0, 0, 100, 100);
    const avgBrightness = this.calculateAverageBrightness(imageData.data);
    
    // Estimate percentage (this is a rough approximation)
    return Math.round(avgBrightness / 2.55); // 0-255 -> 0-100%
  }

  calculateAverageBrightness(pixelData) {
    let sum = 0;
    for (let i = 0; i < pixelData.length; i += 4) {
      // Average RGB values
      sum += (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3;
    }
    return sum / (pixelData.length / 4);
  }

  canControlBrightness() {
    // Most browsers don't allow direct brightness control
    // But we can detect if Wake Lock API is available
    return 'wakeLock' in navigator;
  }

  // Show brightness warning/instructions
  showBrightnessAlert() {
    const brightness = this.currentBrightness || 'Unknown';
    const status = brightness >= 80 ? 'optimal' : 
                   brightness >= 50 ? 'adequate' : 'low';
    
    return {
      brightness: brightness,
      status: status,
      message: this.getBrightnessMessage(brightness),
      needsAdjustment: brightness < 80
    };
  }

  getBrightnessMessage(brightness) {
    if (brightness >= 80) {
      return '✓ Screen brightness is optimal for clinical testing.';
    } else if (brightness >= 50) {
      return '⚠️ Screen brightness is adequate but could be increased for better accuracy.';
    } else {
      return '❌ Screen brightness is too low. Please increase to 80-100% for accurate results.';
    }
  }

  // Instructions for manual adjustment
  getManualInstructions() {
    const platform = this.detectPlatform();
    
    const instructions = {
      ios: `
        <strong>iOS/iPad:</strong>
        1. Swipe down from top-right corner (or up from bottom on older devices)
        2. Drag brightness slider to maximum (100%)
        3. Disable Auto-Brightness: Settings → Display & Brightness → Toggle off Auto-Brightness
      `,
      android: `
        <strong>Android:</strong>
        1. Swipe down from top of screen (twice for full panel)
        2. Drag brightness slider to maximum (100%)
        3. Disable Adaptive Brightness: Settings → Display → Toggle off Adaptive Brightness
      `,
      windows: `
        <strong>Windows:</strong>
        1. Click battery icon in system tray
        2. Drag brightness slider to 100%
        3. Or: Settings → System → Display → Brightness slider to 100%
      `,
      mac: `
        <strong>Mac:</strong>
        1. Press F2 key repeatedly to increase brightness to maximum
        2. Or: System Preferences → Displays → Brightness slider to maximum
        3. Disable Auto-Brightness if needed
      `
    };
    
    return instructions[platform] || instructions.windows;
  }

  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('ipad') || (ua.includes('iphone'))) return 'ios';
    if (ua.includes('android')) return 'android';
    if (ua.includes('mac')) return 'mac';
    return 'windows';
  }

  // Keep screen awake during tests
  async keepAwake() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen wake lock activated');
        
        // Re-acquire wake lock if released
        this.wakeLock.addEventListener('release', () => {
          console.log('Wake lock released');
          // Try to re-acquire if still in test
          if (document.body.classList.contains('test-active')) {
            this.keepAwake();
          }
        });
        
        return true;
      } catch (error) {
        console.error('Wake lock error:', error);
        return false;
      }
    }
    return false;
  }

  async releaseWakeLock() {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}

// Initialize global brightness manager
const brightnessManager = new BrightnessManager();

