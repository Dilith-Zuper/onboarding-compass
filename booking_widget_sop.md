# Booking Widget — Modes & Configuration SOP
**Internal CX / Implementation Reference — Zuper Roofing Vertical**

---

## Overview

The booking widget is a multi-step, config-driven form embedded per account. Each account is configured with exactly one widget mode depending on how they handle lead qualification and scheduling. The mode controls which steps the customer sees and how jobs are created in Zuper.

> **Address step works for US addresses only.** Google Places autocomplete will not surface non-US addresses.

---

## Widget Modes

| Mode | Steps | Use Case |
|---|---|---|
| **Lead Qualification Widget** | Address → Contact → Confirm | Lead capture only. No service selection or scheduling. Qualification happens in Zuper via CSR. |
| **Full Booking — Slot Only** | Address → Contact → Service → Schedule → Confirm | Real-time scheduling with service selection, no tech assignment. No qualification process — website leads go directly to service delivery. |
| **Full Booking — Slot + Tech** | Address → Contact → Service → Schedule → Tech → Confirm | Real-time scheduling with service selection and technician assignment. No qualification process. |
| **Customer Only** | Contact → Confirm | Contact capture only, no job created. Edge case — lead qualification handled externally (e.g. HubSpot). |

> **Full Booking modes bypass the Lead Qualification pipeline entirely.** Accounts using Full Booking either have no qualification process or consider website leads pre-qualified. Jobs created via Full Booking go directly to service delivery and do not enter the 5-min SLA queue.

---

## Step-by-Step Breakdown

### Address
- Google Places autocomplete (US addresses only)
- Captures: full address, street, city, state, zip, latitude, longitude
- Territory enforcement is account-specific — see Territory Matching section

### Contact
Name, email, and phone are mandatory. All other fields depend on mode.

| Field | Type | Modes | Notes |
|---|---|---|---|
| Full name | Text | All | Mandatory |
| Email | Text | All | Mandatory |
| Phone number | Text | All | Mandatory |
| Reason for contact | Multi-line text | All | Becomes the job description in Zuper |
| Preferred date | Date picker | Lead Qualification Widget only | Format MM/DD/YYYY |

### SMS Consent
- Mandatory checkbox — submission is blocked if not accepted
- Displays company name, Terms of Service link, and Privacy Policy link
- ToS URL and Privacy Policy URL must be collected from the customer during onboarding

### Service Selection
- Shown in Full Booking modes only
- Lists active services configured for the account
- Each service maps to a Zuper job category UID used in job creation

### Schedule
- Shown in Full Booking modes only
- Fetches real-time availability from Zuper
- User picks a date then selects an available time slot
- **If no slots are available:** job is created with New Lead status and enters the standard CSR queue. Due date follows the standard logic below.

### Technician Selection
- Shown in Full Booking — Slot + Tech only
- Enabled or disabled by implementation team in widget settings
- If no slots are available and scheduling is skipped, no tech is assigned

### Confirm
- Summary of all collected data
- User submits — triggers customer and job creation in Zuper
- Shows success or error state after submission

---

## Territory Matching

Controlled by the `enforce_territory` flag, set per account in widget settings.

| Flag | Behaviour |
|---|---|
| **Enabled** | Address must match a Zuper territory. If no match found — 🚫 Hard stop, user cannot proceed. |
| **Disabled** | Territory check skipped. Flow continues regardless of address. |

---

## Job Creation Behaviour

### Due Date Logic (applies to all modes)

| Submission time | Due date |
|---|---|
| Monday – Friday, during business hours | Today |
| Monday – Thursday, after hours | Tomorrow |
| Friday after hours | Next Monday |
| Saturday or Sunday | Next Monday |

---

### Lead Qualification Widget

> Existing customer behaviour is determined by the **"Lead" custom field** on the customer record in Zuper. This field is flipped to **No** by the qualification automation when a CSR marks the lead checklist as genuine.

| Customer State | "Lead" Custom Field | Action |
|---|---|---|
| New customer | Not set | New contact + Lead Qualification job created |
| Existing, not yet qualified | Yes | New Lead Qualification job created (regardless of existing unqualified ones) |
| Existing, qualified | No | Inspection job created instead |

| Job Field | Value |
|---|---|
| Job title | Lead intake for {Name} |
| Job category | Account's lead job category UID |
| Job description | Reason for contact (from Contact step) |
| Scheduling | None |
| Assignment | Not set |
| Due date | Preferred date if provided — otherwise follows due date logic above |

---

### Full Booking — Slot Only

| Scenario | Scheduling | Assignment | Due Date |
|---|---|---|---|
| Slot selected | Scheduled start + end from slot | Empty — unassigned | From slot |
| No slots available | None | Not set | Due date logic above |

| Job Field | Value |
|---|---|
| Job title | {Service} for {Name} |
| Job category | From selected service |
| Job description | Reason for contact (from Contact step) |

---

### Full Booking — Slot + Tech

| Scenario | Scheduling | Assignment | Due Date |
|---|---|---|---|
| Slot + tech selected | Scheduled start + end from slot | Assigned technician | From slot |
| No slots available | None | Not set | Due date logic above |

| Job Field | Value |
|---|---|
| Job title | {Service} for {Name} |
| Job category | From selected service |
| Job description | Reason for contact (from Contact step) |

> **Note:** When no slots are available in either Full Booking mode, the job is created with New Lead status and enters the standard CSR queue with the 5-min SLA.

---

### Customer Only

No job is created. A customer record is created in Zuper only. Edge case — only used when lead qualification happens entirely outside Zuper.

---

## Implementation Setup Checklist

### What to collect from the customer

| # | Item | Required For |
|---|---|---|
| 1 | Which widget mode they want | All |
| 2 | Brand hex colour (e.g. `#2563eb`) | All |
| 3 | Company name | All |
| 4 | Website URL | All |
| 5 | Terms of Service URL | All |
| 6 | Privacy Policy URL | All |
| 7 | Services list (display name per service) | Full Booking modes only |
| 8 | Whether to enforce territory matching | All |
| 9 | Tech selection on or off | Full Booking — Slot + Tech only |

### What the implementation team configures in widget settings

| # | Setting | Notes |
|---|---|---|
| 1 | Widget mode | One of the four modes above |
| 2 | Brand colour | Applied as CSS variable across buttons and accents |
| 3 | Company name | Displayed in widget header and SMS consent text |
| 4 | ToS URL + Privacy Policy URL | Linked in SMS consent checkbox |
| 5 | Services (display name + Zuper job category UID) | Full Booking modes only |
| 6 | Territory enforcement flag | Per account |
| 7 | Technician selection toggle | Full Booking — Slot + Tech only |
| 8 | Lead job category UID | Lead Qualification Widget only — must map to correct Zuper job category. Misconfiguration will cause job creation to fail. |

> Raise a task to the implementation team for widget setup. This is a one-time task during onboarding. Include customer website URL, ToS URL, and Privacy Policy URL in the task.

---

*Zuper Roofing Vertical — Internal CX use only*
