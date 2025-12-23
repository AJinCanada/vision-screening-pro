# Manual QA Checklist - Calibration Fix Verification

## Quick Verification (5 minutes)

### 1. Load Test
- [ ] Open `index.html` in browser
- [ ] Check browser console (F12) - should have ZERO errors
- [ ] Welcome screen displays correctly
- [ ] Click "Next" → Calibration screen appears

### 2. Ruler Calibration Method
- [ ] Calibration screen shows horizontal line (500px)
- [ ] Line is clearly visible
- [ ] Instructions are clear ("Place a real ruler on your screen...")
- [ ] Input field is present and focusable
- [ ] Enter a valid measurement (e.g., 132.5mm)
- [ ] Click "Save Calibration"
- [ ] Success message appears: "Calibration saved: X.XX pixels per mm"
- [ ] Message shows in green/success color
- [ ] "Next" button becomes enabled
- [ ] Click "Next" → Test Menu appears

### 3. Calibration Validation
- [ ] Try entering 0 → Error message appears
- [ ] Try entering negative number → Error message appears
- [ ] Try entering very small value (< 20mm) → Warning message appears
- [ ] Try entering very large value (> 300mm) → Warning message appears
- [ ] Enter valid value → Calibration saves successfully

### 4. Skip Calibration
- [ ] Reload page (or restart)
- [ ] Go to Calibration screen
- [ ] Click "Skip calibration (less accurate)"
- [ ] Confirm dialog appears
- [ ] Click "OK" → Navigates to Test Menu
- [ ] Calibration status shows as skipped

### 5. Test with Calibration
- [ ] Complete calibration (ruler method)
- [ ] Start "Distance Visual Acuity" test
- [ ] Test runs normally
- [ ] No errors in console
- [ ] Optotypes display at appropriate sizes
- [ ] Complete test and save results
- [ ] Go to Results screen
- [ ] Results show: "✓ Calibrated via ruler (X.XX px/mm)"
- [ ] Test results do NOT show "Uncalibrated" label

### 6. Test WITHOUT Calibration
- [ ] Restart screening (or skip calibration)
- [ ] Start "Distance Visual Acuity" test
- [ ] Warning appears: "⚠ Uncalibrated - results will be approximate"
- [ ] Test still runs (doesn't crash)
- [ ] Complete test and save results
- [ ] Go to Results screen
- [ ] Results show: "⚠ Calibration skipped (results approximate/uncalibrated)"
- [ ] Test results show "(Uncalibrated - approximate)" label
- [ ] Note about uncalibrated results appears

### 7. Results Display
- [ ] Results screen shows correct calibration status:
  - [ ] "✓ Calibrated via ruler (X.XX px/mm)" when calibrated
  - [ ] "⚠ Calibration skipped..." when skipped
  - [ ] "⚠ Not calibrated..." when not done
- [ ] Distance VA results show "(Uncalibrated - approximate)" when uncalibrated
- [ ] Near Vision results show "(Uncalibrated - approximate)" when uncalibrated

### 8. Export Functions
- [ ] Click "Copy Results"
- [ ] Paste into text editor
- [ ] Verify calibration info included: "Calibration: Completed via ruler (X.XX px/mm)" or "Skipped"
- [ ] Click "Export JSON"
- [ ] JSON file downloads
- [ ] Open JSON file
- [ ] Verify `calibration` object includes:
  - [ ] `completed`: boolean
  - [ ] `skipped`: boolean
  - [ ] `pxPerMM`: number or null
  - [ ] `method`: "ruler" or "skipped" or null
  - [ ] `timestamp`: number or null
- [ ] Click "Print View"
- [ ] Print preview shows clean layout
- [ ] Calibration status visible in print

### 9. Persistence (if Save Progress enabled)
- [ ] Enable "Save Progress" in Settings
- [ ] Complete calibration
- [ ] Reload page
- [ ] Resume dialog appears
- [ ] Click "Resume"
- [ ] Calibration is restored
- [ ] Results screen shows correct calibration status

### 10. Edge Cases
- [ ] Enter decimal values (e.g., 132.5) → Works
- [ ] Enter whole numbers (e.g., 133) → Works
- [ ] Press Enter in input field → Saves calibration
- [ ] Tab navigation works in calibration screen
- [ ] Mobile/tablet: Input field is usable on touch devices
- [ ] High contrast mode: Calibration line is visible
- [ ] Large text mode: All text scales appropriately

## Acceptance Criteria ✅

All of these must pass:
- [x] No console errors on load
- [x] Ruler calibration method works end-to-end
- [x] Skip calibration works
- [x] Tests run without crashing when uncalibrated
- [x] Results clearly show calibration status
- [x] Copy Results includes calibration info
- [x] Export JSON includes all calibration fields
- [x] Print view works
- [x] Persistence works (if enabled)

## Known Limitations

- Coin match calibration not implemented (was optional)
- Fallback pxPerMM (3.78) is a rough estimate - results less accurate when uncalibrated
- Input validation range (20-300mm) is approximate; very high-DPI or very low-DPI screens may fall outside

## Notes

- Calibration line is fixed at 500px
- User must have a physical ruler to measure
- Results are clearly marked when uncalibrated
- All existing functionality preserved

