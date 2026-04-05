import org.w3c.dom.*;
import javax.xml.parsers.*;
import java.io.File;
import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

/**
 * Importe la base Ciqual 2025 (5 fichiers XML) dans la base SQLite mealing.db,
 * table `ingredients`.
 *
 * Usage :
 *   java -jar ciqual-import.jar <répertoire-cliqual> [mealing.db]
 *
 * Exemples :
 *   java -jar ciqual-import.jar ./cliqual
 *   java -jar ciqual-import.jar ./cliqual /chemin/vers/mealing.db
 *
 * Valeurs par défaut :
 *   mealing.db = mealing.db (répertoire courant)
 */
public class CiqualImporter {

    static final int C_CALORIES = 328;   // Energie kcal (règlement UE 1169/2011)
    static final int C_PROTEINS = 25000; // Protéines N x Jones
    static final int C_CARBS    = 31000; // Glucides
    static final int C_SUGARS   = 32000; // Sucres
    static final int C_FAT      = 40000; // Lipides
    static final int C_SAT_FAT  = 40302; // AG saturés
    static final int C_FIBER    = 34100; // Fibres alimentaires
    static final int C_SALT     = 10004; // Sel chlorure de sodium

    static final Set<Integer> WANTED = Set.of(
        C_CALORIES, C_PROTEINS, C_CARBS, C_SUGARS, C_FAT, C_SAT_FAT, C_FIBER, C_SALT
    );

    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.err.println("Usage: java -jar ciqual-import.jar <répertoire-cliqual> [mealing.db]");
            System.exit(1);
        }

        String dir     = args[0];
        String dbPath  = args.length > 1 ? args[1] : "mealing.db";

        System.out.println("[1/4] Lecture des groupes d'aliments...");
        Map<String, String> grpNames = parseGroups(dir);
        System.out.printf("      %d groupes chargés%n", grpNames.size());

        System.out.println("[2/4] Lecture des aliments...");
        Map<String, Alim> alims = parseAliments(dir);
        System.out.printf("      %d aliments chargés%n", alims.size());

        System.out.println("[3/4] Lecture des données nutritionnelles...");
        Map<String, Map<Integer, BigDecimal>> compo = parseCompo(dir);
        System.out.printf("      %d aliments avec données%n", compo.size());

        System.out.println("[4/4] Insertion dans SQLite : " + dbPath);
        int[] counts = insertIngredients(dbPath, alims, grpNames, compo);
        System.out.printf("      %d insérés, %d mis à jour, %d ignorés (0 kcal)%n",
            counts[0], counts[1], counts[2]);
        System.out.println("Import terminé.");
    }

    // -------------------------------------------------------------------------
    // Parsing
    // -------------------------------------------------------------------------

    static Map<String, String> parseGroups(String dir) throws Exception {
        Document doc = parseXml(findFile(dir, "alim_grp"));
        NodeList nodes = doc.getElementsByTagName("ALIM_GRP");
        Map<String, String> result = new LinkedHashMap<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            Element e = (Element) nodes.item(i);
            String code = text(e, "alim_grp_code");
            String nom  = text(e, "alim_grp_nom_fr");
            if (code != null && nom != null && !result.containsKey(code))
                result.put(code, nom);
        }
        return result;
    }

    static Map<String, Alim> parseAliments(String dir) throws Exception {
        Document doc = parseXml(findFile(dir, "alim_2"));
        NodeList nodes = doc.getElementsByTagName("ALIM");
        Map<String, Alim> result = new LinkedHashMap<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            Element e = (Element) nodes.item(i);
            String code    = text(e, "alim_code");
            String nomFr   = text(e, "alim_nom_fr");
            String grpCode = text(e, "alim_grp_code");
            if (code != null && nomFr != null)
                result.put(code, new Alim(code, nomFr, grpCode));
        }
        return result;
    }

    static Map<String, Map<Integer, BigDecimal>> parseCompo(String dir) throws Exception {
        Document doc = parseXml(findFile(dir, "compo"));
        NodeList nodes = doc.getElementsByTagName("COMPO");
        Map<String, Map<Integer, BigDecimal>> result = new HashMap<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            Element e = (Element) nodes.item(i);
            String alimCode = text(e, "alim_code");
            String constStr = text(e, "const_code");
            String teneur   = text(e, "teneur");
            if (alimCode == null || constStr == null) continue;
            int constCode;
            try { constCode = Integer.parseInt(constStr.trim()); }
            catch (NumberFormatException ex) { continue; }
            if (!WANTED.contains(constCode)) continue;
            result.computeIfAbsent(alimCode, k -> new HashMap<>())
                  .put(constCode, parseTeneur(teneur));
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // Insertion SQLite
    // -------------------------------------------------------------------------

    static int[] insertIngredients(String dbPath,
                                    Map<String, Alim> alims,
                                    Map<String, String> grpNames,
                                    Map<String, Map<Integer, BigDecimal>> compo) throws Exception {
        int inserted = 0, updated = 0, skipped = 0;

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath)) {
            // Les pragmas doivent être exécutés hors transaction (avant setAutoCommit(false))
            try (Statement st = conn.createStatement()) {
                st.execute("PRAGMA journal_mode=WAL");
                st.execute("PRAGMA synchronous=NORMAL");
                st.execute("PRAGMA cache_size=-32000");
            }

            conn.setAutoCommit(false);

            // SQLite ne supporte pas ON CONFLICT sur une colonne sans contrainte UNIQUE.
            // On fait : SELECT id → UPDATE si existant, INSERT sinon.
            String selectSql = "SELECT id FROM ingredients WHERE off_id = ?";
            String insertSql = """
                INSERT INTO ingredients
                  (id, name, category, calories_100g, proteins_100g, carbs_100g,
                   sugars_100g, fat_100g, saturated_fat_100g, fiber_100g, salt_100g,
                   off_id, is_custom, source, created_at)
                VALUES (lower(hex(randomblob(4)))||'-'||lower(hex(randomblob(2)))||'-4'||
                        substr(lower(hex(randomblob(2))),2)||'-'||
                        substr('89ab',abs(random())%4+1,1)||
                        substr(lower(hex(randomblob(2))),2)||'-'||
                        lower(hex(randomblob(6))),
                        ?,?,?,?,?,?,?,?,?,?,?,0,'CIQUAL',datetime('now'))
                """;
            String updateSql = """
                UPDATE ingredients SET
                  name=?, category=?, calories_100g=?, proteins_100g=?, carbs_100g=?,
                  sugars_100g=?, fat_100g=?, saturated_fat_100g=?, fiber_100g=?,
                  salt_100g=?, source='CIQUAL'
                WHERE off_id=?
                """;

            try (PreparedStatement sel = conn.prepareStatement(selectSql);
                 PreparedStatement ins = conn.prepareStatement(insertSql);
                 PreparedStatement upd = conn.prepareStatement(updateSql)) {

                int batch = 0;
                for (Map.Entry<String, Alim> entry : alims.entrySet()) {
                    String alimCode = entry.getKey();
                    Alim alim       = entry.getValue();

                    Map<Integer, BigDecimal> vals = compo.getOrDefault(alimCode, Map.of());
                    BigDecimal calories = vals.getOrDefault(C_CALORIES, BigDecimal.ZERO);
                    if (calories.compareTo(BigDecimal.ZERO) == 0) { skipped++; continue; }

                    String offId    = "CIQUAL_" + alimCode.trim();
                    String category = mapCategory(alim.grpCode, grpNames);
                    String nom      = alim.nomFr.trim();
                    BigDecimal prot = vals.getOrDefault(C_PROTEINS, BigDecimal.ZERO);
                    BigDecimal carb = vals.getOrDefault(C_CARBS,    BigDecimal.ZERO);
                    BigDecimal sug  = vals.getOrDefault(C_SUGARS,   BigDecimal.ZERO);
                    BigDecimal fat  = vals.getOrDefault(C_FAT,      BigDecimal.ZERO);
                    BigDecimal sat  = vals.getOrDefault(C_SAT_FAT,  BigDecimal.ZERO);
                    BigDecimal fib  = vals.getOrDefault(C_FIBER,    BigDecimal.ZERO);
                    BigDecimal salt = vals.getOrDefault(C_SALT,     BigDecimal.ZERO);

                    sel.setString(1, offId);
                    try (ResultSet rs = sel.executeQuery()) {
                        if (rs.next()) {
                            // UPDATE
                            upd.setString(1, nom); upd.setString(2, category);
                            upd.setBigDecimal(3, calories); upd.setBigDecimal(4, prot);
                            upd.setBigDecimal(5, carb); upd.setBigDecimal(6, sug);
                            upd.setBigDecimal(7, fat); upd.setBigDecimal(8, sat);
                            upd.setBigDecimal(9, fib); upd.setBigDecimal(10, salt);
                            upd.setString(11, offId);
                            upd.addBatch();
                            updated++;
                        } else {
                            // INSERT
                            ins.setString(1, nom); ins.setString(2, category);
                            ins.setBigDecimal(3, calories); ins.setBigDecimal(4, prot);
                            ins.setBigDecimal(5, carb); ins.setBigDecimal(6, sug);
                            ins.setBigDecimal(7, fat); ins.setBigDecimal(8, sat);
                            ins.setBigDecimal(9, fib); ins.setBigDecimal(10, salt);
                            ins.setString(11, offId);
                            ins.addBatch();
                            inserted++;
                        }
                    }

                    batch++;
                    if (batch % 200 == 0) {
                        ins.executeBatch(); upd.executeBatch();
                        conn.commit();
                        System.out.printf("      ... %d traités%n", batch);
                    }
                }
                ins.executeBatch(); upd.executeBatch();
                conn.commit();
            }
        }
        return new int[]{ inserted, updated, skipped };
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    record Alim(String code, String nomFr, String grpCode) {}

    static File findFile(String dir, String prefix) {
        File d = new File(dir);
        File[] files = d.listFiles((f, n) -> n.startsWith(prefix) && n.endsWith(".xml"));
        if (files == null || files.length == 0)
            throw new RuntimeException("Fichier introuvable avec le préfixe '" + prefix + "' dans " + dir);
        return files[0];
    }

    static Document parseXml(File f) throws Exception {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setExpandEntityReferences(false);
        return dbf.newDocumentBuilder().parse(f);
    }

    static String text(Element parent, String tag) {
        NodeList nl = parent.getElementsByTagName(tag);
        if (nl.getLength() == 0) return null;
        Node n = nl.item(0);
        if (n instanceof Element el && el.hasAttribute("missing")) return null;
        String v = n.getTextContent();
        return v == null ? null : v.trim();
    }

    static BigDecimal parseTeneur(String raw) {
        if (raw == null) return BigDecimal.ZERO;
        raw = raw.trim().replace(",", ".");
        if (raw.isEmpty() || raw.equals("-") || raw.equalsIgnoreCase("traces")) return BigDecimal.ZERO;
        if (raw.startsWith("<") || raw.startsWith(">")) raw = raw.substring(1).trim();
        try { return new BigDecimal(raw); }
        catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }

    static String mapCategory(String grpCode, Map<String, String> grpNames) {
        if (grpCode == null) return "Autres";
        String name = grpNames.getOrDefault(grpCode.trim(), "").toLowerCase();
        if (name.contains("légume") || name.contains("crudité")) return "Légumes";
        if (name.contains("fruit"))                               return "Fruits";
        if (name.contains("viande") || name.contains("poisson") ||
            name.contains("charcuterie") || name.contains("crustacé"))
                                                                  return "Viandes & Poissons";
        if (name.contains("lait") || name.contains("fromage") ||
            name.contains("œuf") || name.contains("oeuf"))       return "Produits laitiers";
        if (name.contains("céréale") || name.contains("féculent") ||
            name.contains("pain") || name.contains("pâte") ||
            name.contains("riz") || name.contains("viennoiserie"))return "Féculents";
        if (name.contains("matière grasse") || name.contains("huile") ||
            name.contains("beurre"))                              return "Matières grasses";
        if (name.contains("boisson") || name.contains("eau") ||
            name.contains("jus") || name.contains("alcool"))     return "Boissons";
        return "Épicerie";
    }
}
