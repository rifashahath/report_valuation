"""
Database seeding script
Seeds roles: admin, user
Creates admin user: admin@jothis.com / password123
"""

from datetime import datetime
from bson import ObjectId
from app.db.session import db, users, roles, user_roles
from app.core.security import hash_password


def seed_roles():
    """Seed the default roles"""
    default_roles = ["admin", "user"]
    
    for role_name in default_roles:
        existing = roles.find_one({"name": role_name})
        if not existing:
            roles.insert_one({
                "name": role_name,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
            print(f"✅ Created role: {role_name}")
        else:
            print(f"⏭️  Role already exists: {role_name}")


def seed_admin_user():
    """Create the default admin user"""
    admin_email = "admin@jothis.com"
    admin_password = "password123"
    
    # Check if admin already exists
    existing_user = users.find_one({"email": admin_email})
    if existing_user:
        print(f"⏭️  Admin user already exists: {admin_email}")
        return
    
    # Get admin role
    admin_role = roles.find_one({"name": "admin"})
    if not admin_role:
        print("❌ Admin role not found. Run seed_roles() first.")
        return
    
    # Create admin user
    hashed_pwd = hash_password(admin_password)
    user_doc = {
        "first_name": "Admin",
        "last_name": "User",
        "email": admin_email,
        "password": hashed_pwd,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = users.insert_one(user_doc)
    user_id = result.inserted_id
    
    # Assign admin role to user
    user_roles.insert_one({
        "user_id": user_id,
        "role_id": admin_role["_id"],
        "created_at": datetime.utcnow()
    })
    
    print(f"✅ Created admin user: {admin_email}")
    print(f"   Password: {admin_password}")


def run_seeds():
    """Run all seed functions"""
    print("\n🌱 Running database seeds...\n")
    seed_roles()
    seed_admin_user()
    print("\n✅ Seeding complete!\n")


if __name__ == "__main__":
    run_seeds()
