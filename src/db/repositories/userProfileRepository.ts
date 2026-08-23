import { db, type UserProfile } from '../schema';

const PROFILE_ID = 1;

export async function getProfile(): Promise<UserProfile | undefined> {
  return db.userProfile.get(PROFILE_ID);
}

export async function saveProfile(data: Omit<UserProfile, 'id' | 'updatedAt'>): Promise<void> {
  await db.userProfile.put({ ...data, id: PROFILE_ID, updatedAt: new Date().toISOString() });
}
