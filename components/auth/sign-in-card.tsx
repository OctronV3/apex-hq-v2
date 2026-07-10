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

const ClerkSignIn = isClerkConfigured
  ? dynamic(
      () => import("@clerk/react").then((mod) => ({ default: mod.SignIn })),
      { ssr: false }
    )
  : null;

function FallbackSignIn() {
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
        Enter the Batcave
      </Button>
    </form>
  );
}

export function SignInCard() {
  if (isClerkConfigured && ClerkSignIn) {
    return (
      <ClerkSignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    );
  }

  return (
    <Card className="w-full max-w-md border-[#222222] bg-[#0a0a0a]">
      <CardHeader>
        <CardTitle className="text-white text-xl">Apex HQ</CardTitle>
        <CardDescription className="text-[#888888]">
          Demo sign-in. Enter your callsign to access the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FallbackSignIn />
      </CardContent>
    </Card>
  );
}
