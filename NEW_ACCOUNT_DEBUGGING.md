#!/usr/bin/env node

/\*\*

- New Account Login Diagnostics
- Helps identify where new account logins fail
  \*/

console.log(`
╔════════════════════════════════════════════════════════════════╗
║ New Account Login Troubleshooting Guide ║
╚════════════════════════════════════════════════════════════════╝

ISSUE: New Google account shows "unmatched route" after login

WHAT CHANGED (to help new accounts):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Added Firebase auth timeout (10s max wait)
✓ Better error recovery for auth failures
✓ Improved error logging with [Firebase Auth] prefix
✓ Main layout now accepts Firebase auth failures
✓ New user Firestore initialization with error handling
✓ Console logs track every auth step

DEBUGGING STEPS (New Account Login):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ENABLE REACT NATIVE DEBUGGER:
   - Open React Native Debugger
   - Or use: npx react-native-debugger-open
   - Check Console tab for logs

2. LOGIN WITH NEW ACCOUNT and look for these logs in order:

   ✓ Expected sequence:
   [Firebase Auth] Connecting user user_123xyz... to Firebase...
   [Firebase Auth] Got token, signing in...
   [Firebase Auth] ✓ Successfully authenticated user_123xyz
   [Auth Layout] Ready - isSignedIn: true
   [Main Layout] Ready - isSignedIn: true
   [Home] Initializing for user: user_123xyz
   [Home] User has 0 ideas
   [Home] Loaded 0 recent ideas

   ✗ If you see any errors:
   [Firebase Auth] Connection error: ...
   [Firebase Auth] Backend error: ...
   [Main Layout] Firebase auth had error but proceeding: ...

3. CHECK BACKEND LOGS on Render:
   Go to: https://dashboard.render.com
   - Find ideaspark-backend service
   - Click "Logs" tab
   - Search for the new account's Clerk user ID
   - Look for errors generating the Firebase token

4. FIREBASE CONSOLE CHECK:
   Go to: https://console.firebase.google.com
   - Project: ideaspark-saif
   - Authentication > Users tab
   - Should see BOTH accounts listed
   - Check custom claims for both

5. IF YOU SEE "Backend error: 401" or "403":
   Backend can't access Firebase. Check your backend:
   - FIREBASE_PRIVATE_KEY is set correctly
   - FIREBASE_PROJECT_ID matches your project
   - Firebase Admin SDK is initialized

6. IF YOU SEE TIMEOUT ERROR:
   Backend is taking too long or unreachable:
   - Check Render backend status
   - Verify backend URL in .env: ${process.env.EXPO_PUBLIC_BACKEND_URL}
   - Try restarting backend: push new commit to trigger rebuild

TEST COMMANDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test if backend works:
curl -X POST https://ideaspark-backend-i4p8.onrender.com/auth/firebase-token \\
-H "Content-Type: application/json" \\
-d '{"clerk_user_id":"test-user-xyz"}'

Test your app backend URL:
curl https://ideaspark-backend-i4p8.onrender.com

MOST COMMON CAUSES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Backend Firebase credentials are wrong
   → Backend can't generate tokens for ANY user
   → Fix: Update backend .env with correct Firebase credentials

2. New Clerk user ID not in backend database
   → Backend should auto-create, but check logs
   → Fix: Backend needs to handle new Clerk users

3. Firestore Realtime Database permissions
   → New user document can't be created
   → Fix: Check Firestore rules in Firebase Console

4. Network/Timeout issues
   → Backend is slow or unreachable
   → Fix: Restart backend or check Render status

AFTER MAKING CHANGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. npm start (to reload app with new code)
2. Clear app data on phone/emulator
3. Try logging in with new account again
4. CHECK LOGS and DM me the error message with [Firebase Auth] prefix

NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Rebuild app with new fixes: npm start
2. Test with NEW account (not your usual one)
3. Share console logs starting from Google login
4. If still fails, share backend logs from Render

`);
