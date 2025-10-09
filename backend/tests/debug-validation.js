// Quick test to debug the validation
const testLevel = {
    levelNumber: 1,
    title: "Level 1",
    description: "abcd",
    timeframe: 1,
    timeframeUnit: "weeks", // This should match the enum
    prerequisites: [],
    objectives: [],
    resources: [],
    assessmentCriteria: ""
};

const testData = {
    name: "English",
    subject: "English",
    description: "english program",
    totalLevels: 7,
    levels: [testLevel] // Just test with one level first
};

console.log("Test data structure:", JSON.stringify(testData, null, 2));
console.log("Level 1 timeframeUnit:", testLevel.timeframeUnit);
console.log("Type of timeframeUnit:", typeof testLevel.timeframeUnit);