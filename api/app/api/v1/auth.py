"""
Auth & Users API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List

from app.models.user import (
    UserCreate, UserUpdate, UserResponse, UserLogin, TokenResponse,
    RoleCreate, RoleResponse
)
from app.repositories.user_repo import UserRepository
from app.core.security import create_access_token
from app.api.v1.dependencies import get_current_user, require_admin
from app.db.session import roles
from datetime import datetime


router = APIRouter(prefix="/api/v1", tags=["Auth & Users"])


# ----------------------
# Authentication
# ----------------------

@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        user = UserRepository.create(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            password=user_data.password,
            role_name="viewer" # Default role for self-registration
        )
        
        # Auto-login
        token = create_access_token(user["id"])
        
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=user["id"],
                first_name=user["first_name"],
                last_name=user["last_name"],
                email=user["email"],
                roles=user.get("roles", []),
                created_at=user.get("created_at"),
                updated_at=user.get("updated_at")
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login and get access token"""
    print(f"Login attempt for: {credentials.email}")
    user = UserRepository.authenticate(credentials.email, credentials.password)
    print(f"User found: {user is not None}")
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user["id"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            email=user["email"],
            roles=user.get("roles", []),
            created_at=user.get("created_at"),
            updated_at=user.get("updated_at")
        )
    )


@router.post("/auth/logout")
async def logout():
    """Logout (client-side token invalidation)"""
    return {"message": "Logout successful"}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=current_user["id"],
        first_name=current_user["first_name"],
        last_name=current_user["last_name"],
        email=current_user["email"],
        roles=current_user.get("roles", []),
        created_at=current_user.get("created_at"),
        updated_at=current_user.get("updated_at")
    )


# ----------------------
# Users CRUD
# ----------------------

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_admin)
):
    """Create a new user (admin only)"""
    try:
        user = UserRepository.create(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            password=user_data.password,
            role_name=user_data.role,
            created_by=current_user["id"]
        )
        return UserResponse(
            id=user["id"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            email=user["email"],
            roles=user.get("roles", []),
            created_at=user.get("created_at"),
            updated_at=user.get("updated_at")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(require_admin)):
    """Get all users (admin only)"""
    users = UserRepository.get_all()
    return [
        UserResponse(
            id=u["id"],
            first_name=u["first_name"],
            last_name=u["last_name"],
            email=u["email"],
            roles=u.get("roles", []),
            created_at=u.get("created_at"),
            updated_at=u.get("updated_at")
        )
        for u in users
    ]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    # Users can only get their own info unless admin
    if user_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user["id"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        email=user["email"],
        roles=user.get("roles", []),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at")
    )


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user"""
    # Users can only update themselves unless admin
    if user_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Only admin can change roles
    if user_data.role and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Only admin can change roles")
    
    try:
        user = UserRepository.update(
            user_id=user_id,
            updated_by=current_user["id"],
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            password=user_data.password,
            role=user_data.role
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user["id"],
            first_name=user["first_name"],
            last_name=user["last_name"],
            email=user["email"],
            roles=user.get("roles", []),
            created_at=user.get("created_at"),
            updated_at=user.get("updated_at")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Delete user (admin only)"""
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    success = UserRepository.delete(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}


# ----------------------
# Roles
# ----------------------

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(current_user: dict = Depends(get_current_user)):
    """Get all roles"""
    result = []
    for role in roles.find():
        result.append(RoleResponse(
            id=str(role["_id"]),
            name=role["name"],
            created_at=role.get("created_at")
        ))
    return result


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    current_user: dict = Depends(require_admin)
):
    """Create a new role (admin only)"""
    existing = roles.find_one({"name": role_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")
    
    result = roles.insert_one({
        "name": role_data.name,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    role = roles.find_one({"_id": result.inserted_id})
    return RoleResponse(
        id=str(role["_id"]),
        name=role["name"],
        created_at=role.get("created_at")
    )
