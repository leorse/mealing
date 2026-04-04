package com.mealing.user;

import com.mealing.auth.JwtService;
import com.mealing.user.dto.ObjectivesResponse;
import com.mealing.user.dto.UserProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<UserProfile> getProfile(@RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping
    public ResponseEntity<UserProfile> updateProfile(
        @RequestHeader("Authorization") String authHeader,
        @RequestBody UserProfileRequest request
    ) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }

    @GetMapping("/objectives")
    public ResponseEntity<ObjectivesResponse> getObjectives(@RequestHeader("Authorization") String authHeader) {
        UUID userId = extractUserId(authHeader);
        return ResponseEntity.ok(userService.getObjectives(userId));
    }

    private UUID extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}
