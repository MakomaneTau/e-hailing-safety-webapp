export type UserRole = "user" | "reviewer" | "admin";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  emailVerified: boolean;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResult {
  user: PublicUser;
  sessionToken: string;
}

export interface SessionUserRecord extends UserRecord {
  sessionId: string;
  sessionExpiresAt: Date;
}