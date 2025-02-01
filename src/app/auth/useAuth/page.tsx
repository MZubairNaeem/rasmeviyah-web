
"use client";
import { supabase } from '@/store/SupabaseClient';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect, useState } from 'react';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  return (props: P) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
      const fetchSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/auth/login');
        } else {
          setSession(data.session);
          setLoading(false);
        }
      };

      fetchSession();
    }, [router]);

    if (loading) {
      return <div>Loading...</div>;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;