-- Migration: Add login tracking fields to users and audit_log tables

-- Add new fields to users table
ALTER TABLE users 
ADD COLUMN lastLoginAt DATETIME NULL,
ADD COLUMN loginCount INT DEFAULT 0;

-- Update existing users to set lastLoginAt to their createdAt date
UPDATE users SET lastLoginAt = createdAt WHERE lastLoginAt IS NULL;

-- Add new fields to audit_log table
ALTER TABLE audit_log 
ADD COLUMN loginMethod VARCHAR(255) NULL,
ADD COLUMN failureReason VARCHAR(255) NULL;

-- Update audit_log method enum to include new authentication methods
-- Note: This may need to be adjusted based on your database system
-- For MySQL/MariaDB:
-- ALTER TABLE audit_log MODIFY COLUMN method ENUM('download', 'upload', 'activate', 'deactivate', 'update', 'delete', 'login_email', 'login_microsoft', 'logout', 'login_failed');

-- For PostgreSQL, you would need to:
-- ALTER TYPE method_enum ADD VALUE 'login_email';
-- ALTER TYPE method_enum ADD VALUE 'login_microsoft';
-- ALTER TYPE method_enum ADD VALUE 'logout';
-- ALTER TYPE method_enum ADD VALUE 'login_failed';
