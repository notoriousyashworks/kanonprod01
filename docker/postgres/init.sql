-- ====================================================================
-- KicksAura PostgreSQL Initialization Script
-- Executed automatically on container startup when volume is created
-- ====================================================================

-- Create 'kicksaura' role/superuser if it does not exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'kicksaura') THEN
      CREATE ROLE kicksaura LOGIN PASSWORD 'kicksaura' SUPERUSER CREATEDB CREATEROLE;
   END IF;
END
$do$;

-- Create schema 'prod' if it does not exist
CREATE SCHEMA IF NOT EXISTS prod AUTHORIZATION kicksaura;

-- Grant all privileges on schema prod to kicksaura
GRANT ALL PRIVILEGES ON SCHEMA prod TO kicksaura;
