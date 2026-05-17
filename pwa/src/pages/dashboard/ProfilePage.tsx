import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { logout } from "@/services/auth";
import { ChevronLeft, LogOut, Camera, User, Languages } from "lucide-react";
import { auth } from "../../../firebaseConfig";
import { apiUrl } from "@/services/index";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.profilePhoto ?? null);
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPhotoUrl(base64);
      try {
        setSaving(true);
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) return;
        const token = await firebaseUser.getIdToken();
        await fetch(`${apiUrl}/users/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profilePhoto: base64 }),
        });
      } catch (err) {
        console.error("Failed to save profile photo:", err);
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const roleLabel = user?.role
    ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hidden file input — outside any positioned container */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none", position: "fixed", top: "-9999px", left: "-9999px" }}
        onChange={handlePhotoChange}
      />

      {/* Hero */}
      <div className="bg-slate-500 pt-6 pb-20 flex flex-col items-center">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between px-4 mb-8">
          <button onClick={() => navigate(-1)} className="text-white p-1">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <span className="text-white text-lg font-semibold">Profile</span>
          {/* Plain language toggle — no white background */}
          <button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en")}
            className="flex items-center gap-1.5 border border-white/40 rounded-lg px-3 py-1.5 text-white text-sm"
          >
            <Languages className="w-4 h-4" />
            {i18n.language === "en" ? "हिंदी" : "English"}
          </button>
        </div>

        {/* Avatar with upload button */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400" strokeWidth={1.5} />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow disabled:opacity-60"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        <h2 className="mt-3 text-white text-2xl font-bold text-center w-full px-6">
          {user?.name}
        </h2>
        {saving && (
          <p className="text-white/70 text-xs mt-1">Saving photo...</p>
        )}
      </div>

      {/* Content card — overlaps hero bottom */}
      <div className="flex-1 px-4 -mt-8 pb-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Role</p>
            <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">
              {roleLabel}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">Email</p>
            <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">
              {user?.email}
            </div>
          </div>
          {user?.phoneNo && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Phone</p>
              <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">
                {user.phoneNo}
              </div>
            </div>
          )}
          {(user as any)?.schoolId?.name && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">School</p>
              <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-3 text-gray-700 text-sm">
                {(user as any).schoolId.name}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 border border-red-100 rounded-2xl py-4 flex items-center justify-center gap-2 text-red-600 font-semibold text-sm tracking-wide"
        >
          <LogOut className="w-4 h-4" />
          LOG OUT
        </button>
      </div>
    </div>
  );
}
