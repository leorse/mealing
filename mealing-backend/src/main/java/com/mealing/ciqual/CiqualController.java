package com.mealing.ciqual;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ciqual")
@RequiredArgsConstructor
public class CiqualController {

    private final CiqualService ciqualService;

    @GetMapping("/status")
    public ResponseEntity<CiqualService.CiqualStatus> status() {
        return ResponseEntity.ok(ciqualService.getStatus());
    }
}
