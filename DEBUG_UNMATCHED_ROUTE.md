#!/usr/bin/env node

/\*\*

- Debug Script - IdeaSpark Authentication Issues
- Run this in your backend logs or monitoring to track auth issues
  \*/

console.log(`
╔════════════════════════════════════════════════════════════════╗
║ IdeaSpark Debug Guide - Unmatched Route Fix ║
╚════════════════════════════════════════════════════════════════╝

ISSUE: "Unmatched route" error when logging in with a different Google account

ROOT CAUSES FIXED:
✓ Race condition in routing (added loading states)
✓ Unsafe Firebase auth initialization (improved error handling)
✓ Missing auth state validation (added isLoaded checks)

DEBUGGING STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MONITOR CONSOLE LOGS on your phone/emulator:
   Look for logs starting with "[Firebase Auth]"
   - [Firebase Auth] Connecting user XXX to Firebase
   - [Firebase Auth] Successfully authenticated user
   - [Firebase Auth] Connection error: ...

2. NETWORK REQUEST CHECK:
   When logging in with the second account, verify:
   ✓ POST /auth/firebase-token is being called
   ✓ Backend returns status 200
   ✓ Response includes "firebase_token" field

3. BACKEND LOG inspection:
   Check your backend logs for the second user's clerk_user_id
   - Verify the user is being found in your system
   - Check if there are any permission/database issues
   - Verify Firestore setup for new users

4. CLEAR CACHE:
   If switching between accounts on same device:
   - Android: Settings > Apps > IdeaSpark > Storage > Clear Cache
   - iOS: Offload App and reinstall
   - Or clear Expo cache: expo r -c

5. FIREBASE CONSOLE:
   Go to Firebase Console > Authentication
   - Verify both Google accounts appear in users list
   - Check if custom tokens are being generated correctly

6. TEST WITH THIS ENDPOINT:
   After logging in with second account, run:
   curl -X POST https://ideaspark-backend-i4p8.onrender.com/auth/firebase-token \\
   -H "Content-Type: application/json" \\
   -d '{"clerk_user_id": "<second-user-id>"}'

   Replace <second-user-id> with the actual Clerk user ID from console logs

EXPECTED BEHAVIOR AFTER FIX:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Loading spinner appears while auth is being verified
2. Console shows "[Firebase Auth] Connecting user XXX..."
3. Console shows "[Firebase Auth] Successfully authenticated user"
4. App navigates to home screen without routing errors
5. Both accounts work identically

IF STILL HAVING ISSUES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check the console for these messages:
❌ "[Firebase Auth] Backend error: 500"
→ Your backend is having issues generating tokens for this user

❌ "[Firebase Auth] Connection error: Failed to fetch"
→ Network issue or CORS problem

❌ "No Firebase token received"
→ Backend returned 200 but no token in response

Check your backend .env:

- FIREBASE_PRIVATE_KEY should be set
- FIREBASE_PROJECT_ID should match your Firebase project

Commands to try:

- npm start (or expo start) to rebuild
- expo r -c to clear cache
- Check phone date/time (Firebase token expiry issues)

RELATED FILES UPDATED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ hooks/useFirebaseAuth.ts - Better error handling & logging
✓ app/(auth)/\_layout.tsx - Added loading state
✓ app/(main)/\_layout.tsx - Added loading state

`);
