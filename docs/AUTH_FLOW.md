# Authentication Flow with Clerk

This document describes the complete authentication flow for the Hello Miami community portal using Clerk.

## Overview

Hello Miami uses **Clerk** for user authentication, providing a seamless sign-in experience with GitHub OAuth. The auth system integrates with MongoDB to manage member profiles and link Clerk users to community data.

## Architecture

```
┌─────────────────┐       ┌──────────────┐       ┌──────────────┐
│  React Client   │◄─────►│    Clerk     │◄─────►│   GitHub     │
│  (Browser)      │       │              │       │    OAuth     │
└────────┬────────┘       └──────────────┘       └──────────────┘
         │
         │ API Requests
         │ (with session)
         ▼
┌─────────────────┐       ┌──────────────┐
│  React Router   │◄─────►│   MongoDB    │
│  Server (SSR)   │       │   Database   │
└─────────────────┘       └──────────────┘
```

## Authentication Components

### 1. Client-Side Hook (`use-auth.tsx`)

Located at `app/hooks/use-auth.tsx`, this hook provides:

```typescript
interface UseAuth {
  user: User | null | undefined;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

**Features:**
- Wraps Clerk's `useUser()` and `useClerk()` hooks
- Provides consistent interface across the app
- Handles sign-out functionality

**Usage:**
```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Hello {user.emailAddresses[0].emailAddress}</div>;
}
```

### 2. Login Dialog (`LoginDialog.tsx`)

A modal dialog component that triggers Clerk's OAuth flow:

```typescript
<LoginDialog
  trigger={
    <Button variant="primary">
      member_login
    </Button>
  }
/>
```

**Features:**
- Displays community information before login
- Initiates GitHub OAuth via Clerk
- Automatically redirects to dashboard after success

### 3. Server-Side Auth (`getAuth`)

For server-side routes (loaders/actions), use Clerk's `getAuth` helper:

```typescript
import { getAuth } from '@clerk/react-router/server';

export async function loader({ request }: Route.LoaderArgs) {
  const { userId } = await getAuth(request);
  
  if (!userId) {
    throw redirect('/');
  }
  
  // Fetch user data from MongoDB
  const profile = await getProfileByClerkUserId(userId);
  
  return { profile };
}
```

## User Lifecycle

### 1. Initial Sign-In (New User)

When a user signs in for the first time:

1. User clicks "member_login" button
2. `LoginDialog` opens and displays welcome message
3. User clicks "Sign in with GitHub"
4. Clerk redirects to GitHub OAuth consent screen
5. GitHub authenticates user and redirects back to Clerk
6. Clerk creates user account with GitHub profile data
7. User is redirected to `/dashboard`
8. Dashboard checks MongoDB for profile:
   - If **no profile exists**: User needs to be approved by admin
   - If **profile exists**: Dashboard loads user data

### 2. Profile Creation Flow

New users go through an approval process:

1. **User subscribes to Luma calendar** (external step)
2. **Luma webhook** fires `calendar.person.subscribed`
3. **Server creates `pending_user`** record in MongoDB
4. **Admin approves user** via admin panel
5. **Profile is created** in MongoDB with:
   - `lumaEmail` (from Luma subscription)
   - `lumaAttendeeId` (from Luma)
   - `clerkUserId` (initially `null`, linked on first login)
6. **User signs in with Clerk**
7. **Profile is linked** via API endpoint:
   ```typescript
   // Match by email and link Clerk user ID
   const profile = await getProfileByEmail(user.emailAddress);
   await updateProfile(profile._id, { clerkUserId: user.id });
   ```

### 3. Returning User Sign-In

For existing users with linked profiles:

1. User clicks "member_login"
2. Clerk authenticates via GitHub OAuth
3. User redirected to `/dashboard`
4. Profile fetched from MongoDB using `clerkUserId`
5. Dashboard displays user data, projects, badges, etc.

### 4. Sign-Out

When user signs out:

1. User clicks logout button in navbar
2. `useAuth().signOut()` is called
3. Clerk session is terminated
4. User is redirected to home page

## Protected Routes

Protected routes redirect unauthenticated users to the home page:

```typescript
// In dashboard.tsx
export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  
  if (loading) return <LoadingScreen />;
  if (!user) return null;
  
  // Render dashboard...
}
```

## Profile Linking

The profile linking mechanism ensures MongoDB profiles are connected to Clerk users:

### Automatic Linking (on first login)

```typescript
// In API route or loader
const { userId } = await getAuth(request);
const clerkUser = await clerkClient.users.getUser(userId);
const userEmail = clerkUser.emailAddresses[0].emailAddress;

// Try to find profile by Clerk ID first
let profile = await getProfileByClerkUserId(userId);

// If not found, try to find by email and link
if (!profile) {
  profile = await getProfileByEmail(userEmail);
  
  if (profile && !profile.clerkUserId) {
    // Link Clerk user to MongoDB profile
    await updateProfile(profile._id.toString(), {
      clerkUserId: userId
    });
  }
}
```

### Manual Linking (admin action)

Admins can manually link a Clerk user to a profile:

```typescript
// Admin endpoint
await updateProfile(profileId, {
  clerkUserId: clerkUserId
});
```

## Session Management

Clerk handles session management automatically:

- **Client-side**: Sessions are stored in cookies and managed by Clerk
- **Server-side**: Use `getAuth(request)` to verify session on each request
- **Expiration**: Clerk handles session refresh automatically
- **Security**: Sessions are encrypted and signed by Clerk

## Security Considerations

### 1. Environment Variables

**Never commit** Clerk keys to version control:

```env
# Public (safe to expose in client)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Secret (server-only)
CLERK_SECRET_KEY=sk_test_...
```

### 2. OAuth Scopes

Clerk requests the following GitHub scopes:
- `user:email` - Read user email addresses
- `read:user` - Read user profile information

### 3. Profile Access Control

- Users can only access their own profile data
- Admin actions require `isAppAdmin` flag check
- API endpoints verify Clerk session before processing

### 4. CSRF Protection

React Router 7 + Clerk provides built-in CSRF protection:
- All forms use React Router's `<Form>` component
- Clerk validates session tokens on server

## Error Handling

### Common Auth Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `User not found` | No Clerk user ID in request | User needs to sign in |
| `Profile not found` | No MongoDB profile linked | User needs admin approval |
| `Unauthorized` | Session expired or invalid | Redirect to login |
| `Forbidden` | User lacks required permissions | Check `isAppAdmin` flag |

### Error Recovery

```typescript
try {
  const { userId } = await getAuth(request);
  if (!userId) {
    return redirect('/');
  }
  
  const profile = await getProfileByClerkUserId(userId);
  if (!profile) {
    throw new Response('Profile not found', { status: 404 });
  }
  
  return { profile };
} catch (error) {
  console.error('Auth error:', error);
  return redirect('/');
}
```

## Testing

### Development Testing

1. **Create test user** in Clerk dashboard
2. **Add profile** to MongoDB with matching email
3. **Sign in** via GitHub OAuth
4. **Verify profile linking** in MongoDB

### Test Scenarios

- ✅ New user sign-in (pending approval)
- ✅ Approved user sign-in (profile linked)
- ✅ Returning user sign-in (already linked)
- ✅ Sign-out and re-authentication
- ✅ Session expiration handling
- ✅ Protected route access without auth

## Migration Notes

### From Supabase to Clerk

The community portal migrated from Supabase Auth to Clerk in February 2026:

**Changes:**
- Replaced `supabaseUserId` field with `clerkUserId` in profiles
- Removed Supabase client-side auth hooks
- Updated all server-side auth checks to use Clerk
- Migrated existing profiles to link with Clerk users

**Migration Script:**
```javascript
// Rename field in all profiles
db.profiles.updateMany(
  {},
  { $rename: { "supabaseUserId": "clerkUserId" } }
)
```

**Backward Compatibility:**
- Old profiles have `clerkUserId: null` until first Clerk login
- Email matching links old profiles to new Clerk accounts
- No data loss during migration

## Troubleshooting

### User can't access dashboard

**Symptoms:** User signed in but redirected to home page

**Checklist:**
1. Verify profile exists in MongoDB
2. Check `clerkUserId` field is populated
3. Confirm email matches between Clerk and MongoDB
4. Check Clerk session in browser cookies

### Profile linking fails

**Symptoms:** Profile exists but `clerkUserId` stays null

**Solution:**
```typescript
// Manually link in MongoDB shell
db.profiles.updateOne(
  { lumaEmail: "user@example.com" },
  { $set: { clerkUserId: "user_xxxxx" } }
)
```

### GitHub OAuth not working

**Checklist:**
1. Verify GitHub OAuth is enabled in Clerk dashboard
2. Check redirect URLs are configured correctly
3. Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set
4. Clear browser cookies and try again

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [React Router 7 + Clerk Guide](https://clerk.com/docs/references/react-router)
- [GitHub OAuth Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)
- [MongoDB Profile Schema](./DATABASE.md#profiles)
