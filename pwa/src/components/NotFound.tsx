"use client";

export default function NotFoundComponent() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 text-center">
      <h1 className="text-7xl md:text-9xl font-extrabold text-blue-600 leading-none">
        404
      </h1>
      <h2 className="text-2xl md:text-4xl font-semibold text-slate-800 mt-4 mb-2">
        Page Not Found
      </h2>
      <p className="text-base md:text-lg text-slate-500 mb-8 max-w-md">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full font-semibold text-base shadow hover:bg-blue-700 transition"
      >
        Go Home
      </a>
    </div>
  );
}
