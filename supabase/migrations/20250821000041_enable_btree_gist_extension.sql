-- Migration: 20250821000041_enable_btree_gist_extension.sql
-- Description: Enables the btree_gist extension required for range types and operators.

CREATE EXTENSION IF NOT EXISTS btree_gist;