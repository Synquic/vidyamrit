// Test the exact validation logic from your payload
const payload = {
    "name": "English",
    "subject": "English",
    "description": "english program",
    "totalLevels": 7,
    "levels": [
        { "levelNumber": 1, "title": "Level 1", "description": "abcd", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [], "objectives": [], "resources": [], "assessmentCriteria": "" },
        { "levelNumber": 2, "title": "Level 2", "description": "efgh", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [1], "objectives": [], "resources": [], "assessmentCriteria": "" },
        { "levelNumber": 3, "title": "Level 3", "description": "ijkl", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [2], "objectives": [], "resources": [], "assessmentCriteria": "" },
        { "levelNumber": 4, "title": "Level 4", "description": "mnop", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [3], "objectives": [], "resources": [], "assessmentCriteria": "" },
        { "levelNumber": 5, "title": "Level 5", "description": "qrst", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [4], "objectives": [], "resources": [], "assessmentCriteria": "" },
        { "levelNumber": 6, "title": "Level 6", "description": "uvwx", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [5], "objectives": [], "resources": [], "assessmentCriteria": "" },
        { "levelNumber": 7, "title": "Level 7", "description": "yz", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [6], "objectives": [], "resources": [], "assessmentCriteria": "" }
    ]
};

// Simulate the validation logic
function validateLevels(levels, totalLevels) {
    console.log("=== VALIDATION DEBUG ===");
    console.log("Levels array length:", levels.length);
    console.log("Total levels:", totalLevels);
    console.log("Length match:", levels.length === totalLevels);

    // Check 1: Length validation
    if (levels.length !== totalLevels) {
        console.log("❌ FAILED: Length validation");
        return false;
    }
    console.log("✅ PASSED: Length validation");

    // Check 2: Sequential numbering
    const levelNumbers = levels.map(l => l.levelNumber).sort((a, b) => a - b);
    console.log("Level numbers:", levelNumbers);

    for (let i = 0; i < levelNumbers.length; i++) {
        console.log(`Checking level ${i + 1}: expected ${i + 1}, got ${levelNumbers[i]}`);
        if (levelNumbers[i] !== i + 1) {
            console.log("❌ FAILED: Sequential numbering");
            return false;
        }
    }
    console.log("✅ PASSED: Sequential numbering");

    // Check 3: Prerequisites validation
    for (const level of levels) {
        console.log(`Checking level ${level.levelNumber} prerequisites:`, level.prerequisites);
        if (level.prerequisites) {
            for (const prereq of level.prerequisites) {
                console.log(`  Prereq ${prereq} vs level ${level.levelNumber}`);
                if (prereq >= level.levelNumber) {
                    console.log("❌ FAILED: Prerequisites validation");
                    return false;
                }
            }
        }
    }
    console.log("✅ PASSED: Prerequisites validation");

    return true;
}

const result = validateLevels(payload.levels, payload.totalLevels);
console.log("=== FINAL RESULT ===");
console.log("Validation result:", result ? "PASSED" : "FAILED");