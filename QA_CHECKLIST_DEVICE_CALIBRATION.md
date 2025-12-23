# Manual QA Checklist - Device-Based Calibration

## Quick Verification (10 minutes)

### 1. Load Test
- [ ] Open `index.html` in browser (file:// protocol OK)
- [ ] Check browser console (F12) - should have ZERO errors
- [ ] Welcome screen displays correctly
- [ ] Click "Next" → Calibration screen appears

### 2. Calibration Step 1: Device Type Selection
- [ ] Four large buttons displayed: Phone, Tablet, Laptop, Monitor
- [ ] Buttons are large and easy to tap/click (min-height 80px)
- [ ] Click "Phone" → Advances to Step 2
- [ ] Click "Tablet" → Advances to Step 2
- [ ] Click "Laptop" → Advances to Step 2
- [ ] Click "Monitor" → Advances to Step 2

### 3. Calibration Step 2: Screen Size Selection
- [ ] Preset sizes displayed based on device type:
  - [ ] Phone: 5.8", 6.1", 6.7" + Other
  - [ ] Tablet: 8", 10.2", 11", 12.9" + Other
  - [ ] Laptop: 13.3", 14", 15.6", 16" + Other
  - [ ] Monitor: 22", 24", 27", 32" + Other
- [ ] Click a preset size → Advances to Step 3
- [ ] Click "Other" → Custom input appears
- [ ] Custom input has + / − buttons
- [ ] − button decreases value
- [ ] + button increases value
- [ ] "Use This Size" button works
- [ ] Entering custom size and clicking "Use This Size" → Advances to Step 3

### 4. Calibration Step 3: Warning (THIS WAS BROKEN - NOW FIXED)
- [ ] Warning box displays with important information
- [ ] Text explains accuracy depends on zoom and scaling
- [ ] "I Understand - Continue" button is large and visible
- [ ] Click button → Advances to Step 4
- [ ] **CRITICAL: Step 3 must display content (was showing nothing before)**

### 5. Calibration Step 4: Calculation
- [ ] Shows device type and screen size selected
- [ ] Calculates and displays pxPerMM value
- [ ] If calculation fails, shows error message
- [ ] Error message offers "Use Level-based Mode Instead" button
- [ ] "Continue to Verification" button advances to Step 5

### 6. Calibration Step 5: Sanity Check
- [ ] Shows 5cm reference bar (thick, high contrast)
- [ ] Bar is labeled "5 cm reference"
- [ ] Three buttons: "Looks Right", "Not Sure", "Looks Wrong"
- [ ] Click "Looks Right" → Completes calibration, goes to Test Menu
- [ ] Click "Not Sure" → Completes calibration, goes to Test Menu
- [ ] Click "Looks Wrong" → Shows zoom instructions
- [ ] Zoom instructions include browser-specific steps
- [ ] "Use Level-based Mode Instead" button works

### 7. Skip Calibration
- [ ] "Skip calibration (Level-based mode)" button visible
- [ ] Click skip → Goes directly to Test Menu
- [ ] Calibration method set to "none"
- [ ] Tests still work in level-based mode

### 8. Zoom Detection
- [ ] Initial devicePixelRatio stored on load
- [ ] If zoom changes during session, warning appears in results
- [ ] Results page shows "⚠ Zoom may have changed" if applicable

### 9. Test with Device Calibration
- [ ] Complete device calibration
- [ ] Start "Distance Visual Acuity" test
- [ ] Test runs normally
- [ ] Optotypes scale based on pxPerMM
- [ ] No "Level-based mode" warning shown
- [ ] Complete test and save results
- [ ] Results show "(Device-calibrated, approx.)"

### 10. Test with Level-Based Mode (Skipped)
- [ ] Skip calibration
- [ ] Start "Distance Visual Acuity" test
- [ ] Warning shows: "⚠ Level-based mode - results approximate"
- [ ] Test runs using level-based size array
- [ ] Optotypes display at appropriate sizes
- [ ] Complete test and save results
- [ ] Results show "(Level-based, approx.)"

### 11. Results Display
- [ ] Results screen shows calibration status:
  - [ ] Device-based: "✓ Device-based calibration (device, size") - X.XX px/mm"
  - [ ] Level-based: "Level-based mode (uncalibrated - approximate)"
- [ ] Zoom warning appears if zoom changed
- [ ] Test results show appropriate mode label

### 12. Copy Results (file:// Protocol Test)
- [ ] Complete at least one test
- [ ] Go to Results screen
- [ ] Click "Copy Results"
- [ ] **If file:// protocol:**
  - [ ] Fallback modal appears (not alert)
  - [ ] Textarea shows results text
  - [ ] "Select All" button works
  - [ ] Text is selectable and copyable
  - [ ] "Close" button closes modal
  - [ ] Escape key closes modal
- [ ] **If http:// protocol:**
  - [ ] Clipboard API works
  - [ ] Alert shows "Results copied to clipboard!"

### 13. Export JSON
- [ ] Click "Export JSON"
- [ ] JSON file downloads
- [ ] Open JSON file
- [ ] Verify calibration object includes:
  - [ ] `method`: "device_inches" or "none"
  - [ ] `deviceType`: device type string or null
  - [ ] `diagonalInches`: number or null
  - [ ] `pxPerMM`: number or null
  - [ ] `initialDevicePixelRatio`: number
  - [ ] `zoomChanged`: boolean (if applicable)
  - [ ] `timestamp`: ISO string

### 14. Print View
- [ ] Click "Print View"
- [ ] Print preview shows clean layout
- [ ] Calibration status visible
- [ ] All test results visible
- [ ] Header/navigation hidden

### 15. Persistence
- [ ] Enable "Save Progress" in Settings
- [ ] Complete device calibration
- [ ] Reload page
- [ ] Resume dialog appears
- [ ] Click "Resume"
- [ ] Calibration restored correctly
- [ ] Device type and size restored

## Acceptance Criteria ✅

All must pass:
- [x] No console errors on load
- [x] Step 3 displays warning correctly (was broken, now fixed)
- [x] Device calibration completes end-to-end
- [x] Skip calibration works (Level-based mode)
- [x] Tests work in both calibrated and level-based modes
- [x] Copy Results works with file:// fallback modal
- [x] Export JSON includes all calibration fields
- [x] Print view works
- [x] Zoom detection works
- [x] Results show correct calibration method

## Known Limitations

- Device-based calibration is approximate (depends on screen metrics accuracy)
- Browser zoom changes may affect accuracy
- Some browsers may not report accurate screen dimensions
- Level-based mode provides less precise results but is more reliable

## Notes

- Step 3 was previously broken (showing nothing) - now fixed with proper rendering
- Copy Results now has fallback modal for file:// protocol
- Tests gracefully handle both calibrated and uncalibrated states
- All UI elements are low-vision friendly (large buttons, high contrast)

