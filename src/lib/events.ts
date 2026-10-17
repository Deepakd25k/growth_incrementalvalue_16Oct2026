import "server-only";
import { db } from "./db";
import type { Touch } from "./attribution";
import { sendMetaEvent, type MetaUser } from "./meta";

export type RecordInput = {
  eventId: string;
  name: string;
  visitorId?: string | null;
  sessionId?: string | null;
  leadId?: string | null;
  path?: string | null;
  touch?: Touch | null;
  value?: number | null; // paise
  meta?: {
    user: MetaUser;
    sourceUrl?: string;
    customData?: Record<string, unknown>;
  } | null; // null = do not forward to Meta
};

// Stores the event once (event_id is unique) and forwards it to Meta CAPI.
// A repeated event_id is ignored, so retries never double count in our DB or in Meta.
export async function recordEvent(e: RecordInput): Promise<void> {
  const sql = await db();
  const t = e.touch || null;
  const rows = await sql`
    INSERT INTO audit_events (event_id, name, visitor_id, session_id, lead_id, path, utm_source, utm_medium, utm_campaign,
                        utm_content, utm_term, has_fbclid, has_gclid, value, meta_status)
    VALUES (${e.eventId}, ${e.name}, ${e.visitorId ?? null}, ${e.sessionId ?? null}, ${e.leadId ?? null}, ${e.path ?? null},
            ${t?.source ?? null}, ${t?.medium ?? null}, ${t?.campaign ?? null}, ${t?.content ?? null},
            ${t?.term ?? null}, ${Boolean(t?.fbclid)}, ${Boolean(t?.gclid)}, ${e.value ?? null},
            ${e.meta ? "pending" : "skipped"})
    ON CONFLICT (event_id) DO NOTHING
    RETURNING id`;
  if (rows.length === 0 || !e.meta) return;

  const status = await sendMetaEvent({
    eventName: e.name,
    eventId: e.eventId,
    sourceUrl: e.meta.sourceUrl,
    user: e.meta.user,
    customData: e.meta.customData,
  });
  await sql`UPDATE audit_events SET meta_status = ${status} WHERE id = ${rows[0].id}`;
}
