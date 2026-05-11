import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { db, reportsTable } from "@workspace/db";
import { eq, like } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Starting image migration...");
  
  // Find reports with base64 images
  const reports = await db
    .select()
    .from(reportsTable)
    .where(like(reportsTable.imageUrl, "data:image/%"));

  console.log(`Found ${reports.length} reports to migrate.`);

  for (const report of reports) {
    try {
      console.log(`Migrating report ${report.id}...`);
      
      // Parse base64
      const matches = report.imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        console.error(`  - Failed to parse base64 for report ${report.id}`);
        continue;
      }
      
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const fileName = `${report.userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, buffer, {
          contentType: `image/${matches[1]}`,
          upsert: false
        });

      if (uploadError) {
        console.error(`  - Supabase upload failed for report ${report.id}:`, uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName);

      await db
        .update(reportsTable)
        .set({ imageUrl: publicUrl })
        .where(eq(reportsTable.id, report.id));

      console.log(`  - Successfully migrated report ${report.id}`);
    } catch (err) {
      console.error(`  - Error migrating report ${report.id}:`, err);
    }
  }
  
  console.log("Migration complete!");
  process.exit(0);
}

migrate();
