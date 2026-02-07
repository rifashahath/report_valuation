"""
Security utilities - JWT handling and password hashing
"""

from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import bcrypt
import secrets

from app.core.config import config


# ----------------------
# JWT Token Functions
# ----------------------

def create_access_token(user_id: str) -> str:
    """Create a JWT access token for the given user ID"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "exp": expire
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Decode a JWT access token and return the user ID"""
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return payload["sub"]
    except JWTError as e:
        print(f"JWT Decode Error: {e}")
        try:
             # Try to decode without verification to see what was in it
             unverified = jwt.get_unverified_claims(token)
             print(f"Unverified claims: {unverified}. Server now: {datetime.now(timezone.utc)}")
        except Exception as debug_e:
             print(f"Failed to inspect token: {debug_e}")
        return None


def verify_token(token: str) -> dict:
    """Verify a JWT token and return its payload"""
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise JWTError(f"Token verification failed: {str(e)}")


def create_reset_token(email: str) -> tuple[str, datetime]:
    """Create a password reset token with 1 hour expiration"""
    token = secrets.token_urlsafe(32)
    expire = datetime.utcnow() + timedelta(hours=1)
    return token, expire


def verify_reset_token(token: str, stored_token: str) -> bool:
    """Verify that the reset token matches"""
    return token == stored_token


# ----------------------
# Password Hashing
# ----------------------

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hashed password"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
