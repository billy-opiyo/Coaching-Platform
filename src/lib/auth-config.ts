export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.DATABASE_URL);
}

export function isSignupAvailable(): boolean {
  return process.env.AUTH_SIGNUPS_ENABLED === "true"
    && isAuthConfigured()
    && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.APP_URL);
}

export function isAccountEmailAvailable(): boolean {
  return isAuthConfigured() && Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.APP_URL);
}
