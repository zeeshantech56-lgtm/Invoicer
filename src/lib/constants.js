// src/lib/constants.js

// 72 hours in milliseconds. 
// This is the single source of truth for the free trial duration.
// IMPORTANT: If you change this value, you MUST update firestore.rules as well, 
// because Firestore Rules cannot import JavaScript files.
export const TRIAL_DURATION_MS = 72 * 60 * 60 * 1000;
