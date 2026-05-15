# Lead Pipeline Playbook
**Internal CX Reference — Zuper Roofing Vertical**

---

> ⏱ **Speed to Lead SLA: 5 minutes**
> New Lead → Call In Progress must happen within 5 minutes of job creation.

---

## Lead Sources

| Source | Description |
|---|---|
| **Booking Widget** | Embedded on website or URL-redirected from ad campaigns. Lead source attributed via `?lead_source=` query param. One widget mode is configured per account — the steps a customer sees depend on the mode. |
| **Zuper Connect** | Handles all inbound calls. Attribution configured per number. AI Responder collects data; post-call webhook fires to n8n to auto-fill checklist. |
| **Roofle** | Third-party lead source integrated into the pipeline. |

> **Note on booking widget modes:** Each account has exactly one widget mode. Accounts on Full Booking modes (Slot Only or Slot + Tech) bypass the Lead Qualification pipeline entirely — those accounts have no qualification process and website leads go directly to service delivery. The lead pipeline described in this document applies to accounts using the **Lead Qualification Widget** and **Zuper Connect** as their lead sources.

---

## Booking Widget — Lead Qualification Widget Steps

Applies only to accounts configured in **Lead Qualification Widget** mode.

1. **Address entry** — Territory check behaviour is account-specific. If the `enforce_territory` flag is enabled and no match is found: 🚫 Hard stop. If disabled, flow continues regardless.
2. **Data collection form** — Name, Email, Phone (all mandatory), Reason for contact (becomes job description), Preferred date (MM/DD/YYYY)
3. **Confirm** — Summary screen, SMS consent checkbox is mandatory. Submission blocked if not accepted.

---

## Zuper Connect — Call Intake

1. AI Responder picks up inbound call
2. Contact auto-created with mobile number as name *(temporary — pending AI data collection during call)*
3. Lead Qualification job auto-created for the contact
4. AI Responder collects checklist responses via voice
5. Post-call webhook fires to n8n → checklist auto-filled
6. If all contact details available → automation marks lead as **Qualified**

---

## Contact & Job Creation

> On entry through any channel, a new contact and a Lead Qualification job are created.
>
> The **"Lead" custom field** on the customer record determines behaviour for returning customers. This field is flipped to **No** by the qualification automation when a CSR marks the checklist as a genuine lead.

| Customer State | "Lead" Custom Field | Action |
|---|---|---|
| New customer | Not set | New contact + Lead Qualification job created |
| Existing, not yet qualified | Yes | New Lead Qualification job created regardless of existing unqualified ones |
| Existing, qualified | No | Inspection job created instead |

### Due Date Logic

| Submission time | Due date |
|---|---|
| Monday – Friday, during business hours | Today |
| Monday – Thursday, after hours | Tomorrow |
| Friday after hours | Next Monday |
| Saturday or Sunday | Next Monday |

---

## Speed to Lead — SLA

> **5-minute window:** Job must transition from **New Lead → Call In Progress** within 5 minutes.
>
> **If exceeded:** Native Zuper overdue indicator appears on the job. Notification fires to the configured user.

### ⚠️ Manual config required

The job delay alert is pre-configured in the account with the following settings:

| Field | Value |
|---|---|
| Alert name | Flag job delayed – SLA 5min |
| Notification type | Push |
| Delay alert type | Based on Status |
| Job category | Lead Qualification |
| From job status | New Lead |
| To job status | Call In Progress |
| Alert if delayed by | 5 minutes |
| Send reminder to | Selected Users (default Zuper user) |
| Flag job as delayed? | Yes |
| Alert template | `Job {{work_order_number}} is delayed` |

To change the SLA value or notification recipient: **Settings → Job Module → Notifications → Job Delay Notifications**

---

## Qualification Process

1. **Status change** — CSR changes job status to **Call In Progress**
2. **Checklist** — Qualification playbook opened and completed by CSR
3. **Key gate** — *"Is this a genuine lead?"*
    - ✅ **Yes** → Lead Qualified. Qualification automation flips the "Lead" custom field to **No** on the customer record.
    - 📵 **No answer** → Re-attempt logic triggered
4. **Re-attempt process** — 5 attempts by default, customizable per account. Managed by workflow: **Lead Qualification Job Reschedule Based on Attempt Status**. To modify, update the config node inside that workflow.

| Attempt | Type | Schedule |
|---|---|---|
| Attempt 1 | Relative | +2 hours from now |
| Attempt 2 | Relative | +4 hours from now |
| Attempt 3 | Fixed | Next day, 9AM – 11AM |
| Attempt 4 | Fixed | Day 2, 4PM – 6PM |
| Attempt 5 | Fixed | Day 4, 9AM – 11AM |

5. **Terminal state** — After 5 failed attempts → 🗃 **Lead Archived**

---

## Manual Setup Tasks

### 📞 Zuper Connect

| # | Task | Owner |
|---|---|---|
| 1 | Enable and set up Zuper Connect | Implementation team |
| 2 | 10DLC approval | AI POD |
| 3 | Set up AI Responder | Implementation team |
| 4 | Auto-fill checklist n8n workflow | Product — loop in AI POD |

### 🖥 Booking Widget

| # | Task | Owner |
|---|---|---|
| 1 | Create and configure booking widget (one-time setup during onboarding) | Implementation team |

### 🔔 SLA Notification

| # | Task | Notes |
|---|---|---|
| 1 | Update SLA value or notification recipient if needed | Settings → Job Module → Notifications → Job Delay Notifications |

### 🔁 Re-attempt Logic

| # | Task | Notes |
|---|---|---|
| 1 | Adjust attempt count or schedule per account if needed | Workflow: *Lead Qualification Job Reschedule Based on Attempt Status* → config node |

---

*Zuper Roofing Vertical — Internal CX use only*
