-- Ajout des identifiants Open Food Facts sur le profil utilisateur
ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS off_username VARCHAR(255),
    ADD COLUMN IF NOT EXISTS off_password VARCHAR(255);
