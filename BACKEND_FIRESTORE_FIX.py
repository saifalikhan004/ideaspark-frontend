# CORRECTED firestore_db.py for IdeaSpark
# Copy this to replace your backend's app/memory/firestore_db.py
# The key fix: Use user-scoped collections (users/{userId}/ideas) instead of flat collections

"""
Firestore database integration for IdeaSpark.
Handles all Firestore CRUD operations for ideas, notes, and activity.
FIXED: Uses proper user-scoped collection structure for multi-user support.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from firebase_admin import firestore, credentials
import firebase_admin
import os
import json
from pathlib import Path


class FirestoreDB:
    """Firestore database client for IdeaSpark"""
    
    def __init__(self):
        self.db = self._initialize_firestore()
        
    def _initialize_firestore(self):
        """Initialize Firestore client"""
        try:
            # Check if Firebase is already initialized
            if not firebase_admin._apps:
                cred = None
                
                # 1. Try to load from environment variable (for Render/Production)
                firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
                if firebase_creds_json:
                    try:
                        cred_dict = json.loads(firebase_creds_json)
                        cred = credentials.Certificate(cred_dict)
                    except json.JSONDecodeError:
                        print("Error: FIREBASE_CREDENTIALS_JSON is not valid JSON")
                        return None
                
                # 2. Fallback to serviceAccountKey.json file (for local development)
                else:
                    key_path = Path("serviceAccountKey.json")
                    if not key_path.exists():
                        key_path = Path(__file__).parent.parent.parent / "serviceAccountKey.json"
                    
                    if key_path.exists():
                        cred = credentials.Certificate(str(key_path))
                    else:
                        print("Error: Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON environment variable or place serviceAccountKey.json in the project root.")
                        return None
                
                if cred:
                    firebase_admin.initialize_app(cred)
            
            return firestore.client()
        except Exception as e:
            print(f"Error initializing Firestore: {e}")
            return None
    
    # ==================== USER OPERATIONS ====================
    
    def ensure_user_exists(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """
        Ensure a user document exists in Firestore.
        Used for new Clerk users on first login.
        
        Args:
            user_id: The user's Clerk ID
            user_data: User information (email, username, etc.)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db:
            return False
        
        try:
            user_ref = self.db.collection("users").document(user_id)
            user_ref.set(
                {
                    "email": user_data.get("email", ""),
                    "username": user_data.get("username", ""),
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow(),
                },
                merge=True,  # Only set if doesn't exist
            )
            return True
        except Exception as e:
            print(f"Error ensuring user exists: {e}")
            return False
    
    # ==================== NOTES SUB-COLLECTION ====================
    
    def save_note(self, user_id: str, idea_id: str, note_text: str, note_id: Optional[str] = None) -> Optional[str]:
        """
        Save a note to the notes sub-collection within an idea.
        Path: users/{userId}/ideas/{ideaId}/notes/{noteId}
        
        Args:
            user_id: The user's ID
            idea_id: The idea's ID
            note_text: The note content
            note_id: Optional note ID. If not provided, a new note is created
            
        Returns:
            The note ID, or None if operation failed
        """
        if not self.db:
            return None
        
        try:
            notes_ref = (
                self.db.collection("users")
                .document(user_id)
                .collection("ideas")
                .document(idea_id)
                .collection("notes")
            )
            
            note_data = {
                "content": note_text,
                "updatedAt": datetime.utcnow(),
            }
            
            if note_id:
                # Update existing note
                notes_ref.document(note_id).update(note_data)
                return note_id
            else:
                # Create new note
                note_data["createdAt"] = datetime.utcnow()
                doc_ref = notes_ref.document()
                doc_ref.set(note_data)
                return doc_ref.id
        except Exception as e:
            print(f"Error saving note: {e}")
            return None
    
    def get_all_notes(self, user_id: str, idea_id: str) -> List[Dict[str, Any]]:
        """
        Get all notes for an idea.
        Path: users/{userId}/ideas/{ideaId}/notes
        
        Args:
            user_id: The user's ID
            idea_id: The idea's ID
            
        Returns:
            List of all notes for the idea
        """
        if not self.db:
            return []
        
        try:
            docs = (
                self.db.collection("users")
                .document(user_id)
                .collection("ideas")
                .document(idea_id)
                .collection("notes")
                .order_by("createdAt")
                .stream()
            )
            notes = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                notes.append(data)
            return notes
        except Exception as e:
            print(f"Error getting all notes: {e}")
            return []
    
    def delete_note(self, user_id: str, idea_id: str, note_id: str) -> bool:
        """
        Delete a note from the notes sub-collection.
        Path: users/{userId}/ideas/{ideaId}/notes/{noteId}
        
        Args:
            user_id: The user's ID
            idea_id: The idea's ID
            note_id: The note's ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db:
            return False
        
        try:
            (
                self.db.collection("users")
                .document(user_id)
                .collection("ideas")
                .document(idea_id)
                .collection("notes")
                .document(note_id)
                .delete()
            )
            return True
        except Exception as e:
            print(f"Error deleting note: {e}")
            return False
    
    # ==================== IDEA OPERATIONS ====================
    
    def save_idea(self, idea_data: Dict[str, Any]) -> Optional[str]:
        """
        Save or update an idea in Firestore.
        FIXED: Now uses user-scoped collection
        Path: users/{userId}/ideas/{ideaId}
        
        Args:
            idea_data: Dictionary containing idea fields
            
        Returns:
            The idea ID, or None if operation failed
        """
        if not self.db:
            return None
        
        try:
            idea_id = idea_data.get("id")
            user_id = idea_data.get("user_id")
            
            if not user_id:
                print("Error: user_id is required to save an idea")
                return None
            
            # Map Python field names to Firestore field names (camelCase)
            firestore_data = {
                "actionSteps": idea_data.get("action_steps", []),
                "category": idea_data.get("category"),
                "idea": idea_data.get("raw_idea"),
                "refinedIdea": idea_data.get("refined_idea"),
                "structureType": idea_data.get("structure_type"),
                "subCategory": idea_data.get("sub_category"),
                "tags": idea_data.get("tags", []),
                "expansions": idea_data.get("expansions", []),
                "updatedAt": datetime.utcnow(),
                "userId": user_id,
            }
            
            # Use user-scoped collection: users/{userId}/ideas/{ideaId}
            ideas_ref = self.db.collection("users").document(user_id).collection("ideas")
            
            if idea_id:
                # Update existing idea
                ideas_ref.document(idea_id).update(firestore_data)
                return idea_id
            else:
                # Create new idea with auto-generated ID
                firestore_data["createdAt"] = datetime.utcnow()
                doc_ref = ideas_ref.document()
                doc_ref.set(firestore_data)
                return doc_ref.id
        except Exception as e:
            print(f"Error saving idea: {e}")
            return None
    
    def get_idea(self, user_id: str, idea_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific idea from Firestore.
        FIXED: Now uses user-scoped collection
        Path: users/{userId}/ideas/{ideaId}
        
        Args:
            user_id: The user's ID
            idea_id: The idea's ID
            
        Returns:
            The idea data or None if not found
        """
        if not self.db:
            return None
        
        try:
            doc = (
                self.db.collection("users")
                .document(user_id)
                .collection("ideas")
                .document(idea_id)
                .get()
            )
            if doc.exists:
                data = doc.to_dict()
                data["id"] = doc.id
                return data
            return None
        except Exception as e:
            print(f"Error getting idea: {e}")
            return None
    
    def get_user_ideas(self, user_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all ideas for a user.
        FIXED: Now uses user-scoped collection
        Path: users/{userId}/ideas
        
        Args:
            user_id: The user's ID
            limit: Optional limit on number of ideas to return
            
        Returns:
            List of all ideas for the user
        """
        if not self.db:
            return []
        
        try:
            query = (
                self.db.collection("users")
                .document(user_id)
                .collection("ideas")
                .order_by("updatedAt", direction=firestore.Query.DESCENDING)
            )
            
            if limit:
                query = query.limit(limit)
            
            docs = query.stream()
            ideas = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                ideas.append(data)
            return ideas
        except Exception as e:
            print(f"Error getting user ideas: {e}")
            return []
    
    def delete_idea(self, user_id: str, idea_id: str) -> bool:
        """
        Delete an idea from Firestore.
        Path: users/{userId}/ideas/{ideaId}
        
        Args:
            user_id: The user's ID
            idea_id: The idea's ID
            
        Returns:
            True if successful, False otherwise
        """
        if not self.db:
            return False
        
        try:
            (
                self.db.collection("users")
                .document(user_id)
                .collection("ideas")
                .document(idea_id)
                .delete()
            )
            return True
        except Exception as e:
            print(f"Error deleting idea: {e}")
            return False
    
    # ==================== ACTIVITY OPERATIONS ====================
    
    def log_activity(self, activity_data: Dict[str, Any]) -> Optional[str]:
        """
        Log user activity to Firestore.
        FIXED: Now uses user-scoped collection
        Path: users/{userId}/activity/{activityId}
        
        Args:
            activity_data: Dictionary containing activity fields
            
        Returns:
            The activity ID, or None if operation failed
        """
        if not self.db:
            return None
        
        try:
            user_id = activity_data.get("user_id")
            
            if not user_id:
                print("Error: user_id is required to log activity")
                return None
            
            firestore_data = {
                "action": activity_data.get("action"),
                "ideaId": activity_data.get("idea_id"),
                "ideaTitle": activity_data.get("idea_title"),
                "timestamp": datetime.utcnow(),
                "userId": user_id,
            }
            
            # Use user-scoped collection: users/{userId}/activity/{activityId}
            activity_ref = self.db.collection("users").document(user_id).collection("activity")
            
            doc_ref = activity_ref.document()
            doc_ref.set(firestore_data)
            return doc_ref.id
        except Exception as e:
            print(f"Error logging activity: {e}")
            return None
    
    def get_user_activity(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent activity for a user.
        FIXED: Now uses user-scoped collection
        Path: users/{userId}/activity
        
        Args:
            user_id: The user's ID
            limit: Maximum number of activities to return
            
        Returns:
            List of recent activities
        """
        if not self.db:
            return []
        
        try:
            docs = (
                self.db.collection("users")
                .document(user_id)
                .collection("activity")
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            activities = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                activities.append(data)
            return activities
        except Exception as e:
            print(f"Error getting user activity: {e}")
            return []


# Global instance
_firestore_db: Optional[FirestoreDB] = None


def get_firestore_db() -> FirestoreDB:
    """Get or create the global Firestore DB instance"""
    global _firestore_db
    if _firestore_db is None:
        _firestore_db = FirestoreDB()
    return _firestore_db
