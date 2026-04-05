-- Ajout de la colonne source pour distinguer les origines des ingrédients
-- MANUAL = saisi manuellement, CIQUAL = importé depuis la base ANSES/Ciqual, OFF = importé depuis OFF

ALTER TABLE ingredients ADD COLUMN source VARCHAR(20);

-- Les seeds existants (V3) sont considérés comme CIQUAL
UPDATE ingredients SET source = 'CIQUAL' WHERE is_custom = FALSE AND off_id IS NULL;

-- Les imports OFF gardent leur off_id, on les marque OFF
UPDATE ingredients SET source = 'OFF' WHERE off_id IS NOT NULL;

-- Les ingrédients custom restent NULL (seront traités comme MANUAL)
