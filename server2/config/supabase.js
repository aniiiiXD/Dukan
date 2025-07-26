const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client with service role key (for backend operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create client with anon key for user operations
const supabaseAnon = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);

module.exports = {
  supabase, // For admin operations
  supabaseAnon, // For user operations with RLS
};
