import { Pool } from 'pg';
import { initDatabase } from './health.js';
import * as crypto from 'crypto';

/**
 * Authentication service - manages user authentication in PostgreSQL
 */

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt?: Date;
  isOnline: boolean;
}

/**
 * Initialize auth tables if they don't exist
 */
export async function initAuthTables(): Promise<void> {
  const pool = initDatabase();
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(255),
      photo_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)
  `);
}

/**
 * Hash password using SHA-256 (simple hashing for demo - use bcrypt in production)
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  await initAuthTables();
  
  const pool = initDatabase();
  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  
  const result = await pool.query(
    `INSERT INTO users (id, email, password_hash, display_name, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, email, display_name as "displayName", photo_url as "photoURL", created_at as "createdAt", last_login_at as "lastLoginAt"`,
    [userId, email, passwordHash, displayName || null]
  );
  
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    photoURL: row.photoURL,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  };
}

/**
 * Authenticate user (login)
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  await initAuthTables();
  
  const pool = initDatabase();
  const passwordHash = hashPassword(password);
  
  const result = await pool.query(
    `SELECT id, email, password_hash, display_name as "displayName", photo_url as "photoURL", created_at as "createdAt", last_login_at as "lastLoginAt"
     FROM users
     WHERE email = $1 AND password_hash = $2`,
    [email, passwordHash]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  // Update last login
  await pool.query(
    `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [user.id]
  );
  
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.createdAt,
    lastLoginAt: new Date(),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  await initAuthTables();
  
  const pool = initDatabase();
  const result = await pool.query(
    `SELECT id, email, display_name as "displayName", photo_url as "photoURL", created_at as "createdAt", last_login_at as "lastLoginAt"
     FROM users
     WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    photoURL: row.photoURL,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  await initAuthTables();
  
  const pool = initDatabase();
  const result = await pool.query(
    `SELECT id, email, display_name as "displayName", photo_url as "photoURL", created_at as "createdAt", last_login_at as "lastLoginAt"
     FROM users
     WHERE email = $1`,
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    photoURL: row.photoURL,
    createdAt: row.createdAt,
    lastLoginAt: row.lastLoginAt,
  };
}

/**
 * Convert User to AuthUser format (for frontend compatibility)
 */
export function userToAuthUser(user: User): AuthUser {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || undefined,
    isOnline: true,
  };
}

