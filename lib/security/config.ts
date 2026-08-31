export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "neolowme@gmail.com").trim().toLowerCase();
export const APP_SESSION_DAYS = 7;
export const VERIFY_CODE_MINUTES = 15;
export const ACTION_CODE_MINUTES = 15;
export const BACKUP_BUCKET = "database-backups";
export const DISCORD_URL = "https://discord.gg/SBtnUvrzg6";
export const RESEND_INBOUND_DOMAIN = (process.env.RESEND_INBOUND_DOMAIN || "").trim().toLowerCase();
