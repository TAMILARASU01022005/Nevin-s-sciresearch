const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.warn("⚠️ Supabase credentials missing or set to placeholder in environment variables!");
}

const supabase = createClient(
  supabaseUrl && !supabaseUrl.includes('your-project-id') ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseKey && !supabaseKey.includes('your-anon') ? supabaseKey : 'placeholder'
);

module.exports = supabase;
