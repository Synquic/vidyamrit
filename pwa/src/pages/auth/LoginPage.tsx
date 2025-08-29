import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebaseConfig";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
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
import { useTranslation } from "react-i18next";
import { LanguageToggleButton } from "@/components/LanguageToggleButton";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      // Handle Firebase error or custom error object
      if (
        typeof err === "object" &&
        err !== null &&
        ("message" in err || "code" in err)
      ) {
        const message = (err as { message?: string }).message;
        const code = (err as { code?: number | string }).code;
        if (
          message === "INVALID_LOGIN_CREDENTIALS" ||
          code === 400 ||
          code === "auth/invalid-credential"
        ) {
          setError(t("Invalid email or password."));
        } else if (err instanceof Error) {
          // Hide technical Firebase error from user
          if (err.message.includes("auth/invalid-credential")) {
            setError(t("Invalid email or password."));
          } else {
            setError(err.message);
          }
        } else {
          setError(t("An unknown error occurred."));
        }
      } else {
        setError(t("An unknown error occurred."));
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md relative">
        <div className="absolute top-4 right-4">
          <LanguageToggleButton />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("Welcome back")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("Enter your email and password to sign in")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-center text-sm">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                {t("Forgot password?")}
              </a>
            </div>
            <Button type="submit" className="w-full">
              {t("Log In")}
            </Button>
          </form>
        </CardContent>
        {/* <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            {"Don't have an account? "}
            <a
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </a>
          </div>
        </CardFooter> */}
      </Card>
    </div>
  );
}
