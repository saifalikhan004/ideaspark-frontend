rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /ideas/{ideaId} {
        // Allow if authenticated and the idea belongs to this user
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /chatHistory/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        match /notes/{noteId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
      
      match /activity/{activityId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}