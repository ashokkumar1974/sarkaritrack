function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(`\n\n❌ MISSING ENVIRONMENT VARIABLE: "${key}"\n   Add it to your .env file or Vercel dashboard.\n`);
  }
  return val;
}
function optionalEnv(key: string, defaultVal = ""): string {
  return process.env[key] ?? defaultVal;
}
export const env = {
  DATABASE_URL:         requireEnv("DATABASE_URL"),
  INTERNAL_API_KEY:     requireEnv("INTERNAL_API_KEY"),
  NEXT_PUBLIC_SITE_URL: requireEnv("NEXT_PUBLIC_SITE_URL"),
  OPENAI_API_KEY:       optionalEnv("OPENAI_API_KEY"),
  ANTHROPIC_API_KEY:    optionalEnv("ANTHROPIC_API_KEY"),
  API_BASE_URL:         optionalEnv("API_BASE_URL", "http://localhost:8000"),
  VAPID_PUBLIC_KEY:     optionalEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
  VAPID_PRIVATE_KEY:    optionalEnv("VAPID_PRIVATE_KEY"),
  VAPID_CONTACT:        optionalEnv("VAPID_CONTACT", "mailto:admin@sarkaritrack.in"),
  TELEGRAM_BOT_TOKEN:   optionalEnv("TELEGRAM_BOT_TOKEN"),
  TELEGRAM_CHANNEL_ID:  optionalEnv("TELEGRAM_CHANNEL_ID"),
  REVALIDATE_SECRET:    optionalEnv("NEXTJS_REVALIDATE_SECRET"),
  isProd: process.env.NODE_ENV === "production",
  isDev:  process.env.NODE_ENV === "development",
  aiModel: process.env.AI_MODEL ?? (process.env.ANTHROPIC_API_KEY ? "claude-3-5-sonnet-20241022" : "gpt-4o"),
} as const;
