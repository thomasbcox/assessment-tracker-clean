import { db, magicLinks, users } from './db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export async function createMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await db.insert(magicLinks).values({
    email,
    token,
    expiresAt,
  });

  return token;
}

export async function verifyMagicLink(token: string): Promise<AuthUser | null> {
  const link = await db
    .select()
    .from(magicLinks)
    .where(eq(magicLinks.token, token))
    .limit(1);

  if (!link[0] || link[0].used || new Date() > new Date(link[0].expiresAt)) {
    return null;
  }

  // Mark as used
  await db
    .update(magicLinks)
    .set({ used: 1 })
    .where(eq(magicLinks.token, token));

  // Get user
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, link[0].email))
    .limit(1);

  if (!user[0]) {
    return null;
  }

  return {
    id: user[0].id,
    email: user[0].email,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    role: user[0].role,
  };
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user[0]) {
    return null;
  }

  return {
    id: user[0].id,
    email: user[0].email,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    role: user[0].role,
  };
} 