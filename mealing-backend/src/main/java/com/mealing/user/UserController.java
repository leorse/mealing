package com.mealing.user;

import com.mealing.config.UserContext;
import com.mealing.user.dto.ObjectivesResponse;
import com.mealing.user.dto.UserProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserContext userContext;

    @GetMapping
    public ResponseEntity<UserProfile> getProfile() {
        return ResponseEntity.ok(userService.getProfile(userContext.getUserId()));
    }

    @PutMapping
    public ResponseEntity<UserProfile> updateProfile(@RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userContext.getUserId(), request));
    }

    @GetMapping("/objectives")
    public ResponseEntity<ObjectivesResponse> getObjectives() {
        return ResponseEntity.ok(userService.getObjectives(userContext.getUserId()));
    }
}
