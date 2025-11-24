/**
 * Quick script to convert your existing JSON string to base64
 * Usage: node scripts/convertToBase64.js
 * Then paste your JSON when prompted, or pass it as argument
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get JSON from command line argument or prompt
const jsonArg = process.argv[2];

if (jsonArg) {
  convertToBase64(jsonArg);
} else {
  console.log('Paste your FIREBASE_SERVICE_ACCOUNT_KEY JSON value and press Enter:');
  rl.on('line', (input) => {
    convertToBase64(input.trim());
    rl.close();
  });
}

function convertToBase64(jsonString) {
  try {
    // Remove surrounding quotes if present
    let cleaned = jsonString.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Validate it's valid JSON
    JSON.parse(cleaned);
    
    // Convert to base64
    const base64 = Buffer.from(cleaned).toString('base64');
    
    console.log('\n✅ Base64-encoded value (use this in your .env file):\n');
    console.log(`FIREBASE_SERVICE_ACCOUNT_KEY=${base64}`);
    console.log('\n📝 Update your .env file with the line above.\n');
  } catch (error) {
    console.error('\n❌ Error: Invalid JSON string');
    console.error('Make sure you paste the complete JSON value.\n');
  }
}

