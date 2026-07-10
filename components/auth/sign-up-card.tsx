"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { isClerkConfigured } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ClerkSignUp = isClerkConfigured
  ? dynamic(
      () => import("@clerk/react").then((mod) => ({ default: mod.SignUp })),
      { ssr: false }
    )
  : null;

function FallbackSignUp() {
  const [name, setName] = useState("");
  const { signInWithDemo } = useAuth();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signInWithDemo(name);
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="callsign">Callsign</Label>
        <Input
          id="callsign"
          placeholder="Bruce Wayne"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#111111] border-[#222222] text-white placeholder:text-[#555555]"
        />
      </div>
      <Button type="submit" className="w-full bg-[#ff1a1a] hover:bg-[#d60a0a] text-white">
        Create account
      </Button>
    </form>
  );
}

export function SignUpCard() {
  if (isClerkConfigured && ClerkSignUp) {
    return (
      <ClerkSignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    );
  }

  return (
    <Card className="w-full max-w-md border-[#222222] bg-[#0a0a0a]">
      <CardHeader>
        <CardTitle className="text-white text-xl">Join Apex HQ</CardTitle>
        <CardDescription className="text-[#888888]">
          Demo sign-up. Enter your callsign to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FallbackSignUp />
      </CardContent>
    </Card>
  );
}
