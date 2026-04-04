package com.mealing.auth;

import com.mealing.auth.dto.AuthResponse;
import com.mealing.auth.dto.LoginRequest;
import com.mealing.auth.dto.RegisterRequest;
import com.mealing.user.UserEntity;
import com.mealing.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé : " + email));
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email déjà utilisé");
        }

        UserEntity user = UserEntity.builder()
            .email(req.email())
            .password(passwordEncoder.encode(req.password()))
            .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.email(), req.password())
        );
        UserEntity user = userRepository.findByEmail(req.email())
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getId(), user.getEmail());
    }

    public AuthResponse me(String token) {
        String email = jwtService.extractEmail(token);
        UserEntity user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        String newToken = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(newToken, user.getId(), user.getEmail());
    }
}
