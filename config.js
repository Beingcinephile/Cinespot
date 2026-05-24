// ============================================
// CONFIGURATION FILE - EDIT THIS!
// ============================================

// IMPORTANT: Replace this with YOUR Google Sheet ID
// Your Sheet ID is the long string in your Google Sheets URL
// Example: 1AbCDeFgHiJkLmNoPqRsTuVwXyZ1234567890
// Replace the placeholder with your actual Sheet ID
const GOOGLE_SHEET_ID = '1Jv3rzqQP0RI2gZBSNoxRHtqYQHnZ12Ia9dO3y-N6lB4';

// Admin password - you can change this later from admin panel
let ADMIN_PASSWORD = 'beingruksar01';

// Backup security (in case you forget admin password)
const BACKUP_QUESTION = 'What is your favorite movie?';
const BACKUP_ANSWER = 'Inception';  // Change this to anything you'll remember

// DO NOT CHANGE THE LINE BELOW
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`;

// Don't modify below this line
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GOOGLE_SHEET_ID, ADMIN_PASSWORD, BACKUP_QUESTION, BACKUP_ANSWER, SHEET_URL };
}
