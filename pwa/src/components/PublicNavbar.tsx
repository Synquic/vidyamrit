"use client";

import { Button } from "@/components/ui/button";

export default function PublicNavbar() {
  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="font-serif text-2xl font-bold text-amber-600">
              Vidyamrit
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a
                href="#about"
                className="font-sans text-gray-700 hover:text-amber-600 transition-colors"
              >
                About
              </a>
              <a
                href="#approach"
                className="font-sans text-gray-700 hover:text-amber-600 transition-colors"
              >
                Our Approach
              </a>
              <a
                href="#impact"
                className="font-sans text-gray-700 hover:text-amber-600 transition-colors"
              >
                Impact
              </a>
              <a
                href="/login"
                className="font-sans text-gray-700 hover:text-amber-600 transition-colors"
              >
                Get Involved
              </a>
              <a
                href="#stories"
                className="font-sans text-gray-700 hover:text-amber-600 transition-colors"
              >
                Stories
              </a>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                window.location.pathname = "/login";
              }}
            >
              Login
            </Button>
          </div>

          {/* Mobile Login button */}
          <div className="md:hidden">
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                window.location.pathname = "/login";
              }}
            >
              Login
            </Button>
          </div>
        </div>

      </div>
    </nav>
  );
}
