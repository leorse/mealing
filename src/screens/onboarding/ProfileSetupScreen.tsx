import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProfile } from '../../db/repositories/userProfileRepository';
import type { UserProfile } from '../../db/schema';

const defaultForm = {
  firstName: '',
  birthDate: '',
  gender: 'OTHER' as UserProfile['gender'],
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'MODERATE' as UserProfile['activityLevel'],
  goal: 'MAINTAIN' as UserProfile['goal'],
  macroProteinPct: 30,
  macroCarbsPct: 45,
  macroFatPct: 25,
  compensationSpread: 2,
};

export default function ProfileSetupScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultForm);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await saveProfile({ ...form, targetCalories: null });
    navigate('/');
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <h1>Bienvenue sur Mealing</h1>
      <p>Renseigne ton profil pour calculer tes objectifs caloriques.</p>

      <label>
        Prénom
        <input
          required
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
      </label>

      <label>
        Date de naissance
        <input
          type="date"
          required
          value={form.birthDate}
          onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
        />
      </label>

      <label>
        Sexe
        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value as UserProfile['gender'] })}
        >
          <option value="FEMALE">Femme</option>
          <option value="MALE">Homme</option>
          <option value="OTHER">Autre</option>
        </select>
      </label>

      <label>
        Taille (cm)
        <input
          type="number"
          required
          value={form.heightCm}
          onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
        />
      </label>

      <label>
        Poids (kg)
        <input
          type="number"
          required
          value={form.weightKg}
          onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
        />
      </label>

      <label>
        Niveau d'activité
        <select
          value={form.activityLevel}
          onChange={(e) => setForm({ ...form, activityLevel: e.target.value as UserProfile['activityLevel'] })}
        >
          <option value="SEDENTARY">Sédentaire</option>
          <option value="LIGHT">Légèrement actif</option>
          <option value="MODERATE">Modérément actif</option>
          <option value="ACTIVE">Très actif</option>
          <option value="VERY_ACTIVE">Extrêmement actif</option>
        </select>
      </label>

      <label>
        Objectif
        <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value as UserProfile['goal'] })}>
          <option value="LOSE">Perte de poids</option>
          <option value="MAINTAIN">Maintien</option>
          <option value="GAIN">Prise de masse</option>
        </select>
      </label>

      <button type="submit">Commencer</button>
    </form>
  );
}
