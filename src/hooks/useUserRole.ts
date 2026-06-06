import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/types/database";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    if (!isSupabaseConfigured) {
      setRole("user");
      return;
    }

    async function fetchUserRole() {
      setLoading(true);
      setError(null);

      try {
        // Tenta com coluna role (requer migration add_admin_roles)
        const { data, error: roleErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!roleErr && data?.role) {
          setRole(data.role as UserRole);
          return;
        }

        // Fallback: tabela existe mas coluna role ainda não foi migrada
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileErr) {
          setRole("user");
          return;
        }

        setRole(profile ? "user" : "user");
      } catch {
        setRole("user");
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user?.id, user]);

  const setAdminRole = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);

      if (error) throw error;

      if (userId === user?.id) {
        setRole("admin");
      }
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to set admin role";
      setError(message);
      return false;
    }
  }, [user?.id]);

  return {
    role,
    isAdmin,
    loading,
    error,
    setAdminRole,
  };
}
