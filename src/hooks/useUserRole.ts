import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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

    async function fetchUserRole() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (err) {
          setError(err.message);
          setRole(null);
        } else if (data) {
          setRole(data.role as UserRole);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
        setRole(null);
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
      
      // Se for o usuário atual, atualiza o estado local
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
