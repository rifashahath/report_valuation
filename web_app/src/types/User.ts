/**
 * User Management Types
 * 
 * These types represent admin-managed system users,
 * NOT authentication/session concerns (handled by auth.api.ts).
 * 
 * Based on backend models in api/app/models/user.py
 */

/* =========================
   Role Types
========================= */

export interface Role {
    id: string;
    name: string;
    created_at?: string;
}

export interface CreateRoleRequest {
    name: string;
}

/* =========================
   User Types
========================= */

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];  // List of role names
    created_at?: string;
    updated_at?: string;
}

export interface CreateUserRequest {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: string;  // Default role name (e.g., "viewer")
}

export interface UpdateUserRequest {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    role?: string;
}

/* =========================
   API Response Types
========================= */

export type GetUsersResponse = User[];

export type GetRolesResponse = Role[];
