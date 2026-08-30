import fs from "node:fs";
import path from "node:path";

const [file] = process.argv.slice(2);
if (!file) throw new Error("Usage: node scripts/upload-backup.mjs <file.sql>");
const baseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!baseUrl || !key) throw new Error("Supabase backup secrets missing");

const bucket = "database-backups";
const name = path.basename(file);
if (!/^voidworks-[A-Za-z0-9T_.-]+\.sql$/.test(name)) throw new Error("Unsafe backup filename");
const headers = { Authorization: `Bearer ${key}`, apikey: key };

const upload = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(name)}`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/sql", "x-upsert": "false" },
  body: fs.readFileSync(file),
});
if (!upload.ok) throw new Error(`Backup upload failed (${upload.status})`);

const listing = await fetch(`${baseUrl}/storage/v1/object/list/${bucket}`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({ prefix: "", limit: 1000, sortBy: { column: "created_at", order: "asc" } }),
});
if (!listing.ok) throw new Error(`Backup listing failed (${listing.status})`);
const files = await listing.json();
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
const expired = (Array.isArray(files) ? files : [])
  .filter((item) => typeof item?.name === "string" && item.name.endsWith(".sql") && item.created_at && new Date(item.created_at).getTime() < cutoff)
  .map((item) => item.name);

if (expired.length) {
  const removal = await fetch(`${baseUrl}/storage/v1/object/${bucket}`, {
    method: "DELETE",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: expired }),
  });
  if (!removal.ok) throw new Error(`Backup retention cleanup failed (${removal.status})`);
}
console.log(`Uploaded ${name}; removed ${expired.length} expired backup(s).`);
