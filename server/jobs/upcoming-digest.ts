/**
 * Upcoming-Work Digest Job (JIE State University Tutor — Student SRM)
 * -----------------------------------------------------
 * Sends opt-in reminder emails summarizing upcoming assignments / tests /
 * quizzes for a college student over a configurable horizon (default 7 days).
 *
 * Design principles:
 *  - OFF BY DEFAULT. Nothing is sent unless a user flips the toggle ON.
 *  - Quiet when nothing is due (no emails when the upcoming list is empty).
 *  - At-risk alerts are a SEPARATE opt-in, rate-limited to once per 48h.
 *  - One-click unsubscribe via token link in every email footer.
 *
 * Scheduling:
 *  - In-process node-cron runs hourly ("0 * * * *") and fires out digests to
 *    any subscription whose local hour_local == current local hour and
 *    (frequency='daily' OR (frequency='weekly' AND day_of_week matches)).
 *  - Cron endpoint /api/cron/upcoming-digest is also provided for external
 *    triggers (Railway/autoscale safety).
 */

import cron from 'node-cron';
import { pool } from '../db';
import { EmailService } from '../services/email-service';

const HOURLY_CRON = '0 * * * *';
const emailService = new EmailService();

interface PrefRow {
  id: string;
  user_id: string;
  child_id: string | null; // always null on UW
  recipient_email: string;
  recipient_name: string | null;
  recipient_role: 'self' | 'parent' | 'admin';
  frequency: 'off' | 'daily' | 'weekly';
  horizon_days: number;
  day_of_week: number;
  hour_local: number;
  timezone: string;
  at_risk_alerts: boolean;
  is_active: boolean;
  last_sent_at: Date | null;
  last_at_risk_sent_at: Date | null;
  unsubscribe_token: string;
}

interface UpcomingItem {
  kind: 'event' | 'task';
  title: string;
  courseName: string | null;
  type: string | null;
  dueDate: string;
  priority: string | null;
  status: string | null;
}

interface StudentMini {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Local-hour helpers
// ---------------------------------------------------------------------------
function currentHourInTimezone(tz: string): { hour: number; dow: number; date: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  const hour = parseInt(get('hour'), 10) % 24;
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dow = weekdayMap[get('weekday')] ?? 0;
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  return { hour, dow, date };
}

// ---------------------------------------------------------------------------
// Data loaders
// ---------------------------------------------------------------------------
async function loadActivePrefs(): Promise<PrefRow[]> {
  const result = await pool.query<PrefRow>(
    `SELECT id, user_id, child_id, recipient_email, recipient_name, recipient_role,
            frequency, horizon_days, day_of_week, hour_local, timezone,
            at_risk_alerts, is_active, last_sent_at, last_at_risk_sent_at,
            unsubscribe_token
       FROM notification_preferences
      WHERE is_active = true
        AND frequency <> 'off'`
  );
  return result.rows;
}

async function loadStudent(userId: string): Promise<StudentMini | null> {
  const { rows } = await pool.query(
    `SELECT id, COALESCE(student_name, first_name, username) AS name
       FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  if (!rows[0]) return null;
  return { id: rows[0].id, name: rows[0].name || 'your student' };
}

async function loadUpcomingItems(
  userId: string,
  horizonDays: number,
  today: string
): Promise<UpcomingItem[]> {
  const horizonEnd = new Date(today);
  horizonEnd.setDate(horizonEnd.getDate() + horizonDays);
  const horizonEndStr = horizonEnd.toISOString().slice(0, 10);

  const eventsRes = await pool.query(
    `SELECT e.title, e.event_type AS type, e.start_date::text AS due_date,
            e.priority, e.status, c.course_name AS course_name
       FROM student_calendar_events e
       LEFT JOIN student_courses c ON c.id = e.course_id
      WHERE e.user_id = $1
        AND e.start_date >= $2::date
        AND e.start_date <= $3::date
        AND (e.status IS NULL OR e.status <> 'completed')
      ORDER BY e.start_date ASC`,
    [userId, today, horizonEndStr]
  );

  const tasksRes = await pool.query(
    `SELECT t.title, t.task_type AS type, t.due_date::text AS due_date,
            t.priority, t.status, c.course_name AS course_name
       FROM student_tasks t
       LEFT JOIN student_courses c ON c.id = t.course_id
      WHERE t.user_id = $1
        AND t.due_date IS NOT NULL
        AND t.due_date >= $2::date
        AND t.due_date <= $3::date
        AND (t.status IS NULL OR t.status NOT IN ('completed','skipped'))
      ORDER BY t.due_date ASC`,
    [userId, today, horizonEndStr]
  );

  const items: UpcomingItem[] = [
    ...eventsRes.rows.map((r: any) => ({
      kind: 'event' as const,
      title: r.title,
      courseName: r.course_name,
      type: r.type,
      dueDate: r.due_date,
      priority: r.priority,
      status: r.status,
    })),
    ...tasksRes.rows.map((r: any) => ({
      kind: 'task' as const,
      title: r.title,
      courseName: r.course_name,
      type: r.type,
      dueDate: r.due_date,
      priority: r.priority,
      status: r.status,
    })),
  ];

  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return items;
}

async function loadAtRiskSignals(
  userId: string,
  today: string
): Promise<{ atRisk: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  const { rows: overdueRows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM student_tasks
      WHERE user_id = $1 AND due_date IS NOT NULL AND due_date < $2::date
        AND (status IS NULL OR status NOT IN ('completed','skipped'))`,
    [userId, today]
  );
  const overdueCount = overdueRows[0]?.n || 0;
  if (overdueCount >= 3) reasons.push(`${overdueCount} overdue tasks`);

  const { rows: engRows } = await pool.query(
    `SELECT engagement_score FROM student_engagement_scores
      WHERE user_id = $1 ORDER BY week_start DESC NULLS LAST, created_at DESC LIMIT 1`,
    [userId]
  );
  const score = engRows[0] ? parseFloat(engRows[0].engagement_score) : null;
  if (score !== null && score < 50) reasons.push(`engagement score ${Math.round(score)}`);

  const { rows: examRows } = await pool.query(
    `SELECT COUNT(*)::int AS n FROM student_calendar_events e
      WHERE e.user_id = $1
        AND e.event_type IN ('exam','quiz')
        AND e.start_date BETWEEN $2::date AND ($2::date + INTERVAL '2 days')
        AND NOT EXISTS (
          SELECT 1 FROM student_tasks t WHERE t.event_id = e.id
        )`,
    [userId, today]
  );
  if ((examRows[0]?.n || 0) > 0) reasons.push('big test in 48h with no study tasks');

  return { atRisk: reasons.length > 0, reasons };
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------
function appUrl(): string {
  return process.env.APP_URL
    || `https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:5000'}`;
}

function renderDigestEmail(params: {
  studentName: string;
  frequency: 'daily' | 'weekly';
  horizonDays: number;
  items: UpcomingItem[];
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const { studentName, frequency, horizonDays, items, unsubscribeToken } = params;
  const base = appUrl();

  const today = new Date().toISOString().slice(0, 10);
  const dayAhead = new Date();
  dayAhead.setDate(dayAhead.getDate() + 1);
  const tomorrow = dayAhead.toISOString().slice(0, 10);

  const overdue = items.filter(i => i.dueDate < today);
  const dueToday = items.filter(i => i.dueDate === today);
  const dueSoon = items.filter(i => i.dueDate === tomorrow);
  const later = items.filter(i => i.dueDate > tomorrow);

  const renderGroup = (label: string, color: string, group: UpcomingItem[]) => {
    if (group.length === 0) return '';
    const rows = group.map(i => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#222;">${escapeHtml(i.title)}</div>
          <div style="font-size:12px;color:#666;">
            ${i.courseName ? escapeHtml(i.courseName) + ' · ' : ''}
            ${i.type ? escapeHtml(i.type) + ' · ' : ''}
            due ${escapeHtml(i.dueDate)}
          </div>
        </td>
      </tr>`).join('');
    return `
      <div style="margin:16px 0;">
        <div style="background:${color};color:#fff;padding:6px 12px;font-size:13px;font-weight:600;border-radius:4px 4px 0 0;">
          ${label} (${group.length})
        </div>
        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-top:none;">
          ${rows}
        </table>
      </div>`;
  };

  const summary = `${items.length} item${items.length === 1 ? '' : 's'} coming up for ${escapeHtml(studentName)}`;
  const subjectPrefix = frequency === 'daily' ? 'Today' : 'This Week';
  const subject = `${subjectPrefix}: ${summary}`;

  const unsubUrl = `${base}/api/notifications/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const settingsUrl = `${base}/academic-dashboard`;

  const html = `
  <div style="font-family:'Segoe UI',system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f7f9;">
    <div style="background:#282728;padding:20px;border-radius:8px 8px 0 0;border-bottom:4px solid #C5050C;">
      <h1 style="color:#fff;margin:0;font-size:20px;">State University AI Tutor · Upcoming Work</h1>
      <div style="color:#bbb;font-size:13px;margin-top:4px;">
        ${frequency === 'daily' ? 'Daily digest' : 'Weekly digest'} · next ${horizonDays} day${horizonDays === 1 ? '' : 's'}
      </div>
    </div>
    <div style="background:#fff;padding:20px;border-radius:0 0 8px 8px;">
      <p style="margin:0 0 4px 0;color:#333;font-size:15px;">
        <strong>${escapeHtml(studentName)}</strong> has ${items.length} item${items.length === 1 ? '' : 's'} on deck.
      </p>

      ${renderGroup('Overdue', '#b00020', overdue)}
      ${renderGroup('Due Today', '#d9822b', dueToday)}
      ${renderGroup('Due Tomorrow', '#d9a62b', dueSoon)}
      ${renderGroup(frequency === 'daily' ? 'Later this week' : 'Later', '#3a7', later)}

      <div style="margin-top:24px;text-align:center;">
        <a href="${settingsUrl}"
           style="display:inline-block;background:#C5050C;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
          Open Academic Dashboard
        </a>
      </div>
    </div>
    <div style="text-align:center;color:#888;font-size:11px;padding:12px 0;">
      You're receiving this because notifications are enabled in the Academic Dashboard.<br/>
      <a href="${settingsUrl}" style="color:#888;">Change frequency</a>
      &nbsp;·&nbsp;
      <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
    </div>
  </div>`;

  return { subject, html };
}

function renderAtRiskEmail(params: {
  studentName: string;
  reasons: string[];
  unsubscribeToken: string;
}): { subject: string; html: string } {
  const { studentName, reasons, unsubscribeToken } = params;
  const base = appUrl();
  const unsubUrl = `${base}/api/notifications/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const settingsUrl = `${base}/academic-dashboard`;

  const subject = `Heads up: ${studentName} may be falling behind`;
  const html = `
  <div style="font-family:'Segoe UI',system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff5f5;">
    <div style="background:#b00020;padding:20px;border-radius:8px 8px 0 0;">
      <h1 style="color:#fff;margin:0;font-size:20px;">State University AI Tutor · Heads-Up Alert</h1>
    </div>
    <div style="background:#fff;padding:20px;border-radius:0 0 8px 8px;">
      <p style="color:#222;font-size:15px;">
        Signals suggest <strong>${escapeHtml(studentName)}</strong> may be falling behind:
      </p>
      <ul style="color:#444;line-height:1.6;">
        ${reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
      </ul>
      <p style="color:#444;">
        A few minutes in the Academic Dashboard today can get things back on track.
      </p>
      <div style="margin-top:20px;text-align:center;">
        <a href="${settingsUrl}"
           style="display:inline-block;background:#b00020;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">
          Open Academic Dashboard
        </a>
      </div>
    </div>
    <div style="text-align:center;color:#888;font-size:11px;padding:12px 0;">
      You opted into heads-up alerts in your notification settings.<br/>
      <a href="${settingsUrl}" style="color:#888;">Change settings</a>
      &nbsp;·&nbsp;
      <a href="${unsubUrl}" style="color:#888;">Unsubscribe</a>
    </div>
  </div>`;

  return { subject, html };
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------------------------------------------------------------------------
// Send logic
// ---------------------------------------------------------------------------
async function processPreference(pref: PrefRow): Promise<{ sent: boolean; reason: string }> {
  const { hour, dow, date: todayLocal } = currentHourInTimezone(pref.timezone);

  if (hour !== pref.hour_local) return { sent: false, reason: 'not-this-hour' };
  if (pref.frequency === 'weekly' && dow !== pref.day_of_week) return { sent: false, reason: 'not-this-day' };

  if (pref.last_sent_at) {
    const lastDay = new Date(pref.last_sent_at).toISOString().slice(0, 10);
    if (lastDay === new Date().toISOString().slice(0, 10)) {
      return { sent: false, reason: 'already-sent-today' };
    }
  }

  const student = await loadStudent(pref.user_id);
  const studentName = student?.name || 'your student';

  const items = await loadUpcomingItems(pref.user_id, pref.horizon_days, todayLocal);
  if (items.length === 0) return { sent: false, reason: 'nothing-due' };

  const { subject, html } = renderDigestEmail({
    studentName,
    frequency: pref.frequency as 'daily' | 'weekly',
    horizonDays: pref.horizon_days,
    items,
    unsubscribeToken: pref.unsubscribe_token,
  });

  try {
    await emailService.sendEmail({ to: pref.recipient_email, subject, html });
    await pool.query(
      `UPDATE notification_preferences SET last_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [pref.id]
    );
    return { sent: true, reason: 'ok' };
  } catch (err: any) {
    console.error('[UpcomingDigest] send failed', pref.id, err?.message || err);
    return { sent: false, reason: 'send-failed' };
  }
}

async function processAtRisk(pref: PrefRow): Promise<{ sent: boolean; reason: string }> {
  if (!pref.at_risk_alerts) return { sent: false, reason: 'not-opted-in' };

  if (pref.last_at_risk_sent_at) {
    const elapsedHrs = (Date.now() - new Date(pref.last_at_risk_sent_at).getTime()) / 3_600_000;
    if (elapsedHrs < 48) return { sent: false, reason: 'cooldown' };
  }

  const { hour, date: todayLocal } = currentHourInTimezone(pref.timezone);
  if (hour !== pref.hour_local) return { sent: false, reason: 'not-this-hour' };

  const { atRisk, reasons } = await loadAtRiskSignals(pref.user_id, todayLocal);
  if (!atRisk) return { sent: false, reason: 'not-at-risk' };

  const student = await loadStudent(pref.user_id);
  const studentName = student?.name || 'your student';

  const { subject, html } = renderAtRiskEmail({
    studentName,
    reasons,
    unsubscribeToken: pref.unsubscribe_token,
  });

  try {
    await emailService.sendEmail({ to: pref.recipient_email, subject, html });
    await pool.query(
      `UPDATE notification_preferences SET last_at_risk_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [pref.id]
    );
    return { sent: true, reason: 'ok' };
  } catch (err: any) {
    console.error('[UpcomingDigest] at-risk send failed', pref.id, err?.message || err);
    return { sent: false, reason: 'send-failed' };
  }
}

// ---------------------------------------------------------------------------
// Top-level runner
// ---------------------------------------------------------------------------
export async function runUpcomingDigestTick(): Promise<{
  scanned: number; digestsSent: number; atRiskSent: number; skipped: Record<string, number>;
}> {
  const start = Date.now();
  const prefs = await loadActivePrefs();
  const skipped: Record<string, number> = {};
  let digestsSent = 0;
  let atRiskSent = 0;

  for (const pref of prefs) {
    try {
      const r = await processPreference(pref);
      if (r.sent) digestsSent++;
      else skipped[r.reason] = (skipped[r.reason] || 0) + 1;

      const ar = await processAtRisk(pref);
      if (ar.sent) atRiskSent++;
      else skipped[`atrisk:${ar.reason}`] = (skipped[`atrisk:${ar.reason}`] || 0) + 1;
    } catch (err: any) {
      console.error('[UpcomingDigest] pref error', pref.id, err?.message || err);
      skipped['error'] = (skipped['error'] || 0) + 1;
    }
  }

  const elapsed = Date.now() - start;
  console.log(
    `[UpcomingDigest] tick complete — scanned=${prefs.length} digestsSent=${digestsSent} ` +
    `atRiskSent=${atRiskSent} elapsedMs=${elapsed}`
  );
  return { scanned: prefs.length, digestsSent, atRiskSent, skipped };
}

export function startUpcomingDigestJob() {
  console.log('[UpcomingDigest] scheduler initialized — hourly tick enabled');
  cron.schedule(HOURLY_CRON, () => {
    runUpcomingDigestTick().catch(err => {
      console.error('[UpcomingDigest] unhandled error', err?.message || err);
    });
  });
}

export { runUpcomingDigestTick as sendUpcomingDigests };

/**
 * Preview — send a digest to a single preference right now, bypassing the
 * time-window + "nothing due" gates so users can see what the email looks like.
 */
export async function runPreviewForPreference(prefId: string): Promise<{ ok: boolean; reason: string }> {
  const { rows } = await pool.query<PrefRow>(
    `SELECT id, user_id, child_id, recipient_email, recipient_name, recipient_role,
            frequency, horizon_days, day_of_week, hour_local, timezone,
            at_risk_alerts, is_active, last_sent_at, last_at_risk_sent_at,
            unsubscribe_token
       FROM notification_preferences WHERE id = $1 LIMIT 1`,
    [prefId]
  );
  const pref = rows[0];
  if (!pref) return { ok: false, reason: 'not-found' };

  const { date: todayLocal } = currentHourInTimezone(pref.timezone);
  const student = await loadStudent(pref.user_id);
  const studentName = student?.name || 'your student';
  const items = await loadUpcomingItems(pref.user_id, pref.horizon_days, todayLocal);

  const renderedFreq = (pref.frequency === 'off' ? 'weekly' : pref.frequency) as 'daily' | 'weekly';
  const { subject, html } = renderDigestEmail({
    studentName,
    frequency: renderedFreq,
    horizonDays: pref.horizon_days,
    items, // may be empty — preview still renders
    unsubscribeToken: pref.unsubscribe_token,
  });

  try {
    await emailService.sendEmail({
      to: pref.recipient_email,
      subject: `[PREVIEW] ${subject}`,
      html,
    });
    return { ok: true, reason: 'sent' };
  } catch (err: any) {
    console.error('[UpcomingDigest] preview send failed', prefId, err?.message || err);
    return { ok: false, reason: 'send-failed' };
  }
}
