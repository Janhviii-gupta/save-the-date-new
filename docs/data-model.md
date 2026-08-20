# DATA MODEL

## Project: Janhvi × Krish Interactive Save-the-Date

### Data Architecture v2.0

---

# 1. PURPOSE

This database supports the Interactive Save-the-Date experience for:

**Janhvi × Krish**

**19–20 November 2026 · Jaipur**

The Save-the-Date has one primary purpose:

1. Identify which invited individual has opened their invitation.
2. Track their interaction with the experience.
3. Record their RSVP.
4. Allow the same individual to return later through their unique link.
5. Preserve RSVP history.

This system is NOT the complete wedding guest-management system.

The detailed wedding guest-management system will be built separately for the actual wedding invitation.

---

# 2. CORE PRINCIPLES

## Individual identity

Every invited individual is represented separately.

Example:

- Rahul Sharma
- Priya Sharma
- Rohan Sharma

Each is an independent invited guest.

---

## Unique invitation

Every invited individual receives exactly one unique invitation link.

Example:

`https://domain.com/i/8Kf92xLm`

The token must be:

- random
- unguessable
- unique
- persistent

The URL must not expose:

- guest name
- phone number
- email
- household
- family information

---

## Household information

Household/group information is stored internally for the hosts.

Guests must never be shown:

- their household/group
- other invited people
- who else has received an invitation
- who else has responded

Household information is administrative metadata only.

---

# 3. RSVP MODEL

The Save-the-Date records only the invited individual's own response.

Allowed responses:

- `yes`
- `maybe`
- `no`

There is exactly one current RSVP per invitation.

The current RSVP can change later.

Example:

```text
20 Aug → MAYBE
28 Aug → YES