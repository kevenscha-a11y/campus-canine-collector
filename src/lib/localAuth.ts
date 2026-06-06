import type { Session, User } from "@supabase/supabase-js";

const USERS_KEY = "dogdex-local-users";
const SESSION_KEY = "dogdex-local-session";

interface LocalUserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  created_at: string;
}

function loadUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as LocalUserRecord[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toUser(record: LocalUserRecord): User {
  return {
    id: record.id,
    email: record.email,
    app_metadata: {},
    user_metadata: { full_name: record.name },
    aud: "authenticated",
    created_at: record.created_at,
    email_confirmed_at: record.created_at,
    confirmed_at: record.created_at,
    last_sign_in_at: new Date().toISOString(),
    role: "authenticated",
    updated_at: new Date().toISOString(),
  } as User;
}

function toSession(user: User): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: `local-${user.id}`,
    refresh_token: `local-refresh-${user.id}`,
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: "bearer",
    user,
  } as Session;
}

export const localAuth = {
  getSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      if (!session?.user?.id) return null;
      return session;
    } catch {
      return null;
    }
  },

  setSession(session: Session | null) {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  signUp(email: string, password: string, name: string): { error: string | null; session: Session | null } {
    const normalizedEmail = email.trim().toLowerCase();
    const users = loadUsers();

    if (users.some((u) => u.email === normalizedEmail)) {
      return { error: "Este e-mail já está cadastrado. Tente entrar.", session: null };
    }

    const record: LocalUserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password,
      name: name.trim() || normalizedEmail.split("@")[0],
      created_at: new Date().toISOString(),
    };

    users.push(record);
    saveUsers(users);

    const session = toSession(toUser(record));
    this.setSession(session);
    return { error: null, session };
  },

  signIn(email: string, password: string): { error: string | null; session: Session | null } {
    const normalizedEmail = email.trim().toLowerCase();
    const record = loadUsers().find((u) => u.email === normalizedEmail);

    if (!record || record.password !== password) {
      return { error: "E-mail ou senha incorretos.", session: null };
    }

    const session = toSession(toUser(record));
    this.setSession(session);
    return { error: null, session };
  },

  signOut() {
    this.setSession(null);
  },
};
