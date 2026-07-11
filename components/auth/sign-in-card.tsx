"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignInCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-[#222222] bg-[#0a0a0a]">
      <CardHeader>
        <CardTitle className="text-white text-xl">Apex HQ</CardTitle>
        <CardDescription className="text-[#888888]">
          Sign in to access the command center.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-[#ff1a1a]">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="bruce@apex.hq"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#111111] border-[#222222] text-white placeholder:text-[#555555]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#111111] border-[#222222] text-white placeholder:text-[#555555]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff1a1a] hover:bg-[#d60a0a] text-white"
          >
            {loading ? "Signing in..." : "Enter the Batcave"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
