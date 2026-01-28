# Implementation Tasks Checklist

This checklist breaks down the Luma Webhook + Email OTP Authentication feature into individual tasks for iterative execution.

## Database Schema Changes

- [ ] Create `pending_users` collection schema
- [ ] Create `luma_webhooks` collection for raw webhook storage
- [ ] Update `Profile` type: remove `githubUid`, add `verificationStatus: 'pending' | 'verified'`
- [ ] Add `lumaEmail` field to Profile (email used in Luma registration)

## Webhook Endpoint

- [ ] Create `app/routes/api/webhooks/luma.tsx` with action handler
- [ ] Implement webhook signature verification (if Luma provides it)
- [ ] Store ALL webhooks in `luma_webhooks` collection
- [ ] Handle `calendar.person.subscribed` → create pending user
- [ ] Handle `guest.updated` → check for approval status change, promote user

## Auth Flow Updates

- [ ] Replace `use-auth.tsx` to use email OTP instead of GitHub
- [ ] Add `signInWithEmail(email)` → sends OTP
- [ ] Add `verifyOtp(email, token)` → verifies and creates session
- [ ] Update login UI components for email input + OTP entry

## Server-Side Auth Utilities

- [ ] Create `app/lib/db/pending-users.server.ts`
- [ ] Update `app/lib/db/profiles.server.ts` for new flow
- [ ] Add email lookup functions

## API Routes

- [ ] Create login route that checks user exists before sending OTP
- [ ] Create route to handle OTP verification and profile creation
