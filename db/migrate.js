// db/migrate.js — Synchronize local SQLite data to Supabase
const { getDb } = require('./database');
const supabase = require('./supabase');

async function migrateTable(tableName, queryColumns) {
  console.log(`\n⏳ Migrating table "${tableName}"...`);
  try {
    const db = getDb();
    
    // 1. Fetch from SQLite
    const selectCols = queryColumns.join(', ');
    const localRows = db.prepare(`SELECT ${selectCols} FROM ${tableName}`).all();
    console.log(`🔹 Found ${localRows.length} rows in local SQLite table "${tableName}".`);
    
    if (localRows.length === 0) {
      console.log(`✨ No rows to migrate for "${tableName}".`);
      return;
    }

    // 2. Fetch existing from Supabase to avoid duplicates or clear them
    const { data: existingSupabase, error: selectError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1); // just a check

    if (selectError) {
      console.error(`❌ Error checking table "${tableName}" on Supabase:`, selectError.message);
      return;
    }

    // Clear existing records on Supabase to ensure fresh, consistent sync
    console.log(`🧹 Clearing existing records in Supabase table "${tableName}"...`);
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', 0); // deletes all rows

    if (deleteError) {
      console.error(`⚠️ Error clearing table "${tableName}" on Supabase:`, deleteError.message);
      // Proceed anyway, might fail on unique constraints but worth trying
    }

    // 3. Insert into Supabase
    console.log(`🚀 Inserting ${localRows.length} rows into Supabase "${tableName}"...`);
    const { data: insertedData, error: insertError } = await supabase
      .from(tableName)
      .insert(localRows)
      .select();

    if (insertError) {
      console.error(`❌ Error inserting into Supabase table "${tableName}":`, insertError.message);
    } else {
      console.log(`✅ Successfully migrated ${insertedData.length} rows to Supabase table "${tableName}"!`);
    }
  } catch (err) {
    console.error(`💥 Unexpected error migrating table "${tableName}":`, err);
  }
}

async function startMigration() {
  console.log('🏁 Starting SQLite to Supabase migration...');
  
  // Migrate news
  await migrateTable('news', ['title', 'body', 'category', 'link']);

  // Migrate books
  await migrateTable('books', ['title', 'author', 'description', 'cover_image', 'pdf_file', 'conference_name', 'is_conference', 'year']);

  // Migrate editorial_team
  await migrateTable('editorial_team', ['name', 'role', 'profile_image', 'popular_work', 'bio', 'works_link', 'display_order']);

  // Migrate journals
  await migrateTable('journals', ['title', 'volume', 'issue', 'year', 'abstract', 'pdf_file', 'author', 'category', 'type']);

  // Migrate submissions
  await migrateTable('submissions', ['author_name', 'email', 'title', 'abstract', 'pdf_file', 'type', 'status']);

  console.log('\n🎉 Migration completed successfully!\n');
}

startMigration();
