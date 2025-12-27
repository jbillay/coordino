# API Contract: Password Reset

**Feature**: `001-user-config`
**Contract Type**: Supabase Auth Integration
**Date**: 2025-12-27

## Overview

This contract defines the interaction between the Coordino frontend and Supabase Auth for password reset functionality, covering the complete flow from initiating reset to setting a new password.

---

## 1. Initiate Password Reset

### Request

**Method**: `supabase.auth.resetPasswordForEmail()`

**Parameters**:
```javascript
{
  email: string,           // User's registered email address
  options: {
    redirectTo: string     // URL to redirect after clicking email link
  }
}
```

**Example**:
```javascript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://coordino.app/reset-password'
  }
)
```

### Response

**Success** (HTTP 200):
```javascript
{
  data: {},
  error: null
}
```
- Empty data object indicates email sent successfully
- No indication whether email exists (security: prevent user enumeration)

**Error** (HTTP 400):
```javascript
{
  data: null,
  error: {
    message: "Email rate limit exceeded",
    status: 429
  }
}
```

### Error Scenarios

| Error Code | Message | Handling |
|------------|---------|----------|
| 429 | "Email rate limit exceeded" | Show user: "Too many requests. Please try again in a few minutes." |
| 400 | "Invalid email format" | Show validation error inline |
| 500 | "Email service unavailable" | Show: "We're experiencing technical issues. Please try again later." + Retry with exponential backoff |

### Client-Side Validation

**Before calling API**:
```javascript
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) return { valid: false, error: 'Email is required' }
  if (!emailRegex.test(email)) return { valid: false, error: 'Invalid email format' }
  return { valid: true }
}
```

### Rate Limiting

**Supabase Default**: 4 emails per hour per IP address

**Frontend Handling**:
- Disable submit button for 60 seconds after successful submission
- Display countdown: "Email sent. You can request another in 59 seconds."
- Store timestamp in localStorage to persist across page refreshes

---

## 2. Verify Reset Token

### URL Format

**Email link redirects to**:
```
https://coordino.app/reset-password?token=<token>&type=recovery
```

**Token Characteristics**:
- Type: JWT (JSON Web Token)
- Validity: 24 hours from email sent
- Single-use: Invalidated after successful password update
- Secure: Cannot be guessed or brute-forced

### Request

**Method**: `supabase.auth.getSession()`

**Context**: Called automatically when user lands on reset-password page

**Example**:
```javascript
const { data: { session }, error } = await supabase.auth.getSession()

if (session?.user) {
  // Valid token, user authenticated
  // Show password update form
} else {
  // Invalid/expired token
  // Show error + link to request new reset
}
```

### Response

**Valid Token**:
```javascript
{
  data: {
    session: {
      access_token: "eyJ...",
      user: {
        id: "uuid",
        email: "user@example.com",
        aud: "authenticated",
        role: "authenticated"
      }
    }
  },
  error: null
}
```

**Invalid/Expired Token**:
```javascript
{
  data: { session: null },
  error: {
    message: "Invalid or expired token",
    status: 401
  }
}
```

### Error Handling

**Expired Token**:
```javascript
if (!session) {
  // Show error message
  "This password reset link has expired. Password reset links are valid for 24 hours."

  // Provide CTA
  "Request a new password reset link"
}
```

---

## 3. Update Password

### Request

**Method**: `supabase.auth.updateUser()`

**Parameters**:
```javascript
{
  password: string  // New password (client-side validated)
}
```

**Example**:
```javascript
const { data, error } = await supabase.auth.updateUser({
  password: 'NewSecureP@ssw0rd!'
})
```

### Client-Side Validation

**Password Requirements** (FR-003):
```javascript
const validatePassword = (password) => {
  const errors = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must include lowercase letters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include uppercase letters')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must include numbers')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must include special characters')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

### Response

**Success** (HTTP 200):
```javascript
{
  data: {
    user: {
      id: "uuid",
      email: "user@example.com",
      updated_at: "2025-12-27T10:30:00Z"
    }
  },
  error: null
}
```

**Side Effects**:
- ✅ Password updated in `auth.users` table (hashed with bcrypt)
- ✅ All existing sessions invalidated (user must re-login)
- ✅ Password reset token invalidated (cannot be reused)

**Error** (HTTP 400):
```javascript
{
  data: null,
  error: {
    message: "Password should be at least 8 characters",
    status: 400
  }
}
```

### Error Scenarios

| Error Code | Message | Handling |
|------------|---------|----------|
| 400 | "Password too weak" | Show validation errors from client-side check |
| 401 | "Session expired" | Redirect to login with message: "Your session has expired. Please log in again." |
| 500 | "Failed to update password" | Show: "An error occurred. Please try again." + Retry option |

---

## 4. Post-Reset Flow

### Session Invalidation (FR-004)

**Automatic Behavior**:
- Supabase Auth changes `aud` claim in existing JWT tokens
- All active sessions become invalid immediately
- User MUST log in with new password

**Frontend Handling**:
```javascript
const handlePasswordUpdateSuccess = async () => {
  // 1. Show success message
  showToast('Password updated successfully! Please log in with your new password.', { type: 'success' })

  // 2. Sign out current session (if any)
  await supabase.auth.signOut()

  // 3. Redirect to login page after 2 seconds
  setTimeout(() => {
    router.push('/login')
  }, 2000)
}
```

---

## 5. Security Considerations

### Token Security

**Storage**:
- ❌ Never store password reset token in localStorage or cookies
- ✅ Extract from URL, use immediately, then clear from URL history
- ✅ Token is single-use and auto-invalidates after password update

**Transmission**:
- ✅ All requests over HTTPS (enforced by Supabase)
- ✅ Token in URL fragment (not sent to server in Referer header)

### Password Security

**Storage**:
- ❌ Never log passwords (not even to console.error)
- ❌ Never send passwords unencrypted
- ✅ Passwords hashed with bcrypt by Supabase Auth
- ✅ Hash salt auto-generated per password

**Validation**:
- ✅ Client-side validation for UX (immediate feedback)
- ✅ Server-side validation by Supabase Auth (security boundary)
- ✅ Database check constraint enforces minimum length

### User Enumeration Prevention

**Email Sent Response**:
- ✅ Always return success, even if email doesn't exist
- ✅ Display generic message: "If an account exists with this email, you will receive a password reset link."
- ✅ Rate limiting prevents brute-force enumeration

---

## 6. Email Template Customization

### Default Template Variables

```html
<!-- Supabase provides these variables -->
{{ .ConfirmationURL }}  <!-- Password reset link -->
{{ .SiteURL }}           <!-- Application URL -->
{{ .Email }}             <!-- User's email -->
```

### Coordino Custom Template

**Subject**: `Reset your Coordino password`

**Body**:
```html
<p>Hi there,</p>

<p>We received a request to reset your Coordino password.</p>

<p>Click the button below to create a new password:</p>

<a href="{{ .ConfirmationURL }}"
   style="
     background-color: #14b8a6;
     color: #ffffff;
     padding: 12px 24px;
     text-decoration: none;
     border-radius: 6px;
     display: inline-block;
     font-weight: 600;
   ">
  Reset Password
</a>

<p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
  This link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email.
</p>

<p style="color: #6b7280; font-size: 14px;">
  If the button doesn't work, copy and paste this link into your browser:<br>
  {{ .ConfirmationURL }}
</p>
```

**Customization Location**: Supabase Dashboard > Authentication > Email Templates > Reset Password

---

## 7. Testing Contract

### Unit Tests

**Test**: `validateEmail` function
```javascript
describe('validateEmail', () => {
  it('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com').valid).toBe(true)
    expect(validateEmail('test.user+tag@domain.co.uk').valid).toBe(true)
  })

  it('rejects invalid email addresses', () => {
    expect(validateEmail('not-an-email').valid).toBe(false)
    expect(validateEmail('missing@domain').valid).toBe(false)
    expect(validateEmail('').valid).toBe(false)
  })
})
```

**Test**: `validatePassword` function
```javascript
describe('validatePassword', () => {
  it('accepts passwords meeting all requirements', () => {
    expect(validatePassword('SecureP@ss123').valid).toBe(true)
  })

  it('rejects passwords missing requirements', () => {
    const result = validatePassword('short')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
```

### Integration Tests

**Test**: Password reset flow with Supabase Auth
```javascript
describe('Password Reset Flow', () => {
  it('sends reset email for valid address', async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      'test@example.com',
      { redirectTo: 'http://localhost:3000/reset-password' }
    )

    expect(error).toBeNull()
  })

  it('updates password with valid token', async () => {
    // Requires valid reset token from email (manual testing)
    const { data, error } = await supabase.auth.updateUser({
      password: 'NewP@ssw0rd123'
    })

    expect(error).toBeNull()
    expect(data.user).toBeDefined()
  })
})
```

### E2E Tests

**Scenario**: Complete password reset journey (SC-001)
```javascript
test('user completes password reset in under 3 minutes', async ({ page }) => {
  const startTime = Date.now()

  // 1. Navigate to login page
  await page.goto('/login')

  // 2. Click "Forgot Password"
  await page.click('text=Forgot Password')

  // 3. Enter email and submit
  await page.fill('[name="email"]', 'test@example.com')
  await page.click('button:has-text("Send Reset Link")')

  // 4. Verify success message
  await expect(page.locator('text=Email sent')).toBeVisible()

  // 5. Check inbox (manual step - Playwright can't access email)
  // For E2E test, use Supabase test endpoint or mail trap service

  // 6. Navigate to reset page with token
  await page.goto('/reset-password?token=TEST_TOKEN&type=recovery')

  // 7. Enter new password
  await page.fill('[name="new-password"]', 'NewSecureP@ss123!')
  await page.fill('[name="confirm-password"]', 'NewSecureP@ss123!')

  // 8. Submit password update
  await page.click('button:has-text("Update Password")')

  // 9. Verify success and redirect to login
  await expect(page).toHaveURL('/login')
  await expect(page.locator('text=Password updated successfully')).toBeVisible()

  // 10. Verify completion time
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(180000) // 3 minutes = 180,000ms
})
```

---

## Contract Summary

**Endpoints**:
1. ✅ `resetPasswordForEmail(email, options)` - Initiate reset
2. ✅ `getSession()` - Verify token on redirect
3. ✅ `updateUser({ password })` - Set new password
4. ✅ `signOut()` - Clear session after password update

**Validation**:
- Client-side: Email format, password strength (immediate UX feedback)
- Server-side: Supabase Auth enforces constraints (security boundary)

**Security**:
- Tokens: Single-use, 24-hour expiration, HTTPS-only
- Passwords: Bcrypt hashing, never logged, strong requirements
- Sessions: All invalidated on password change

**Error Handling**:
- User-friendly messages (never raw technical errors)
- Rate limiting with countdown display
- Retry logic for transient failures

**Testing**:
- Unit: Validation functions
- Integration: Supabase Auth API calls
- E2E: Complete password reset journey (<3 min completion time)
