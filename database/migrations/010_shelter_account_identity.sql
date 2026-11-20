-- 010_shelter_account_identity.sql
-- Datos legales del refugio en la cuenta del responsable.

ALTER TABLE users
  ADD COLUMN shelter_name VARCHAR(160),
  ADD COLUMN responsible_name VARCHAR(120),
  ADD COLUMN ruc VARCHAR(11),
  ADD COLUMN responsible_dni VARCHAR(20);

-- Para cuentas de refugio se exige nombre del refugio y del responsable,
-- además de un documento de identidad del refugio o del responsable.
