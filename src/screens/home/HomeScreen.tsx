import { useProfile, PROFILE_LOADING } from '../../hooks/useProfile';
import { computeTargetCalories } from '../../services/nutrition';

export default function HomeScreen() {
  const profile = useProfile();

  if (profile === PROFILE_LOADING || profile === undefined) return null;

  const targetCalories = computeTargetCalories(profile);

  return (
    <div className="screen">
      <h1>Bonjour {profile.firstName} 👋</h1>
      <p>Ton objectif calorique aujourd'hui : <strong>{targetCalories} kcal</strong></p>
    </div>
  );
}
