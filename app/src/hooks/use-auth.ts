'use client';

import { useMemo } from 'react';
import { useAppStore, type User } from '@/store/use-app-store';

export function useAuth() {
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const signOut = useAppStore((state) => state.signOut);

  const user: User | undefined = useMemo(
    () => users.find((candidate) => candidate.id === currentUserId),
    [users, currentUserId],
  );

  return { user, signOut };
}
