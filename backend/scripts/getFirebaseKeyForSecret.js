/**
 * Helper script to convert firebaseServiceAccountKey.json to a minified JSON string
 * that can be used in:
 * 1. Local .env file for development
 * 2. GitHub Actions secret (FIREBASE_SERVICE_ACCOUNT_KEY)
 * 
 * Usage: node scripts/getFirebaseKeyForSecret.js
 */

const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '../firebaseServiceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error('❌ firebaseServiceAccountKey.json not found!');
  process.exit(1);
}

const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
const minifiedJson = JSON.stringify(keyData);
const base64Encoded = Buffer.from(minifiedJson).toString('base64');

console.log('\n' + '='.repeat(70));
console.log('📝 For Local Development (.env file) - RECOMMENDED');
console.log('='.repeat(70));
console.log('\n✅ Option 1: Base64-encoded (SAFER - Recommended for .env files)');
console.log('Add this line to your backend/.env file:\n');
console.log(`FIREBASE_SERVICE_ACCOUNT_KEY=${base64Encoded}`);
console.log('\n✅ Option 2: Plain JSON (may have issues with quotes in .env)');
console.log('If base64 doesn\'t work, try this (wrap in single quotes):\n');
console.log(`FIREBASE_SERVICE_ACCOUNT_KEY='${minifiedJson}'`);
console.log('\n💡 Tip: If your .env file doesn\'t exist, create it in the backend/ directory');
console.log('   The app will automatically detect and decode base64 or parse plain JSON.');

console.log('\n' + '='.repeat(70));
console.log('🚀 For GitHub Actions Secret');
console.log('='.repeat(70));
console.log('\n✅ Option 1: Base64-encoded (RECOMMENDED - Safer)');
console.log('Copy this base64 string to GitHub Secret:\n');
console.log(base64Encoded);
console.log('\n✅ Option 2: Plain JSON string');
console.log('Or use this minified JSON (may have issues with special chars):\n');
console.log(minifiedJson);
console.log('\n📋 Instructions:');
console.log('1. Copy the base64 string above (Option 1 is recommended)');
console.log('2. Go to your GitHub repository → Settings → Secrets and variables → Actions');
console.log('3. Click "New repository secret"');
console.log('4. Name: FIREBASE_SERVICE_ACCOUNT_KEY');
console.log('5. Value: Paste the base64 string (or JSON if using Option 2)');
console.log('6. Click "Add secret"\n');

console.log('='.repeat(70));
console.log('✅ Priority Order (how the app loads the key):');
console.log('='.repeat(70));
console.log('1. FIREBASE_SERVICE_ACCOUNT_KEY (environment variable) ← Recommended');
console.log('2. FIREBASE_SERVICE_ACCOUNT_KEY_PATH (file path)');
console.log('3. Default: firebaseServiceAccountKey.json (local file)\n');

