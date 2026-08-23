import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProfile, PROFILE_LOADING } from '../../hooks/useProfile';
import { computeTargetCalories, computeMacroTargets } from '../../services/nutrition';

export default function HomeScreen() {
  const profile = useProfile();

  if (profile === PROFILE_LOADING || profile === undefined) return null;

  const targetCalories = computeTargetCalories(profile);
  const macros = computeMacroTargets(targetCalories, profile);
  const today = format(new Date(), 'EEEE d MMMM', { locale: fr });

  return (
    <div className="screen">
      <header>
        <p className="home-date">{today}</p>
        <h1>Tableau de bord</h1>
      </header>

      <section className="card">
        <p className="card-label">Objectif du jour</p>
        <p className="calorie-target">{targetCalories} <span>kcal</span></p>
        <div className="macro-row">
          <div className="macro-item">
            <span className="macro-value">{macros.proteinG} g</span>
            <span className="macro-label">Protéines</span>
          </div>
          <div className="macro-item">
            <span className="macro-value">{macros.carbsG} g</span>
            <span className="macro-label">Glucides</span>
          </div>
          <div className="macro-item">
            <span className="macro-value">{macros.fatG} g</span>
            <span className="macro-label">Lipides</span>
          </div>
        </div>
      </section>
    </div>
  );
}
