import { QUESTIONS } from '@/lib/questions';
import { CONFIG_MATRIX } from '@/lib/configMatrix';

// ── Customer invite / session link email ─────────────────────────────────────

export function buildInviteEmail({
  orgName,
  wizardLink,
  saEmail,
}: {
  orgName: string;
  wizardLink: string;
  saEmail: string;
}) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:48px auto;padding:0 16px;">
  <div style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:24px 32px;">
    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F97316;">Zuper Onboarding</p>
    <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#FFFFFF;">Your Zuper setup is ready to begin</p>
  </div>
  <div style="background:#FFFFFF;border:1px solid #E5E2DC;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
    <p style="margin:0 0 16px;font-size:14px;color:#6B7280;line-height:1.6;">
      Hi there,<br/><br/>
      Your <strong style="color:#1A1A1A;">${orgName}</strong> Zuper account is being set up. Before we configure everything, we need about 10 minutes of your time to understand how your business works.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">
      Click the button below to walk through a quick questionnaire. You will see your personalised Zuper workflow, review your account configuration, and request any changes — all before go-live.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${wizardLink}" style="display:inline-block;background:#F97316;color:#FFFFFF;font-size:15px;font-weight:700;padding:16px 36px;border-radius:9999px;text-decoration:none;">
        Start my onboarding →
      </a>
    </div>
    <div style="background:#FAF9F7;border:1px solid #E5E2DC;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#9CA3AF;">Or copy this link</p>
      <p style="margin:0;font-size:12px;color:#6B7280;word-break:break-all;">${wizardLink}</p>
    </div>
    <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.5;">
      This link is unique to your account. Do not share it.<br/>
      Questions? Contact your SA at <a href="mailto:${saEmail}" style="color:#F97316;">${saEmail}</a>
    </p>
  </div>
  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:20px;">
    Zuper Onboarding Compass
  </p>
</div>
</body>
</html>`;

  return {
    subject: `Your Zuper onboarding link — ${orgName}`,
    html,
  };
}

// ── SA notification email ────────────────────────────────────────────────────

export function buildSAEmail({
  orgName,
  customerName,
  customerEmail,
  saEmail,
  answers,
  changeRequests,
  sessionId,
  appUrl,
}: {
  orgName: string;
  customerName: string;
  customerEmail: string;
  saEmail: string;
  answers: Record<string, any>;
  changeRequests: Record<string, string>;
  sessionId: string;
  appUrl: string;
}) {
  const answeredQA = QUESTIONS
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
    .map((q) => {
      const raw = answers[q.id];
      let display: string;
      if (Array.isArray(raw)) {
        const labels = (q.options ?? []).reduce<Record<string, string>>((acc, o) => { acc[o.value] = o.label; return acc; }, {});
        display = raw.map((v) => labels[v] || v).join(', ');
      } else if (q.options) {
        display = q.options.find((o) => o.value === raw)?.label || raw;
      } else {
        display = String(raw);
      }
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #E5E2DC;font-size:13px;color:#6B7280;">${q.text}</td><td style="padding:8px 12px;border-bottom:1px solid #E5E2DC;font-size:13px;color:#1A1A1A;font-weight:600;">${display}</td></tr>`;
    }).join('');

  const changeRows = CONFIG_MATRIX
    .filter((m) => changeRequests[m.module]?.trim())
    .map((m) => `
      <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
        <p style="margin:0 0 4px 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B45309;">${m.label}</p>
        <p style="margin:0;font-size:13px;color:#1A1A1A;">${changeRequests[m.module]}</p>
      </div>`).join('');

  const proposalUpload = answers['proposal_sample_upload'];
  const proposalBlock = proposalUpload?.url
    ? `
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Proposal template</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px 16px;margin-bottom:28px;">
      <a href="${proposalUpload.url}" style="font-size:13px;color:#15803D;font-weight:600;text-decoration:underline;">${proposalUpload.fileName || 'Download uploaded template'} →</a>
    </div>`
    : '';

  const adminLink = `${appUrl}/admin/session/${sessionId}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:40px auto;padding:0 16px;">

  <!-- Header -->
  <div style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:24px 32px;">
    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F97316;">Onboarding Compass</p>
    <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#FFFFFF;">${orgName} has submitted</p>
  </div>

  <!-- Body -->
  <div style="background:#FFFFFF;border:1px solid #E5E2DC;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Customer</p>
    <p style="margin:0 0 8px;font-size:15px;color:#1A1A1A;">${customerName} &lt;${customerEmail}&gt;</p>
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">SA / BA</p>
    <p style="margin:0 0 24px;font-size:15px;color:#1A1A1A;">${saEmail || 'unassigned'}</p>

    <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#9A3412;">
        <strong>PDF attached.</strong> Full onboarding report — flow chart, every answer, live account snapshot, renames, and change requests.
      </p>
    </div>

    <!-- Answers -->
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Discovery answers</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #E5E2DC;border-radius:8px;overflow:hidden;">
      ${answeredQA}
    </table>

    <!-- Change requests -->
    ${changeRows ? `
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Change requests</p>
    ${changeRows}
    <div style="margin-bottom:28px;"></div>` : ''}

    <!-- Proposal template -->
    ${proposalBlock}

    <!-- CTA -->
    <a href="${adminLink}" style="display:inline-block;background:#F97316;color:#FFFFFF;font-size:14px;font-weight:700;padding:14px 28px;border-radius:9999px;text-decoration:none;">
      View session in admin →
    </a>
  </div>

  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:24px;">
    Zuper Onboarding Compass · <a href="mailto:onboarding@zuper.co" style="color:#F97316;">onboarding@zuper.co</a>
  </p>
</div>
</body>
</html>`;

  return {
    subject: `[Compass] ${orgName} has completed their onboarding questionnaire`,
    html,
  };
}

// ── Customer confirmation email ──────────────────────────────────────────────

export function buildCustomerEmail({
  orgName,
  customerName,
  saEmail,
  changeRequests,
}: {
  orgName: string;
  customerName: string;
  saEmail: string;
  changeRequests: Record<string, string>;
}) {
  const requestSummary = CONFIG_MATRIX
    .filter((m) => changeRequests[m.module]?.trim())
    .map((m) => `<li style="margin-bottom:6px;font-size:13px;color:#1A1A1A;"><strong>${m.label}:</strong> ${changeRequests[m.module]}</li>`)
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#FAF9F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:600px;margin:40px auto;padding:0 16px;">

  <div style="background:#1A1A1A;border-radius:12px 12px 0 0;padding:24px 32px;">
    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#F97316;">Onboarding Compass</p>
    <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#FFFFFF;">Your Zuper setup is being prepared</p>
  </div>

  <div style="background:#FFFFFF;border:1px solid #E5E2DC;border-top:none;border-radius:0 0 12px 12px;padding:32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#1A1A1A;">Hi ${customerName},</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;line-height:1.6;">
      We've received your onboarding questionnaire for <strong>${orgName}</strong>. Your SA will review your responses and configure your account before go-live.
    </p>

    ${requestSummary ? `
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">Your change requests</p>
    <ul style="margin:0 0 28px;padding-left:18px;">${requestSummary}</ul>` : ''}

    <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9CA3AF;">What happens next</p>
    <div style="background:#FAF9F7;border-radius:8px;padding:16px;margin-bottom:28px;">
      <p style="margin:0 0 10px;font-size:13px;color:#1A1A1A;">1. Your SA (${saEmail}) reviews your setup</p>
      <p style="margin:0 0 10px;font-size:13px;color:#1A1A1A;">2. Your account is configured to spec</p>
      <p style="margin:0;font-size:13px;color:#1A1A1A;">3. Go-live walkthrough call scheduled</p>
    </div>

    <p style="margin:0;font-size:13px;color:#6B7280;">
      Questions? Reply to this email or contact <a href="mailto:onboarding@zuper.co" style="color:#F97316;">onboarding@zuper.co</a>
    </p>
  </div>

  <p style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:24px;">
    Zuper Onboarding Compass
  </p>
</div>
</body>
</html>`;

  return {
    subject: `Your Zuper setup is being prepared, ${customerName}`,
    html,
  };
}
