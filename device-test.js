// Device Compatibility Tester - Comprehensive device testing
class DeviceTester {
  constructor() {
    this.tests = [];
    this.results = {};
  }

  async runAllTests() {
    const container = document.getElementById('device-setup') || document.getElementById('test-results-container');
    
    if (!container) {
      console.error('Container not found for device tests');
      return;
    }
    
    container.innerHTML = `
      <div class="device-test-page">
        <h2>Device Compatibility Test</h2>
        <p>Testing your device for clinical vision screening...</p>
        
        <div id="test-progress" class="test-progress"></div>
        
        <div id="test-results" class="test-results-grid">
          <!-- Results will be inserted here -->
        </div>
        
        <div id="test-summary" class="test-summary">
          <!-- Summary will be inserted here -->
        </div>
      </div>
    `;
    
    const tests = [
      { name: 'Screen Resolution', fn: () => this.testResolution() },
      { name: 'Screen Size', fn: () => this.testScreenSize() },
      { name: 'Pixel Density', fn: () => this.testPixelDensity() },
      { name: 'Color Depth', fn: () => this.testColorDepth() },
      { name: 'Brightness Control', fn: () => this.testBrightness() },
      { name: 'Screen Orientation', fn: () => this.testOrientation() },
      { name: 'Touch Support', fn: () => this.testTouch() },
      { name: 'Wake Lock API', fn: () => this.testWakeLock() },
      { name: 'Fullscreen API', fn: () => this.testFullscreen() },
      { name: 'Local Storage', fn: () => this.testStorage() },
      { name: 'Canvas Support', fn: () => this.testCanvas() },
      { name: 'Font Rendering', fn: () => this.testFonts() }
    ];
    
    const progressEl = document.getElementById('test-progress');
    const resultsEl = document.getElementById('test-results');
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Update progress
      progressEl.innerHTML = `
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(i / tests.length) * 100}%"></div>
        </div>
        <p>Running: ${test.name} (${i + 1}/${tests.length})</p>
      `;
      
      // Run test
      const result = await test.fn();
      this.results[test.name] = result;
      
      // Display result
      const resultHTML = `
        <div class="test-result-card ${result.status}">
          <div class="test-icon">${result.status === 'pass' ? '✓' : result.status === 'warning' ? '⚠️' : '✗'}</div>
          <h4>${test.name}</h4>
          <p class="test-value">${result.value}</p>
          <p class="test-message">${result.message}</p>
        </div>
      `;
      
      resultsEl.innerHTML += resultHTML;
      
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Show summary
    this.showSummary();
  }

  testResolution() {
    const width = window.screen.width * window.devicePixelRatio;
    const height = window.screen.height * window.devicePixelRatio;
    const megapixels = ((width * height) / 1000000).toFixed(2);
    
    const status = (width >= 1920 && height >= 1080) ? 'pass' : 
                   (width >= 1280 && height >= 720) ? 'warning' : 'fail';
    
    return {
      status: status,
      value: `${width} × ${height}px (${megapixels}MP)`,
      message: status === 'pass' ? 'Excellent resolution' : 
               status === 'warning' ? 'Adequate but lower resolution may affect accuracy' :
               'Resolution too low for accurate testing'
    };
  }

  testScreenSize() {
    // Physical size estimation
    const dpi = window.devicePixelRatio * 96;
    const diagonalPx = Math.sqrt(
      Math.pow(window.screen.width, 2) + Math.pow(window.screen.height, 2)
    );
    const diagonalInches = diagonalPx / dpi;
    
    const status = diagonalInches >= 10 ? 'pass' : 
                   diagonalInches >= 6 ? 'warning' : 'fail';
    
    return {
      status: status,
      value: `${diagonalInches.toFixed(1)}" diagonal (estimated)`,
      message: status === 'pass' ? 'Screen size suitable for testing' :
               status === 'warning' ? 'Small screen - position carefully' :
               'Screen too small - use larger device'
    };
  }

  testPixelDensity() {
    const dpi = window.devicePixelRatio * 96;
    const status = dpi >= 120 ? 'pass' : dpi >= 96 ? 'warning' : 'fail';
    
    return {
      status: status,
      value: `${Math.round(dpi)} DPI`,
      message: status === 'pass' ? 'High pixel density - excellent clarity' :
               status === 'warning' ? 'Standard pixel density' :
               'Low pixel density may affect letter clarity'
    };
  }

  testColorDepth() {
    const depth = window.screen.colorDepth;
    const status = depth >= 24 ? 'pass' : 'warning';
    
    return {
      status: status,
      value: `${depth}-bit`,
      message: status === 'pass' ? 'Full color support' : 'Limited color depth'
    };
  }

  async testBrightness() {
    const brightness = await brightnessManager.detectBrightness();
    const status = brightness.canControl ? 'pass' : 'warning';
    
    return {
      status: status,
      value: brightness.estimated ? `~${brightness.estimated}%` : 'Unknown',
      message: brightness.canControl ? 
        'Can control screen wake lock' : 
        'Manual brightness adjustment required'
    };
  }

  testOrientation() {
    const canLock = 'orientation' in screen && 'lock' in screen.orientation;
    const current = screen.orientation ? screen.orientation.type : 'unknown';
    
    return {
      status: canLock ? 'pass' : 'warning',
      value: current,
      message: canLock ? 
        'Can lock screen orientation' : 
        'Manual orientation lock recommended'
    };
  }

  testTouch() {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return {
      status: 'pass',
      value: hasTouch ? 'Supported' : 'Not detected',
      message: hasTouch ? 'Touch input available' : 'Mouse/trackpad input'
    };
  }

  async testWakeLock() {
    const supported = 'wakeLock' in navigator;
    let status = 'fail';
    
    if (supported) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        await wakeLock.release();
        status = 'pass';
      } catch (e) {
        status = 'warning';
      }
    }
    
    return {
      status: status,
      value: supported ? 'Supported' : 'Not Supported',
      message: status === 'pass' ? 
        'Can keep screen awake during tests' :
        'Screen may dim during long tests'
    };
  }

  testFullscreen() {
    const supported = document.fullscreenEnabled || 
                     document.webkitFullscreenEnabled;
    
    return {
      status: supported ? 'pass' : 'warning',
      value: supported ? 'Supported' : 'Not Supported',
      message: supported ? 
        'Can enter fullscreen mode' :
        'Fullscreen not available'
    };
  }

  testStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return {
        status: 'pass',
        value: 'Available',
        message: 'Can save calibration and results'
      };
    } catch (e) {
      return {
        status: 'fail',
        value: 'Blocked',
        message: 'Cannot save data - check privacy settings'
      };
    }
  }

  testCanvas() {
    const canvas = document.createElement('canvas');
    const supported = !!(canvas.getContext && canvas.getContext('2d'));
    
    return {
      status: supported ? 'pass' : 'fail',
      value: supported ? 'Supported' : 'Not Supported',
      message: supported ? 
        'Canvas rendering available' :
        'Critical feature missing'
    };
  }

  testFonts() {
    // Test if monospace fonts render correctly
    const span = document.createElement('span');
    span.style.fontFamily = 'Courier New, monospace';
    span.style.fontSize = '20px';
    span.textContent = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    document.body.appendChild(span);
    
    const width = span.offsetWidth;
    document.body.removeChild(span);
    
    const status = width > 0 ? 'pass' : 'fail';
    
    return {
      status: status,
      value: status === 'pass' ? 'Loaded' : 'Missing',
      message: status === 'pass' ? 
        'Sloan letters will render correctly' :
        'Font rendering issues detected'
    };
  }

  showSummary() {
    const summaryEl = document.getElementById('test-summary');
    
    const totalTests = Object.keys(this.results).length;
    const passed = Object.values(this.results).filter(r => r.status === 'pass').length;
    const warnings = Object.values(this.results).filter(r => r.status === 'warning').length;
    const failed = Object.values(this.results).filter(r => r.status === 'fail').length;
    
    const overallStatus = failed === 0 && warnings === 0 ? 'excellent' :
                         failed === 0 ? 'good' : 'poor';
    
    const recommendation = overallStatus === 'excellent' ? 
      '✓ Your device is fully compatible and ready for clinical vision screening.' :
      overallStatus === 'good' ?
      '⚠️ Your device is compatible but has some limitations. Results may vary slightly.' :
      '✗ Your device has significant limitations. Consider using a different device for best results.';
    
    summaryEl.innerHTML = `
      <div class="summary-card summary-${overallStatus}">
        <h3>Test Summary</h3>
        <div class="summary-stats">
          <div class="stat-item stat-pass">
            <span class="stat-number">${passed}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="stat-item stat-warning">
            <span class="stat-number">${warnings}</span>
            <span class="stat-label">Warnings</span>
          </div>
          <div class="stat-item stat-fail">
            <span class="stat-number">${failed}</span>
            <span class="stat-label">Failed</span>
          </div>
        </div>
        <p class="summary-recommendation">${recommendation}</p>
        <button id="continue-to-calibration" class="btn btn-primary btn-lg">
          Continue to Device Setup →
        </button>
      </div>
    `;
    
    const continueBtn = document.getElementById('continue-to-calibration');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        // Show device setup section
        const deviceSetup = document.getElementById('device-setup');
        if (deviceSetup) {
          deviceSetup.innerHTML = `
            <div class="content">
              <h2>Device Setup</h2>
              <p style="background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>⚠️ IMPORTANT: Hold your device HORIZONTALLY (landscape mode)</strong>
              </p>
              <h3>Select Your Device Screen Size:</h3>
              <div class="device-selection">
                <!-- Device buttons will be regenerated by initDeviceSetup -->
              </div>
              <div class="nav-buttons" style="text-align: center; margin-top: 30px;">
                <button type="button" id="device-next-btn" class="btn btn-primary" disabled style="min-height: 60px; font-size: 1.1rem; padding: 1rem 2rem;">Next - Continue to Tests</button>
              </div>
            </div>
          `;
          // Reinitialize device setup
          if (typeof initDeviceSetup === 'function') {
            initDeviceSetup();
          }
        }
      });
    }
  }
}

// Initialize device tester
const deviceTester = new DeviceTester();

