import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
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
      setSuccessMessage(null);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccessMessage(null);
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccessMessage(t("Password reset email sent! Please check your inbox."));
      setResetEmail("");
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("auth/user-not-found")) {
          setError(t("No account found with this email."));
        } else if (err.message.includes("auth/invalid-email")) {
          setError(t("Invalid email address."));
        } else {
          setError(t("Failed to send reset email. Please try again."));
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 relative min-h-screen lg:min-h-0">
        {/* Decorative elements for left side */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-200 rounded-full opacity-20 blur-2xl"></div>

        <div className="w-full max-w-md space-y-6 sm:space-y-8 relative z-10 py-8 sm:py-0">
          {/* Logo/Brand with icon */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {t("Vidyamrit")}
              </h1>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              {t("Hello!")}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {t("Welcome back to the platform")}
            </p>
          </div>

          {/* Login Form or Forgot Password Form */}
          {!showForgotPassword ? (
            <form className="space-y-4 sm:space-y-6" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("Your Email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 sm:pl-12 py-5 sm:py-6 text-sm sm:text-base border-gray-200 bg-white/80 backdrop-blur-sm focus:border-orange-500 focus:ring-orange-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("Password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 sm:pl-12 py-5 sm:py-6 text-sm sm:text-base border-gray-200 bg-white/80 backdrop-blur-sm focus:border-orange-500 focus:ring-orange-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors"
                >
                  {t("Forgot Password?")}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 py-3 px-4 rounded-xl border border-red-100">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 py-3 px-4 rounded-xl border border-green-100">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full py-5 sm:py-6 text-base sm:text-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {t("Log In")}
              </Button>
            </form>
          ) : (
            <form className="space-y-4 sm:space-y-6" onSubmit={handleForgotPassword}>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t("Reset Password")}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("Enter your email to receive a password reset link")}
                </p>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder={t("Your Email")}
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="pl-10 sm:pl-12 py-5 sm:py-6 text-sm sm:text-base border-gray-200 bg-white/80 backdrop-blur-sm focus:border-orange-500 focus:ring-orange-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 py-3 px-4 rounded-xl border border-red-100">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 py-3 px-4 rounded-xl border border-green-100">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Reset Button */}
              <Button
                type="submit"
                className="w-full py-5 sm:py-6 text-base sm:text-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                {t("Send Reset Link")}
              </Button>

              {/* Back to Login Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setError(null);
                    setSuccessMessage(null);
                    setResetEmail("");
                  }}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline transition-colors inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t("Back to Login")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Side - Hero Section with Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1920&auto=format&fit=crop"
            alt="Students learning together"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/80 via-orange-800/70 to-amber-700/60"></div>
        </div>

        {/* Language Toggle - Top Right */}
        <div className="absolute top-8 right-8 z-10">
          <div className="bg-black/30 backdrop-blur-md rounded-lg p-1">
            <LanguageToggleButton />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-8 md:p-12 lg:p-16 text-white h-full">
          <div className="space-y-6 max-w-lg">
            {/* Main heading with smaller font */}
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.7)'}}>
                {t("Empowering education, one student at a time.")}
              </h2>
              <div className="w-20 h-1 bg-white rounded-full shadow-lg"></div>
            </div>

            <p className="text-base md:text-lg leading-relaxed text-white" style={{textShadow: '1px 1px 4px rgba(0,0,0,0.6)'}}>
              {t(
                "Join us in transforming lives through quality education and making a lasting impact in communities."
              )}
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-white/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Language Toggle for Mobile */}
      <div className="fixed top-4 right-4 lg:hidden z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg">
          <LanguageToggleButton />
        </div>
      </div>
    </div>
  );
}
