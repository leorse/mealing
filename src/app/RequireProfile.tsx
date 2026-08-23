import { Navigate, Outlet } from 'react-router-dom';
import { useProfile, PROFILE_LOADING } from '../hooks/useProfile';

export default function RequireProfile() {
  const profile = useProfile();

  if (profile === PROFILE_LOADING) return null; // chargement IndexedDB en cours
  if (profile === undefined) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
