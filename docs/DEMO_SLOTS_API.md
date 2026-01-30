# Demo Slots API Documentation

This document describes the demo slots API endpoints for managing demo presentations at hack nights.

## Overview

The demo slots system allows community members to schedule demo presentations at hack night events. Members can create, update, and delete their demo slot bookings. Organizers (app admins) can update and confirm any demo slot.

## API Endpoints

### GET `/api/demo-slots`

Fetch demo slots with optional filters.

#### Request Format

**Method:** `GET`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | string | No | Filter by event MongoDB ObjectId |
| `memberId` | string | No | Filter by member MongoDB ObjectId |
| `status` | string | No | Filter by status: 'pending', 'confirmed', or 'canceled' |

#### Examples

```javascript
// Get all demo slots for an event (with member info populated)
const response = await fetch('/api/demo-slots?eventId=507f1f77bcf86cd799439011');

// Get all demo slots for a member
const response = await fetch('/api/demo-slots?memberId=507f1f77bcf86cd799439012');

// Get all confirmed demo slots
const response = await fetch('/api/demo-slots?status=confirmed');
```

#### Success Response (200)

```json
{
  "demoSlots": [
    {
      "id": "507f1f77bcf86cd799439013",
      "eventId": "507f1f77bcf86cd799439011",
      "title": "Building a Real-Time Chat App with WebSockets",
      "description": "Demo of a chat application with live updates",
      "requestedTime": "8:30 PM",
      "durationMinutes": 5,
      "status": "confirmed",
      "confirmedByOrganizer": true,
      "createdAt": "2026-01-30T12:00:00.000Z",
      "updatedAt": "2026-01-30T12:30:00.000Z",
      "member": {
        "id": "507f1f77bcf86cd799439012",
        "lumaEmail": "builder@example.com",
        "githubUsername": "coolbuilder"
      }
    }
  ]
}
```

---

### POST `/api/demo-slots`

Create a new demo slot booking.

#### Request Format

**Method:** `POST`

**Content-Type:** `application/x-www-form-urlencoded` (via FormData)

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `supabaseUserId` | string | Yes | Supabase user ID of the member |
| `eventId` | string | Yes | MongoDB ObjectId of the event |
| `title` | string | Yes | Demo title/topic |
| `description` | string | No | Demo description (can be empty or null) |
| `requestedTime` | string | No | Preferred time slot (e.g., "8:30 PM") |
| `durationMinutes` | string | No | Duration in minutes (default: 5) |

#### Example Request

```javascript
const formData = new FormData();
formData.append('supabaseUserId', 'user-123-abc');
formData.append('eventId', '507f1f77bcf86cd799439011');
formData.append('title', 'Building a Real-Time Chat App');
formData.append('description', 'Demo of a chat application with live updates');
formData.append('requestedTime', '8:30 PM');
formData.append('durationMinutes', '5');

const response = await fetch('/api/demo-slots', {
    method: 'POST',
    body: formData
});
```

#### Success Response (200)

```json
{
  "success": true,
  "demoSlot": {
    "id": "507f1f77bcf86cd799439013",
    "memberId": "507f1f77bcf86cd799439012",
    "eventId": "507f1f77bcf86cd799439011",
    "title": "Building a Real-Time Chat App",
    "description": "Demo of a chat application with live updates",
    "requestedTime": "8:30 PM",
    "durationMinutes": 5,
    "status": "pending",
    "confirmedByOrganizer": false,
    "createdAt": "2026-01-30T12:00:00.000Z",
    "updatedAt": "2026-01-30T12:00:00.000Z"
  }
}
```

#### Error Responses

**400 - Missing Required Fields**
```json
{ "error": "Missing required fields" }
```

**400 - Invalid Event ID**
```json
{ "error": "Invalid event ID" }
```

**404 - Profile Not Found**
```json
{ "error": "Profile not found" }
```

---

### PUT `/api/demo-slots`

Update an existing demo slot.

**Authorization:** Only the slot owner or app admins can update a demo slot.

#### Request Format

**Method:** `PUT`

**Content-Type:** `application/x-www-form-urlencoded` (via FormData)

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `demoSlotId` | string | Yes | MongoDB ObjectId of the demo slot |
| `supabaseUserId` | string | Yes | Supabase user ID of the requesting user |
| `title` | string | No | Updated demo title |
| `description` | string | No | Updated demo description |
| `requestedTime` | string | No | Updated time preference |
| `durationMinutes` | string | No | Updated duration in minutes |
| `status` | string | No | Updated status: 'pending', 'confirmed', 'canceled' |
| `confirmedByOrganizer` | string | No | 'true' or 'false' (admin only) |

#### Example Request

```javascript
const formData = new FormData();
formData.append('demoSlotId', '507f1f77bcf86cd799439013');
formData.append('supabaseUserId', 'user-123-abc');
formData.append('title', 'Building a Real-Time Chat App with WebSockets');
formData.append('description', 'Updated description with more details');
formData.append('status', 'confirmed');
formData.append('confirmedByOrganizer', 'true');

const response = await fetch('/api/demo-slots', {
    method: 'PUT',
    body: formData
});
```

#### Success Response (200)

```json
{
  "success": true,
  "demoSlot": {
    "id": "507f1f77bcf86cd799439013",
    "memberId": "507f1f77bcf86cd799439012",
    "eventId": "507f1f77bcf86cd799439011",
    "title": "Building a Real-Time Chat App with WebSockets",
    "description": "Updated description with more details",
    "requestedTime": "8:30 PM",
    "durationMinutes": 5,
    "status": "confirmed",
    "confirmedByOrganizer": true,
    "createdAt": "2026-01-30T12:00:00.000Z",
    "updatedAt": "2026-01-30T12:30:00.000Z"
  }
}
```

#### Error Responses

**400 - Missing Required Fields**
```json
{ "error": "Missing required fields" }
```

**400 - Invalid Demo Slot ID**
```json
{ "error": "Invalid demo slot ID" }
```

**403 - Unauthorized**
```json
{ "error": "Unauthorized" }
```

**404 - Demo Slot Not Found**
```json
{ "error": "Demo slot not found" }
```

**404 - Profile Not Found**
```json
{ "error": "Profile not found" }
```

---

### DELETE `/api/demo-slots`

Delete a demo slot.

**Authorization:** Only the slot owner or app admins can delete a demo slot.

#### Request Format

**Method:** `DELETE`

**Content-Type:** `application/x-www-form-urlencoded` (via FormData)

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `demoSlotId` | string | Yes | MongoDB ObjectId of the demo slot |
| `supabaseUserId` | string | Yes | Supabase user ID of the requesting user |

#### Example Request

```javascript
const formData = new FormData();
formData.append('demoSlotId', '507f1f77bcf86cd799439013');
formData.append('supabaseUserId', 'user-123-abc');

const response = await fetch('/api/demo-slots', {
    method: 'DELETE',
    body: formData
});
```

#### Success Response (200)

```json
{
  "success": true
}
```

#### Error Responses

**400 - Missing Required Fields**
```json
{ "error": "Missing required fields" }
```

**400 - Invalid Demo Slot ID**
```json
{ "error": "Invalid demo slot ID" }
```

**403 - Unauthorized**
```json
{ "error": "Unauthorized" }
```

**404 - Demo Slot Not Found**
```json
{ "error": "Demo slot not found" }
```

**404 - Profile Not Found**
```json
{ "error": "Profile not found" }
```

---

## Authorization Rules

1. **Create:** Any authenticated member can create a demo slot for themselves
2. **Update:** 
   - Slot owner can update their own slot
   - App admins can update any slot (including `confirmedByOrganizer` field)
3. **Delete:**
   - Slot owner can delete their own slot
   - App admins can delete any slot
4. **Read:** Public access (no authentication required)

## Data Types

### DemoSlot

```typescript
interface DemoSlot {
  _id: ObjectId;
  memberId: ObjectId;        // Reference to Profile._id
  eventId: ObjectId;         // Reference to Event._id
  title: string;
  description: string | null;
  requestedTime: string | null;
  durationMinutes: number;   // Default: 5
  status: 'pending' | 'confirmed' | 'canceled';
  confirmedByOrganizer: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### DemoSlotWithMember

Used in GET responses when `eventId` is provided:

```typescript
interface DemoSlotWithMember {
  // All DemoSlot fields except memberId
  member: {
    _id: ObjectId;
    lumaEmail: string;
    githubUsername: string | null;
  };
}
```

## Usage Examples

### Typical User Flow

1. **Member books a demo:**
   ```javascript
   // User selects an event and fills out demo details
   const formData = new FormData();
   formData.append('supabaseUserId', user.id);
   formData.append('eventId', selectedEvent.id);
   formData.append('title', 'My Awesome Project');
   formData.append('description', 'A demo of my project');
   
   await fetch('/api/demo-slots', { method: 'POST', body: formData });
   ```

2. **Member updates their demo:**
   ```javascript
   // User edits their demo details
   const formData = new FormData();
   formData.append('demoSlotId', demoSlot.id);
   formData.append('supabaseUserId', user.id);
   formData.append('description', 'Updated description');
   
   await fetch('/api/demo-slots', { method: 'PUT', body: formData });
   ```

3. **Organizer confirms demo:**
   ```javascript
   // Admin confirms the demo slot
   const formData = new FormData();
   formData.append('demoSlotId', demoSlot.id);
   formData.append('supabaseUserId', admin.id);
   formData.append('confirmedByOrganizer', 'true');
   formData.append('status', 'confirmed');
   
   await fetch('/api/demo-slots', { method: 'PUT', body: formData });
   ```

4. **Member cancels their demo:**
   ```javascript
   // User deletes their demo slot
   const formData = new FormData();
   formData.append('demoSlotId', demoSlot.id);
   formData.append('supabaseUserId', user.id);
   
   await fetch('/api/demo-slots', { method: 'DELETE', body: formData });
   ```

## Related Documentation

- [Database Schema](./DATABASE.md) - MongoDB collections and types
- [Event Sync](./EVENT_SYNC.md) - How events are synced from Luma
- [PRD](./PRD.md) - Product requirements and feature specifications
