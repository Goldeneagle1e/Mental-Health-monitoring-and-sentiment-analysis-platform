# Testing Guide

## Manual Testing Workflow

### 1. Authentication Flow

**Test Case 1.1: Login**
- [ ] Navigate to home page
- [ ] Enter email and password
- [ ] Click "Sign In"
- [ ] Should redirect to dashboard
- [ ] User data should be stored in localStorage

**Test Case 1.2: Sign Up**
- [ ] Click "Don't have an account? Sign up"
- [ ] Enter new email and password
- [ ] Click "Sign Up"
- [ ] Should redirect to dashboard
- [ ] New user should be created

**Test Case 1.3: Logout**
- [ ] Click "Logout" button
- [ ] Should redirect to login page
- [ ] localStorage should be cleared

### 2. Text Analysis

**Test Case 2.1: Basic Text Analysis**
- [ ] Go to "New Analysis"
- [ ] Select "Manual Entry" tab
- [ ] Enter sample text: "I'm feeling really anxious and worried about everything"
- [ ] Click "Analyze Content"
- [ ] Should show results with anxiety score > 50
- [ ] Should display relevant indicators

**Test Case 2.2: Empty Input**
- [ ] Try to analyze without entering text
- [ ] Should show error: "Please enter content to analyze"

**Test Case 2.3: With Source**
- [ ] Enter text and source "Twitter"
- [ ] Analyze
- [ ] Source should be recorded in history

### 3. Image Analysis

**Test Case 3.1: Single Image Upload**
- [ ] Go to "New Analysis"
- [ ] Select "Images/GIFs" tab
- [ ] Drag and drop an image
- [ ] Should show preview
- [ ] Click "Analyze Content"
- [ ] Should complete analysis

**Test Case 3.2: Multiple Images**
- [ ] Upload 3 images
- [ ] Should show all previews
- [ ] Analyze
- [ ] Should process all images

**Test Case 3.3: Invalid File Type**
- [ ] Try to upload a .txt file
- [ ] Should show error: "Invalid file type"

**Test Case 3.4: File Too Large**
- [ ] Try to upload file > 10MB
- [ ] Should show error: "File too large"

**Test Case 3.5: Remove Image**
- [ ] Upload image
- [ ] Click X button on preview
- [ ] Image should be removed

### 4. Combined Analysis

**Test Case 4.1: Text + Images**
- [ ] Go to "New Analysis"
- [ ] Select "Combined" tab
- [ ] Enter text
- [ ] Upload images
- [ ] Click "Analyze Content"
- [ ] Should show combined results

**Test Case 4.2: Images Only**
- [ ] Upload images without text
- [ ] Should still analyze
- [ ] Results should be based on images

### 5. Results Display

**Test Case 5.1: High Risk Results**
- [ ] Analyze content that triggers high risk
- [ ] Should show red warning
- [ ] Should display crisis resources

**Test Case 5.2: Moderate Risk Results**
- [ ] Analyze content with moderate indicators
- [ ] Should show yellow warning
- [ ] Should display recommendations

**Test Case 5.3: Low Risk Results**
- [ ] Analyze neutral content
- [ ] Should show green indicator
- [ ] Should display general recommendations

**Test Case 5.4: Download Report**
- [ ] Click "Download Report" button
- [ ] Should generate and download report

### 6. Analysis History

**Test Case 6.1: View History**
- [ ] Perform multiple analyses
- [ ] Click "Analysis History"
- [ ] Should list all analyses
- [ ] Should show risk level for each

**Test Case 6.2: View Details**
- [ ] Click on an analysis in history
- [ ] Should show full details
- [ ] Should display all metrics

**Test Case 6.3: Delete Analysis**
- [ ] Click delete button on analysis
- [ ] Should remove from history
- [ ] Should update localStorage

**Test Case 6.4: Empty History**
- [ ] Clear all analyses
- [ ] Should show "No analyses yet" message

### 7. Edge Cases

**Test Case 7.1: Rapid Submissions**
- [ ] Submit multiple analyses quickly
- [ ] Should handle without errors
- [ ] All should be saved

**Test Case 7.2: Browser Refresh**
- [ ] Perform analysis
- [ ] Refresh page
- [ ] Should maintain login state
- [ ] History should persist

**Test Case 7.3: localStorage Corruption**
- [ ] Manually corrupt localStorage data
- [ ] App should handle gracefully
- [ ] Should reset to default state

## Performance Testing

- [ ] Page load time < 2 seconds
- [ ] Analysis completion < 5 seconds
- [ ] Image upload < 3 seconds
- [ ] History loading < 1 second

## Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Form labels properly associated

## Security Testing

- [ ] No sensitive data in localStorage
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Input validation
