const CAMPUS_TOKEN_RE = /CAMPUS-\d{3}/i;

/** Extrai CAMPUS-001 … CAMPUS-012 de texto cru, URL ou JSON simples */
export function extractCampusToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const direct = text.match(CAMPUS_TOKEN_RE);
  if (direct) return direct[0].toUpperCase();

  try {
    const url = new URL(text);
    const candidates = [
      url.searchParams.get("token"),
      url.searchParams.get("qr"),
      url.searchParams.get("code"),
      url.pathname.split("/").filter(Boolean).pop(),
    ];
    for (const c of candidates) {
      if (!c) continue;
      const match = c.match(CAMPUS_TOKEN_RE);
      if (match) return match[0].toUpperCase();
    }
  } catch {
    /* não é URL */
  }

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const fields = [parsed.token, parsed.qr, parsed.code, parsed.id];
    for (const f of fields) {
      if (typeof f !== "string") continue;
      const match = f.match(CAMPUS_TOKEN_RE);
      if (match) return match[0].toUpperCase();
    }
  } catch {
    /* não é JSON */
  }

  return null;
}

export function isValidCampusToken(token: string): boolean {
  return CAMPUS_TOKEN_RE.test(token);
}
