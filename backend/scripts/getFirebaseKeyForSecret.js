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

console.log('\n' + '='.repeat(70));
console.log('📝 For Local Development (.env file)');
console.log('='.repeat(70));
console.log('\nAdd this line to your backend/.env file:\n');
console.log(`FIREBASE_SERVICE_ACCOUNT_KEY=${minifiedJson}`);
console.log('\n💡 Tip: If your .env file doesn\'t exist, create it in the backend/ directory');
console.log('   The app will automatically use this environment variable.');

console.log('\n' + '='.repeat(70));
console.log('🚀 For GitHub Actions Secret');
console.log('='.repeat(70));
console.log('\nMinified JSON string (copy this to GitHub Secret):\n');
console.log(minifiedJson);
console.log('\n📋 Instructions:');
console.log('1. Copy the JSON string above');
console.log('2. Go to your GitHub repository → Settings → Secrets and variables → Actions');
console.log('3. Click "New repository secret"');
console.log('4. Name: FIREBASE_SERVICE_ACCOUNT_KEY');
console.log('5. Value: Paste the JSON string');
console.log('6. Click "Add secret"\n');

console.log('='.repeat(70));
console.log('✅ Priority Order (how the app loads the key):');
console.log('='.repeat(70));
console.log('1. FIREBASE_SERVICE_ACCOUNT_KEY (environment variable) ← Recommended');
console.log('2. FIREBASE_SERVICE_ACCOUNT_KEY_PATH (file path)');
console.log('3. Default: firebaseServiceAccountKey.json (local file)\n');

