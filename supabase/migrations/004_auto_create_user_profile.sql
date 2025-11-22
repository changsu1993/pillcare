-- PillCare Database Schema
-- Migration 004: Auto-create user profile on signup
-- Created: 2025-01-19
--
-- This migration creates a trigger that automatically creates a user profile
-- in the public.users table when a new user signs up via Supabase Auth.
-- This avoids RLS policy issues during signup.

-- =====================================================
-- FUNCTION: Auto-create user profile
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
  -- Use raw_user_meta_data to get name and phone from signup
  INSERT INTO public.users (id, email, name, phone_number, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'child')::TEXT
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Call handle_new_user on auth.users INSERT
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
