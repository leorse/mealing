package com.mealing.config;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Fournit l'identifiant de l'utilisateur unique de l'application.
 * L'application est mono-utilisateur, aucune authentification n'est requise.
 */
@Component
public class UserContext {

    public static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    public UUID getUserId() {
        return USER_ID;
    }
}
