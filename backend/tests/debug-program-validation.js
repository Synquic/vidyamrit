const mongoose = require('mongoose');

// Your exact payload
const testData = {
    "name": "english",
    "subject": "english",
    "description": "english program",
    "totalLevels": 8,
    "levels": [
        { "levelNumber": 1, "title": "Level 1", "description": "abcd", "timeframe": 1, "timeframeUnit": "weeks" },
        { "levelNumber": 2, "title": "Level 2", "description": "efgh", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [1] },
        { "levelNumber": 3, "title": "Level 3", "description": "ijkl", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [2] },
        { "levelNumber": 4, "title": "Level 4", "description": "mnop", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [3] },
        { "levelNumber": 5, "title": "Level 5", "description": "qrst", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [4] },
        { "levelNumber": 6, "title": "Level 6", "description": "uvwx", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [5] },
        { "levelNumber": 7, "title": "Level 7", "description": "yz", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [6] },
        { "levelNumber": 8, "title": "Level 8", "description": "test1", "timeframe": 1, "timeframeUnit": "weeks", "prerequisites": [7] }
    ]
};

console.log('Testing validation logic manually...');

// Test 1: Length check
console.log('Test 1 - Length check:');
console.log(`levels.length: ${testData.levels.length}`);
console.log(`totalLevels: ${testData.totalLevels}`);
console.log(`Length match: ${testData.levels.length === testData.totalLevels}`);

// Test 2: Sequential level numbers
console.log('\nTest 2 - Sequential level numbers:');
const levelNumbers = testData.levels.map(l => l.levelNumber).sort((a, b) => a - b);
console.log(`Level numbers: ${levelNumbers}`);
let sequentialValid = true;
for (let i = 0; i < levelNumbers.length; i++) {
    if (levelNumbers[i] !== i + 1) {
        sequentialValid = false;
        console.log(`Failed at index ${i}: expected ${i + 1}, got ${levelNumbers[i]}`);
    }
}
console.log(`Sequential valid: ${sequentialValid}`);

// Test 3: Prerequisites validation
console.log('\nTest 3 - Prerequisites validation:');
let prereqValid = true;
for (const level of testData.levels) {
    if (level.prerequisites) {
        for (const prereq of level.prerequisites) {
            if (prereq >= level.levelNumber) {
                prereqValid = false;
                console.log(`Invalid prereq in level ${level.levelNumber}: prereq ${prereq} >= level ${level.levelNumber}`);
            }
        }
    }
}
console.log(`Prerequisites valid: ${prereqValid}`);

// Test 4: Overall validation result
const overallValid = (testData.levels.length === testData.totalLevels) && sequentialValid && prereqValid;
console.log(`\nOverall validation result: ${overallValid}`);

// Test 5: Check for any missing required fields
console.log('\nTest 5 - Required fields check:');
for (let i = 0; i < testData.levels.length; i++) {
    const level = testData.levels[i];
    console.log(`Level ${i + 1}:`);
    console.log(`  levelNumber: ${level.levelNumber} (required)`);
    console.log(`  title: "${level.title}" (required)`);
    console.log(`  description: "${level.description}" (required)`);
    console.log(`  timeframe: ${level.timeframe} (required)`);
    console.log(`  timeframeUnit: "${level.timeframeUnit}" (required)`);
    console.log(`  prerequisites: ${JSON.stringify(level.prerequisites || [])} (optional)`);
}