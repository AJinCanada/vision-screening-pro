# Manual QA Checklist - Vision Screening PRO

## Quick Start Verification
- [ ] Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
- [ ] Welcome screen displays correctly with disclaimer
- [ ] "Next" button is enabled and navigates to Calibration screen
- [ ] "Back" button is disabled on Welcome screen (as expected)

## Calibration Module
- [ ] Calibration screen shows draggable/resizable rectangle
- [ ] Rectangle can be dragged by clicking and moving
- [ ] Rectangle can be resized using corner handles
- [ ] Aspect ratio remains locked (credit card proportions)
- [ ] "Calibration Complete" button calculates and stores pxPerMM
- [ ] Status message shows calibration result
- [ ] "Skip calibration" option works and shows warning
- [ ] After calibration/skip, "Next" button enables and proceeds to Test Menu

## Test Menu
- [ ] All 7 test modules are displayed as cards
- [ ] Each test card is clickable and keyboard accessible (Enter/Space)
- [ ] Completed tests show "✓ Completed" status
- [ ] Clicking a test navigates to that test's flow
- [ ] "Next" button only enables after at least one test is completed
- [ ] Progress indicator shows "Step 3 of 5"

## Distance Visual Acuity Test
- [ ] Purpose screen displays and "Continue" works
- [ ] Setup instructions are clear
- [ ] Distance selection (1m/2m/3m) works
- [ ] Eye selection (OD/OS/OU) works
- [ ] Optotype displays at appropriate size based on distance and calibration
- [ ] Arrow buttons (Up/Down/Left/Right) respond to clicks
- [ ] Keyboard arrows (↑↓←→) work for answering
- [ ] Correct answers make optotype smaller
- [ ] Incorrect answers make optotype larger
- [ ] "Not sure / Unable" option works
- [ ] Test completes after multiple trials or 2 wrong answers
- [ ] Review screen shows results for each eye tested
- [ ] "Save Results" returns to test menu
- [ ] Test shows as completed in menu after saving

## Near Vision Reading Test
- [ ] Purpose and setup screens work
- [ ] Reading distance selection (30/40/50 cm) works
- [ ] Reading text displays at different sizes
- [ ] "Readable" button progresses to smaller text
- [ ] "Not Readable" records previous size as best
- [ ] Test progresses through size levels appropriately
- [ ] Review shows best readable size and distance
- [ ] Results save correctly

## Amsler Grid Test
- [ ] Purpose and setup screens work
- [ ] Grid renders correctly with central dot
- [ ] Grid lines are visible and straight
- [ ] "Lines look straight" button works
- [ ] "Some lines wavy" button works
- [ ] "Missing/blurred area" button works
- [ ] "Enable marking tool" toggles marking mode
- [ ] Clicking/tapping on grid marks red points when marking enabled
- [ ] Marked points persist and are visible
- [ ] Review shows selected result and marked point count
- [ ] Results save correctly

## Contrast Sensitivity Test
- [ ] Purpose and setup screens work
- [ ] Contrast target displays with varying contrast levels
- [ ] Four number options (1-4) are clickable
- [ ] Correct answer progresses to lower contrast
- [ ] Incorrect answer records previous level as best
- [ ] Test stops after 10 trials or failure
- [ ] "I can't do this test" option works
- [ ] Review shows best contrast level achieved
- [ ] Results save correctly

## Glare Sensitivity Test
- [ ] Purpose and setup screens work
- [ ] Glare target displays with overlay
- [ ] Slider adjusts glare intensity (0-10)
- [ ] Slider value updates display in real-time
- [ ] Glare overlay opacity changes with slider
- [ ] "Comfortable" / "Uncomfortable" / "Target Unreadable" buttons work
- [ ] Review shows tolerance level and response
- [ ] Results save correctly

## Color Vision Test
- [ ] Purpose and setup screens work
- [ ] Color grid displays 25 dots (5x5)
- [ ] One dot is subtly different
- [ ] Clicking correct dot advances to next trial
- [ ] Clicking wrong dot records incorrect answer
- [ ] Test runs 5 trials total
- [ ] Difficulty increases with each trial
- [ ] Review shows score (X/5) and percentage
- [ ] Interpretation message appears based on score
- [ ] Results save correctly

## Functional Vision Questionnaire
- [ ] Purpose screen works
- [ ] Questions display one at a time
- [ ] Progress indicator shows "Question X of 10"
- [ ] Four answer options (Never/Sometimes/Often/Always) work
- [ ] Answering advances to next question
- [ ] All 10 questions are presented
- [ ] Review shows overall score and category scores (Reading/Mobility/Glare)
- [ ] Results save correctly

## Results Summary Screen
- [ ] Results screen displays after completing tests and clicking "Next" from menu
- [ ] Date and time are shown
- [ ] Calibration status is displayed (✓ Calibrated / ⚠ Skipped / ⚠ Not calibrated)
- [ ] Each completed test shows in results with formatted output
- [ ] Result values are clearly displayed
- [ ] Interpretation text appears for each test
- [ ] "Next Steps" section is visible
- [ ] All export buttons are present

## Export Functionality
- [ ] "Copy Results" button copies formatted text to clipboard
- [ ] Copied text includes date, calibration status, and all test results
- [ ] "Print View" button triggers print dialog
- [ ] Print preview shows clean layout (check in print preview)
- [ ] Header and navigation are hidden in print view
- [ ] "Export JSON" button downloads a JSON file
- [ ] Downloaded JSON contains all state data (calibration, results, settings)
- [ ] JSON file is valid and parseable

## Settings Modal
- [ ] Settings button (⚙️) opens modal
- [ ] Modal is keyboard accessible (Tab navigation works)
- [ ] Focus is trapped within modal
- [ ] Escape key closes modal
- [ ] Clicking overlay closes modal
- [ ] Close button (✕) closes modal
- [ ] All 5 toggles are present and functional:
  - [ ] High Contrast Mode (changes theme)
  - [ ] Large Text Mode (increases font sizes)
  - [ ] Reduce Motion (disables animations)
  - [ ] Save Progress (enables localStorage)
  - [ ] Caregiver Mode (increases button sizes)
- [ ] Settings persist when modal is closed
- [ ] Settings apply immediately when toggled

## Accessibility Features
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (outline on focus)
- [ ] ARIA labels are present on custom controls
- [ ] Screen reader announcements work (test with VoiceOver/NVDA)
- [ ] Touch targets are at least 44px (check on mobile)
- [ ] High contrast mode provides sufficient contrast
- [ ] Large text mode increases all text sizes appropriately
- [ ] Color is not the only indicator (icons/text also used)

## Responsive Design
- [ ] App works on desktop (1920x1080, 1366x768)
- [ ] App works on tablet (768x1024)
- [ ] App works on mobile (375x667, 414x896)
- [ ] Test grids adapt to screen size
- [ ] Buttons remain accessible on small screens
- [ ] Text remains readable at all sizes
- [ ] Navigation doesn't overlap content

## Persistence (LocalStorage)
- [ ] With "Save Progress" enabled, data saves after each action
- [ ] Reloading page with saved data shows resume dialog
- [ ] "Resume" button restores previous state
- [ ] "Start New" button clears data and starts fresh
- [ ] Calibration data persists
- [ ] Test results persist
- [ ] Settings persist
- [ ] "Restart Screening" button clears all data after confirmation

## Error Handling
- [ ] App handles missing calibration gracefully
- [ ] Tests work even if calibration was skipped (with warnings)
- [ ] No JavaScript errors in console
- [ ] Invalid states don't crash the app
- [ ] Navigation prevents invalid state transitions

## Performance
- [ ] App loads quickly (< 2 seconds)
- [ ] Screen transitions are smooth
- [ ] No lag when interacting with tests
- [ ] Canvas rendering (Amsler grid) is responsive
- [ ] No memory leaks (test by completing multiple tests)

## Cross-Browser Testing
- [ ] Chrome/Edge (Chromium) - Full functionality
- [ ] Firefox - Full functionality
- [ ] Safari - Full functionality
- [ ] Mobile Safari (iOS) - Touch interactions work
- [ ] Chrome Mobile (Android) - Touch interactions work

## Edge Cases
- [ ] Completing same test twice overwrites previous result
- [ ] Skipping calibration doesn't break tests
- [ ] Completing no tests shows appropriate message on results screen
- [ ] Very small screen sizes (320px width) remain usable
- [ ] Very large screen sizes (4K) scale appropriately

## Final Acceptance
- [ ] All 7 test modules are fully functional
- [ ] Results summary displays all completed tests
- [ ] Export functions (Copy/Print/JSON) all work
- [ ] Settings modal is fully accessible
- [ ] App can be used entirely with keyboard
- [ ] App works on mobile devices
- [ ] No critical bugs or broken functionality
- [ ] Code is self-contained (no external dependencies)

---

## Quick Test Sequence (5 minutes)
1. Open index.html
2. Click "Next" through Welcome
3. Complete calibration (or skip)
4. Start "Distance Visual Acuity" test
5. Complete test (select distance, eye, answer a few optotypes)
6. Return to menu, verify test shows as completed
7. Click "Next" to Results
8. Verify results display
9. Click "Copy Results" - verify clipboard
10. Open Settings, toggle High Contrast, verify change
11. Close Settings
12. Reload page (if save enabled), verify resume dialog

If all above pass, core functionality is working!

