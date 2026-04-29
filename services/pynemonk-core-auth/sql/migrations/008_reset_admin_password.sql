-- Migration: 008_reset_admin_password
-- Description: Resets the password for vikas@sparkigniter.com

UPDATE auth.user_credential 
SET password_hash = '$2b$12$Wbkdx61wwjKAQwohUBsGVe76p6K4Nxl/OfVhTXkU1b6lf6gXl5CYG' -- password123
WHERE user_id = (SELECT id FROM auth.user WHERE email = 'vikas@sparkigniter.com');
