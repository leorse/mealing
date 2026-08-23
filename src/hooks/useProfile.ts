import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from '../db/repositories/userProfileRepository';

export const PROFILE_LOADING = Symbol('profile-loading');

/** Retourne PROFILE_LOADING pendant la requête initiale, puis le profil ou undefined s'il n'existe pas encore. */
export function useProfile() {
  return useLiveQuery(() => getProfile(), [], PROFILE_LOADING);
}
