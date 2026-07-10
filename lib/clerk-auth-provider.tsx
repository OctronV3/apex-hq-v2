"use client";

import React, { useCallback, useMemo } from "react";
import {
  ClerkProvider,
  UserButton,
  SignIn,
  SignUp,
  useUser,
  useClerk,
} from "@clerk/react";
import { useRouter } from "next/navigation";
import { ApexAuthContext, ApexAuthContextValue } from "./auth-context";

function ClerkAuthBridge({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openSignIn } = useClerk();
  const router = useRouter();

  const signIn = useCallback(() => {
    openSignIn();
  }, [openSignIn]);

  const signOutAndRedirect = useCallback(() => {
    signOut(() => router.push("/sign-in"));
  }, [signOut, router]);

  const value = useMemo<ApexAuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: !!isSignedIn,
      user: user
        ? {
            id: user.id,
            name: user.fullName || user.firstName || "Operator",
            email: user.primaryEmailAddress?.emailAddress || "",
            imageUrl: user.imageUrl,
          }
        : null,
      signIn,
      signOut: signOutAndRedirect,
      signInWithDemo: () => signIn(),
    }),
    [isLoaded, isSignedIn, user, signIn, signOutAndRedirect]
  );

  return (
    <ApexAuthContext.Provider value={value}>
      {children}
    </ApexAuthContext.Provider>
  );
}

export function ClerkAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorPrimary: "#ff1a1a",
          colorBackground: "#000000",
          colorForeground: "#ffffff",
          colorDanger: "#ff1a1a",
          borderRadius: "0.5rem",
        },
        elements: {
          card: "bg-[#0a0a0a] border border-[#222222]",
          headerTitle: "text-white",
          headerSubtitle: "text-[#888888]",
          socialButtonsBlockButton:
            "bg-[#111111] border-[#222222] text-white hover:bg-[#1a1a1a]",
          formButtonPrimary: "bg-[#ff1a1a] hover:bg-[#d60a0a] text-white",
          input: "bg-[#111111] border-[#222222] text-white",
        },
      }}
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

export { UserButton, SignIn, SignUp };
