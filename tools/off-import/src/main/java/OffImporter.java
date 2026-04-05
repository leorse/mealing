import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.sql.*;
import java.time.Duration;
import java.time.Instant;

/**
 * Importe le catalogue Open Food Facts (fichier JSONL décompressé)
 * dans une base SQLite locale utilisable par Mealing.
 *
 * Usage : java -jar off-import.jar <chemin_vers_fichier.jsonl> [chemin_sortie.db]
 */
public class OffImporter {

    private static final int BATCH_SIZE = 5_000;

    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.err.println("Usage: java -jar off-import.jar <openfoodfacts-products.jsonl> [off_catalog.db]");
            System.exit(1);
        }

        String inputPath = args[0];
        String outputPath = args.length >= 2 ? args[1] : "off_catalog.db";

        File inputFile = new File(inputPath);
        if (!inputFile.exists()) {
            System.err.println("Fichier introuvable : " + inputPath);
            System.exit(1);
        }

        System.out.println("=== Mealing — Import Open Food Facts ===");
        System.out.println("Source : " + inputPath);
        System.out.println("Sortie : " + outputPath);
        System.out.println();

        Instant start = Instant.now();

        try (Connection db = openDb(outputPath)) {
            createSchema(db);
            importData(db, inputFile);
            createIndexes(db);
        }

        Duration elapsed = Duration.between(start, Instant.now());
        System.out.printf("%nImport terminé en %dm %02ds.%n",
            elapsed.toMinutes(), elapsed.toSecondsPart());
        System.out.println("Base SQLite : " + outputPath);
    }

    // -------------------------------------------------------------------------

    private static Connection openDb(String path) throws SQLException {
        Connection conn = DriverManager.getConnection("jdbc:sqlite:" + path);
        try (Statement st = conn.createStatement()) {
            // Optimisations SQLite pour l'import en masse
            st.execute("PRAGMA journal_mode = WAL");
            st.execute("PRAGMA synchronous = NORMAL");
            st.execute("PRAGMA cache_size = -64000"); // 64 MB
            st.execute("PRAGMA temp_store = MEMORY");
        }
        return conn;
    }

    private static void createSchema(Connection db) throws SQLException {
        try (Statement st = db.createStatement()) {
            st.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    barcode         TEXT PRIMARY KEY,
                    name            TEXT NOT NULL,
                    name_fr         TEXT,
                    brand           TEXT,
                    calories_100g   REAL,
                    proteins_100g   REAL,
                    carbs_100g      REAL,
                    sugars_100g     REAL,
                    fat_100g        REAL,
                    saturated_fat_100g REAL,
                    fiber_100g      REAL,
                    salt_100g       REAL,
                    nutri_score     TEXT
                )
            """);
            System.out.println("Schéma créé.");
        }
    }

    private static void importData(Connection db, File file) throws Exception {
        ObjectMapper mapper = new ObjectMapper();

        String sql = """
            INSERT OR IGNORE INTO products
                (barcode, name, name_fr, brand,
                 calories_100g, proteins_100g, carbs_100g, sugars_100g,
                 fat_100g, saturated_fat_100g, fiber_100g, salt_100g, nutri_score)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        """;

        long lineCount = 0;
        long inserted = 0;
        long skipped = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(file), 1 << 20); // 1 MB buffer
             PreparedStatement ps = db.prepareStatement(sql)) {

            db.setAutoCommit(false);
            String line;

            while ((line = reader.readLine()) != null) {
                lineCount++;
                line = line.trim();
                if (line.isEmpty() || line.equals("[") || line.equals("]")) continue;
                // Le JSONL peut avoir des virgules de fin de ligne
                if (line.endsWith(",")) line = line.substring(0, line.length() - 1);

                try {
                    JsonNode p = mapper.readTree(line);

                    // --- Nom : préférer le nom français ---
                    String name = bestName(p);
                    if (name == null || name.isBlank()) { skipped++; continue; }

                    // --- Calories obligatoires ---
                    JsonNode nutriments = p.get("nutriments");
                    double calories = getDouble(nutriments, "energy-kcal_100g");
                    if (calories <= 0) { skipped++; continue; }

                    String barcode = getText(p, "code");
                    if (barcode == null || barcode.isBlank()) barcode = "OFF-" + lineCount;

                    ps.setString(1, barcode);
                    ps.setString(2, name);
                    ps.setString(3, getText(p, "product_name_fr"));
                    ps.setString(4, getText(p, "brands"));
                    ps.setDouble(5, calories);
                    ps.setObject(6, getDoubleOrNull(nutriments, "proteins_100g"));
                    ps.setObject(7, getDoubleOrNull(nutriments, "carbohydrates_100g"));
                    ps.setObject(8, getDoubleOrNull(nutriments, "sugars_100g"));
                    ps.setObject(9, getDoubleOrNull(nutriments, "fat_100g"));
                    ps.setObject(10, getDoubleOrNull(nutriments, "saturated-fat_100g"));
                    ps.setObject(11, getDoubleOrNull(nutriments, "fiber_100g"));
                    ps.setObject(12, getDoubleOrNull(nutriments, "salt_100g"));
                    ps.setString(13, getNutriScore(p));

                    ps.addBatch();
                    inserted++;

                    if (inserted % BATCH_SIZE == 0) {
                        ps.executeBatch();
                        db.commit();
                        printProgress(lineCount, inserted, skipped);
                    }

                } catch (Exception e) {
                    skipped++;
                }
            }

            // Dernier batch
            ps.executeBatch();
            db.commit();
        }

        System.out.printf("%n--- Résultat ----%n");
        System.out.printf("Lignes lues    : %,d%n", lineCount);
        System.out.printf("Produits importés : %,d%n", inserted);
        System.out.printf("Ignorés (sans nom/calories) : %,d%n", skipped);
    }

    private static void createIndexes(Connection db) throws SQLException {
        System.out.println("Création des index...");
        try (Statement st = db.createStatement()) {
            st.execute("CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE)");
            st.execute("CREATE INDEX IF NOT EXISTS idx_products_name_fr ON products(name_fr COLLATE NOCASE)");
            st.execute("CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand COLLATE NOCASE)");
        }
        System.out.println("Index créés.");
    }

    // -------------------------------------------------------------------------

    private static String bestName(JsonNode p) {
        String fr = getText(p, "product_name_fr");
        if (fr != null && !fr.isBlank()) return fr;
        String generic = getText(p, "product_name");
        if (generic != null && !generic.isBlank()) return generic;
        return getText(p, "product_name_en");
    }

    private static String getNutriScore(JsonNode p) {
        String grade = getText(p, "nutriscore_grade");
        if (grade != null && !grade.isBlank() && !grade.equalsIgnoreCase("unknown")) {
            return grade.toUpperCase();
        }
        // Fallback : chercher dans nutriscore.2023.grade
        JsonNode ns = p.get("nutriscore");
        if (ns != null) {
            JsonNode n2023 = ns.get("2023");
            if (n2023 != null) return getText(n2023, "grade", "").toUpperCase();
            JsonNode n2021 = ns.get("2021");
            if (n2021 != null) return getText(n2021, "grade", "").toUpperCase();
        }
        return null;
    }

    private static String getText(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode v = node.get(field);
        return (v != null && !v.isNull()) ? v.asText() : null;
    }

    private static String getText(JsonNode node, String field, String defaultValue) {
        String v = getText(node, field);
        return v != null ? v : defaultValue;
    }

    private static double getDouble(JsonNode node, String field) {
        if (node == null) return 0;
        JsonNode v = node.get(field);
        return (v != null && !v.isNull() && v.isNumber()) ? v.asDouble() : 0;
    }

    private static Double getDoubleOrNull(JsonNode node, String field) {
        if (node == null) return null;
        JsonNode v = node.get(field);
        return (v != null && !v.isNull() && v.isNumber()) ? v.asDouble() : null;
    }

    private static void printProgress(long lines, long inserted, long skipped) {
        System.out.printf("\r  %,d lignes lues | %,d importés | %,d ignorés   ",
            lines, inserted, skipped);
    }
}
