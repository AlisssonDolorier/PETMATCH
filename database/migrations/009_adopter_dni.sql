-- 009_adopter_dni.sql
-- Documento nacional de identidad para la cuenta del adoptante.

ALTER TABLE users
  ADD COLUMN dni VARCHAR(20);

-- En el flujo normal del adoptante el DNI es obligatorio, pero se deja nullable
-- para no romper cuentas históricas ni perfiles de refugio que no lo usan.
