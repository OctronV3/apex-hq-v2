"use client";

import { createContext, useContext } from "react";

export interface ApexUser {
  id: string;
  name: string;
  email: string;
  imageUrl?: string | null;
}

export interface ApexAuthContextValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ApexUser | null;
  signIn: () => void;
  signOut: () => void;
}

export const ApexAuthContext = createContext<ApexAuthContextValue>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export function useAuth() {
  return useContext(ApexAuthContext);
}
