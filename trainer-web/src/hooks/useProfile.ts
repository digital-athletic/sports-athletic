import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

interface Profile {
  trainerGrantedAt: string | null;
  adminGrantedAt: string | null;
}

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: boolean;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile(userId: string) {
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("trainer_granted_at, admin_granted_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        // Fail-closed: any fetch error defaults to no trainer/admin access.
        console.error("Failed to fetch trainer profile:", fetchError);
        setError(true);
      } else {
        setError(false);
      }
      setProfile({
        trainerGrantedAt: data?.trainer_granted_at ?? null,
        adminGrantedAt: data?.admin_granted_at ?? null,
      });
      setLoading(false);
    }

    // Bootstrap from existing session immediately to avoid a spinner flash on mount.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        setError(false);
        void fetchProfile(session.user.id);
      } else if (!cancelled) {
        setProfile(null);
        setError(false);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { profile, loading, error };
}
