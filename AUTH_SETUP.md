# Authentication Provider Configuration

## Current Status
✅ Email/Password authentication - **Enabled by default**
✅ Magic Links - **Enabled by default** (uses same email authentication system)
⏸️ Google OAuth - Not configured (can be added later if needed)

## Notes
- Email and password authentication is enabled by default in all Supabase projects
- Magic link authentication uses the same email authentication system
- For production, you should configure a custom SMTP server (see docs/ARCHITECTURE.md)
- Email confirmation can be disabled for development in: Authentication > Providers > Email

## Future Configuration (when needed)
To add Google OAuth later:
1. Create Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI from Supabase dashboard
5. Configure in Supabase: Authentication > Providers > Google
