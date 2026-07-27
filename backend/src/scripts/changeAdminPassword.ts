/**
 * One-off script to change a user's (e.g. admin) Firebase Auth password.
 *
 * Credentials are read from environment variables so the new password is NOT
 * committed to the repo or left in a file.
 *
 * Usage (from the backend/ folder):
 *   ADMIN_EMAIL=superadmin@gmail.com NEW_ADMIN_PASSWORD='your-strong-password' npx ts-node src/scripts/changeAdminPassword.ts
 *
 * Tip: choose a long, unique password (16+ chars) that isn't used anywhere else.
 */
import { auth } from "../configs/firebaseAdmin";

async function main() {
  const email = "superadmin@gmail.com";
  const newPassword = "CYb_&+FZw-URhCNLuY";

  if (!email || !newPassword) {
    console.error(
      "Missing input. Run:\n  ADMIN_EMAIL=admin@example.com NEW_ADMIN_PASSWORD='...' npx ts-node src/scripts/changeAdminPassword.ts"
    );
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("Password must be at least 8 characters (use 16+ for safety).");
    process.exit(1);
  }

  const user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password: newPassword });

  console.log(`✅ Password updated successfully for ${email} (uid: ${user.uid})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed to update password:", err?.message || err);
  process.exit(1);
});
