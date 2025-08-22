# Supabase Database Setup Guide

This guide provides step-by-step instructions to set up your Supabase database, including tables, Row Level Security (RLS) policies, and database functions.

## Step 1: Create Database Tables

Go to your Supabase dashboard → **SQL Editor** (left sidebar) and run these SQL commands one by one.

### 1. `users` table

```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  wallet_balance DECIMAL(10,2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);