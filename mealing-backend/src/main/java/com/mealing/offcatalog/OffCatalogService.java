package com.mealing.offcatalog;

import com.mealing.ingredient.IngredientEntity;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.math.BigDecimal;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class OffCatalogService {

    @Value("${mealing.off-catalog.path:off_catalog.db}")
    private String catalogPath;

    private boolean available = false;
    private long productCount = 0;
    private String resolvedPath;

    @PostConstruct
    public void init() {
        resolvedPath = resolvePath();
        File f = new File(resolvedPath);
        if (!f.exists()) {
            log.info("[OFF Catalog] Fichier absent : {} — recherche OFF désactivée", resolvedPath);
            return;
        }
        try (Connection conn = openConnection()) {
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM products")) {
                if (rs.next()) {
                    productCount = rs.getLong(1);
                }
            }
            available = true;
            log.info("[OFF Catalog] Disponible : {} — {} produits", resolvedPath, String.format("%,d", productCount));
        } catch (Exception e) {
            log.error("[OFF Catalog] Erreur d'initialisation : {}", e.getMessage());
        }
    }

    public CatalogStatus getStatus() {
        return new CatalogStatus(available, productCount, resolvedPath);
    }

    public List<IngredientEntity> search(String query) {
        if (!available) return List.of();
        if (query == null || query.isBlank()) return List.of();

        String like = "%" + query.trim().toLowerCase() + "%";
        String sql = """
            SELECT barcode, name, name_fr, brand,
                   calories_100g, proteins_100g, carbs_100g, sugars_100g,
                   fat_100g, saturated_fat_100g, fiber_100g, salt_100g, nutri_score
            FROM products
            WHERE lower(name) LIKE ?
               OR lower(name_fr) LIKE ?
               OR lower(brand) LIKE ?
            LIMIT 30
            """;

        List<IngredientEntity> results = new ArrayList<>();
        try (Connection conn = openConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, like);
            ps.setString(2, like);
            ps.setString(3, like);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    results.add(mapRow(rs));
                }
            }
        } catch (Exception e) {
            log.error("[OFF Catalog] Erreur de recherche '{}': {}", query, e.getMessage());
        }
        return results;
    }

    // -------------------------------------------------------------------------

    private String resolvePath() {
        File f = new File(catalogPath);
        if (f.isAbsolute()) return catalogPath;
        // Relatif : depuis le répertoire de travail (racine du projet)
        return new File(System.getProperty("user.dir"), catalogPath).getAbsolutePath();
    }

    private Connection openConnection() throws SQLException {
        return DriverManager.getConnection("jdbc:sqlite:" + resolvedPath);
    }

    private IngredientEntity mapRow(ResultSet rs) throws SQLException {
        return IngredientEntity.builder()
            .barcode(rs.getString("barcode"))
            .name(rs.getString("name") != null ? rs.getString("name") : rs.getString("name_fr"))
            .brand(rs.getString("brand"))
            .offId(rs.getString("barcode"))
            .calories100g(toBigDecimal(rs.getObject("calories_100g")))
            .proteins100g(toBigDecimal(rs.getObject("proteins_100g")))
            .carbs100g(toBigDecimal(rs.getObject("carbs_100g")))
            .sugars100g(toBigDecimal(rs.getObject("sugars_100g")))
            .fat100g(toBigDecimal(rs.getObject("fat_100g")))
            .saturatedFat100g(toBigDecimal(rs.getObject("saturated_fat_100g")))
            .fiber100g(toBigDecimal(rs.getObject("fiber_100g")))
            .salt100g(toBigDecimal(rs.getObject("salt_100g")))
            .nutriScore(rs.getString("nutri_score"))
            .isCustom(false)
            .build();
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public record CatalogStatus(boolean available, long productCount, String path) {}
}
