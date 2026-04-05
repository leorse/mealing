package com.mealing.backup;

import com.mealing.config.UserContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
public class DataBackupController {

    private final DataBackupService dataBackupService;
    private final UserContext userContext;

    @GetMapping("/export")
    public ResponseEntity<BackupDto> export() {
        BackupDto backup = dataBackupService.export(userContext.getUserId());
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=mealing-backup-" + LocalDate.now() + ".json")
            .contentType(MediaType.APPLICATION_JSON)
            .body(backup);
    }

    @PostMapping("/import")
    public ResponseEntity<Void> importBackup(@RequestBody BackupDto backup) {
        dataBackupService.importBackup(backup, userContext.getUserId());
        return ResponseEntity.noContent().build();
    }
}
