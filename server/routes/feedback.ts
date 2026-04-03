import { Router } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const feedbackSchema = z.object({
  sessionId: z.string().nullable().optional(),
  rating:    z.number().int().min(1).max(5),
  comment:   z.string().max(500).optional().default(''),
});

// Ensure table exists (safe to run multiple times)
async function ensureFeedbackTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS session_feedback (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER,
      session_id   TEXT,
      rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment      TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
ensureFeedbackTable().catch(console.error);

router.post('/api/session-feedback', async (req: any, res) => {
  try {
    const user = req.user;
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid feedback data' });
    }
    const { sessionId, rating, comment } = parsed.data;

    await db.execute(sql`
      INSERT INTO session_feedback (user_id, session_id, rating, comment)
      VALUES (${user?.id ?? null}, ${sessionId ?? null}, ${rating}, ${comment})
    `);

    console.log(`[Feedback] user=${user?.id ?? 'anon'} rating=${rating} session=${sessionId ?? 'none'}`);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[Feedback] Error:', err.message);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// ── Feedback Widget (comment box on tutor page) ─────────────────────────────

const widgetSchema = z.object({
  category: z.enum(['general', 'suggestion', 'bug', 'praise']),
  rating: z.number().int().min(0).max(5),
  message: z.string().min(1).max(500),
});

router.post('/api/feedback', async (req: any, res) => {
  try {
    const validation = widgetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { category, rating, message } = validation.data;
    const user = req.user;

    const userInfo = user
      ? `User: ${user.email || 'unknown'} (ID: ${user.id})`
      : 'User: Anonymous';

    const categoryLabels: Record<string, string> = {
      praise: '⭐ What I love',
      suggestion: '💡 Suggestion',
      bug: '🔧 Something\'s off',
      general: '💬 General feedback',
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    const ratingDisplay = rating > 0
      ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5 — ${ratingLabels[rating]})`
      : 'Not provided';

    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // Save to DB
    await db.execute(sql`
      INSERT INTO session_feedback (user_id, session_id, rating, comment)
      VALUES (${user?.id ?? null}, ${null}, ${rating}, ${`[${category}] ${message}`})
    `);

    // Send email notification
    try {
      const { emailService } = await import('../services/email-service');
      await emailService.sendEmail({
        to: 'pollis@jiemastery.ai', // TODO: Update domain for production deployment
        subject: `[Feedback] ${categoryLabels[category]} — State University AI Tutor`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#C5050C;padding:20px 24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:18px;">📬 State University Tutor Feedback</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:12px;">${now}</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 24px;">
            <p><b>Category:</b> ${categoryLabels[category]}</p>
            <p><b>Rating:</b> ${ratingDisplay}</p>
            <p><b>From:</b> ${userInfo}</p>
            <div style="background:#f9fafb;border-left:4px solid #C5050C;padding:14px 16px;border-radius:0 8px 8px 0;margin-top:12px;">
              <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
            </div>
            <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center;">State University AI Tutor • Feedback Widget</p>
          </div>
        </div>`,
        text: `TUTOR FEEDBACK\nCategory: ${categoryLabels[category]}\nRating: ${ratingDisplay}\n${userInfo}\nTime: ${now}\n\nMessage:\n${message}`,
      });
    } catch (emailErr: any) {
      console.error('[Feedback Widget] Email failed:', emailErr.message);
      // Don't fail the response — feedback was saved to DB
    }

    console.log(`[Feedback Widget] ✅ ${category} rating=${rating} user=${user?.email || 'anon'}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Feedback Widget] ❌ Error:', err.message);
    res.status(500).json({ error: 'Failed to send feedback' });
  }
});

export default router;
