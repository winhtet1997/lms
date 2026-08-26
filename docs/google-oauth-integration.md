# Google OAuth Integration — Approach A

## Overview

Users can sign in or sign up using their Google account on Web (Next.js) and Mobile (Flutter).
The backend (Django) verifies the Google ID token and issues its own JWT — keeping the existing
auth system intact. Google credentials never touch the frontend beyond the initial sign-in step.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (Web / Flutter)                                         │
│                                                                 │
│  1. User taps "Continue with Google"                            │
│  2. Google SDK returns an ID Token (JWT string)                 │
│  3. POST /auth/google-auth/  { id_token, role }                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Django Backend                                                 │
│                                                                 │
│  4. Verify ID token with Google's public keys                   │
│  5. Extract { email, google_id, name, avatar }                  │
│  6. Lookup user by google_id or email                           │
│                                                                 │
│  ┌─ Case A: Existing user with google_id linked                 │
│  │   → Return access + refresh JWT (normal login)               │
│  │                                                              │
│  ├─ Case B: Existing user, google_id not linked yet             │
│  │   → Link google_id to account                                │
│  │   → Return access + refresh JWT                              │
│  │                                                              │
│  ├─ Case C: New user (Student or Parent only)                   │
│  │   → Create partial account (no password yet)                 │
│  │   → Return { needs_setup: true, temp_token }                 │
│  │                                                              │
│  └─ Case D: New user is Tutor                                   │
│      → Same as Case C (needs_setup flow)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │ Case A / B                      │ Case C
          ▼                                 ▼
   Store JWT in                    Show "Complete Setup" screen
   localStorage / secure           (username, password, full name)
   storage. Done.                          │
                                           ▼
                                  POST /auth/google-complete-setup/
                                           │
                                           ▼
                                  Return access + refresh JWT. Done.
```

---

## Roles & Rules

| Role    | Google Sign-Up | Google Login |
|---------|---------------|--------------|
| Student | Allowed       | Allowed      |
| Parent  | Allowed       | Allowed      |
| Tutor   | Allowed       | Allowed      |

---

## Backend Changes

### 1. User Model

Add to the existing `User` model:

```python
google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
avatar_url = models.URLField(blank=True, null=True)  # populated from Google profile
```

### 2. New Endpoints

#### `POST /auth/google-auth/`

Accepts the Google ID token from the client.

**Request body:**
```json
{
  "id_token": "<google_id_token_string>",
  "role": 1
}
```
> `role`: 1 = Student, 2 = Parent, 3 = Tutor

**Response — existing user (Case A / B):**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": { "id": 1, "email": "user@example.com", "role": 1 }
}
```

**Response — new user needs setup (Case C):**
```json
{
  "needs_setup": true,
  "temp_token": "<short_lived_token>",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "avatar_url": "https://..."
}
```

---

#### `POST /auth/google-complete-setup/`

Called after Case C to finish account creation.

**Request body:**
```json
{
  "temp_token": "<temp_token_from_previous_step>",
  "username": "janedoe",
  "password": "SecurePass123!",
  "full_name": "Jane Doe"
}
```

**Response:**
```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>",
  "user": { "id": 42, "email": "user@example.com", "role": 1 }
}
```

### 3. Dependencies

```
google-auth>=2.0.0
google-auth-httplib2
```

Token verification uses `google.oauth2.id_token.verify_oauth2_token()` — no redirect,
no server-side session, fully stateless.

---

## Frontend Changes (Next.js)

### Dependency

```
@react-oauth/google
```

### Where to add the Google button

| Page            | Sign-up button | Sign-in button |
|-----------------|---------------|---------------|
| Student Login   |               | ✓             |
| Student Sign-up | ✓             |               |
| Parent Login    |               | ✓             |
| Parent Sign-up  | ✓             |               |
| Tutor Login     |               | ✓             |

### Flow

```js
// 1. Get credential from Google
const { credential } = useGoogleLogin(...)  // ID token string

// 2. Send to backend
const res = await post('/auth/google-auth/', { id_token: credential, role })

// 3. Branch on response
if (res.needs_setup) {
  router.push('/auth/google-setup')   // show setup form
} else {
  storeTokens(res.access, res.refresh)
  router.push('/dashboard')
}
```

### Complete Setup Screen

- Route: `/auth/google-setup`
- Fields: Full Name (pre-filled from Google), Username, Password, Confirm Password
- On submit: `POST /auth/google-complete-setup/` → store tokens → redirect to dashboard

---

## Mobile Changes (Flutter)

### Dependency

```yaml
google_sign_in: ^6.0.0
```

### Flow

```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

final account = await _googleSignIn.signIn();
final auth = await account!.authentication;
final idToken = auth.idToken;  // same token type as web

// POST to same backend endpoint
final res = await api.post('/auth/google-auth/', { 'id_token': idToken, 'role': role });

if (res['needs_setup'] == true) {
  Navigator.pushNamed(context, '/google-setup');
} else {
  authStore.setTokens(res['access'], res['refresh']);
}
```

The backend endpoint is identical for web and mobile — no platform-specific backend logic needed.

---

## Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use existing)
3. Enable **Google Identity** (no extra API needed for sign-in only)
4. Create OAuth 2.0 credentials:

| Credential type      | Used by         | Required fields                        |
|---------------------|-----------------|----------------------------------------|
| Web application      | Next.js frontend | Authorized origins, redirect URIs      |
| Android application  | Flutter Android  | Package name + SHA-1 fingerprint       |
| iOS application      | Flutter iOS      | Bundle ID                              |

5. Add `GOOGLE_CLIENT_ID` to backend env — used to verify tokens server-side
6. Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to frontend `.env`

---

## Future: Google Meet for Tutors

This is a separate OAuth flow — completely independent from login.

When a tutor creates their first live session, trigger an additional consent screen
requesting `https://www.googleapis.com/auth/calendar` scope with `access_type=offline`.

```
Tutor clicks "Create Live Session"
        │
        ▼
Does tutor have google_calendar_refresh_token stored?
        │
   No ──┼──► Trigger Google Calendar OAuth consent
        │               │
        │               ▼
        │    Store refresh_token in TutorProfile
        │
  Yes ──┴──► Use stored token to create Google Meet via Calendar API
```

**Backend field to add later (TutorProfile):**
```python
google_calendar_refresh_token = models.TextField(blank=True, null=True)
```

This is intentionally deferred — the sign-in flow does not request Calendar scope,
following Google's incremental authorization best practice.

---

## Environment Variables

### Backend (`.env`)
```
GOOGLE_CLIENT_ID=<your_web_client_id>.apps.googleusercontent.com
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your_web_client_id>.apps.googleusercontent.com
```

---

## Security Notes

- ID tokens are short-lived (~1 hour) and verified server-side against Google's public keys
- The `temp_token` issued during setup should expire in 15 minutes
- Never store the raw Google ID token — it is only used once during the auth handshake
- The `google_id` field is the stable identifier, not email (Google emails can change)