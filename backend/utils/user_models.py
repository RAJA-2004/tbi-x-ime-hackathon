"""
User models and database operations
"""

from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
import json
import os
from pathlib import Path

# Database file (using JSON for simplicity - use proper database in production)
DB_FILE = Path("users_db.json")

class User(BaseModel):
    """User model"""
    id: int
    username: str
    email: str
    full_name: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    """User creation model"""
    username: str
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    """User login model"""
    username: str
    password: str

class UserResponse(BaseModel):
    """User response model (no password)"""
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

class Token(BaseModel):
    """Token model"""
    access_token: str
    token_type: str
    user: UserResponse

class UserDatabase:
    """Simple JSON-based user database (use proper database in production)"""
    
    def __init__(self):
        self.db_file = DB_FILE
        self._ensure_db_exists()
    
    def _ensure_db_exists(self):
        """Create database file if it doesn't exist"""
        if not self.db_file.exists():
            self._save_data({"users": [], "next_id": 1})
    
    def _load_data(self) -> Dict:
        """Load data from JSON file"""
        try:
            with open(self.db_file, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {"users": [], "next_id": 1}
    
    def _save_data(self, data: Dict):
        """Save data to JSON file"""
        with open(self.db_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        data = self._load_data()
        for user_data in data["users"]:
            if user_data["username"] == username:
                user_data["created_at"] = datetime.fromisoformat(user_data["created_at"])
                if user_data.get("last_login"):
                    user_data["last_login"] = datetime.fromisoformat(user_data["last_login"])
                return User(**user_data)
        return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        data = self._load_data()
        for user_data in data["users"]:
            if user_data["email"] == email:
                user_data["created_at"] = datetime.fromisoformat(user_data["created_at"])
                if user_data.get("last_login"):
                    user_data["last_login"] = datetime.fromisoformat(user_data["last_login"])
                return User(**user_data)
        return None
    
    def create_user(self, user_create: UserCreate, hashed_password: str) -> User:
        """Create a new user"""
        data = self._load_data()
        
        # Check if username or email already exists
        if self.get_user_by_username(user_create.username):
            raise ValueError("Username already exists")
        
        if self.get_user_by_email(user_create.email):
            raise ValueError("Email already exists")
        
        # Create new user
        user_id = data["next_id"]
        new_user = User(
            id=user_id,
            username=user_create.username,
            email=user_create.email,
            full_name=user_create.full_name,
            hashed_password=hashed_password,
            created_at=datetime.utcnow()
        )
        
        # Add to database
        data["users"].append(new_user.dict())
        data["next_id"] += 1
        self._save_data(data)
        
        return new_user
    
    def update_last_login(self, username: str):
        """Update user's last login time"""
        data = self._load_data()
        for user_data in data["users"]:
            if user_data["username"] == username:
                user_data["last_login"] = datetime.utcnow().isoformat()
                self._save_data(data)
                break
    
    def get_all_users(self) -> List[UserResponse]:
        """Get all users (admin function)"""
        data = self._load_data()
        users = []
        for user_data in data["users"]:
            user_data["created_at"] = datetime.fromisoformat(user_data["created_at"])
            if user_data.get("last_login"):
                user_data["last_login"] = datetime.fromisoformat(user_data["last_login"])
            
            # Remove password from response
            user_response = UserResponse(
                id=user_data["id"],
                username=user_data["username"],
                email=user_data["email"],
                full_name=user_data["full_name"],
                is_active=user_data["is_active"],
                created_at=user_data["created_at"],
                last_login=user_data.get("last_login")
            )
            users.append(user_response)
        return users

# Global database instance
user_db = UserDatabase()
