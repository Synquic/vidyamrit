// Script to generate program import JSON from Hindi data files
const fs = require('fs');
const path = require('path');

async function generateHindiProgramJSON() {
    const dataFolder = 'd:\\Work\\Synquic\\vidyamrit\\data';
    const outputFile = 'd:\\Work\\Synquic\\vidyamrit\\hindi-program-import.json';

    console.log('🔄 Generating Hindi program JSON from data files...');

    // Base program structure
    const programData = {
        programName: "Hindi Reading Assessment Program",
        subject: "Hindi",
        description: "Comprehensive Hindi reading program with progressive difficulty levels and verbal evaluation assessments",
        levels: []
    };

    // Read all level files
    for (let level = 1; level <= 10; level++) {
        const levelFile = path.join(dataFolder, `level${level}.txt`);

        try {
            if (fs.existsSync(levelFile)) {
                console.log(`📖 Processing level ${level}...`);

                const fileContent = fs.readFileSync(levelFile, 'utf8');
                const words = fileContent
                    .split('\n')
                    .map(word => word.trim())
                    .filter(word => word.length > 0)
                    .filter(word => /^[\u0900-\u097F\s]+$/.test(word)); // Only Devanagari script

                console.log(`   Found ${words.length} words/phrases in level ${level}`);

                // Create assessment questions from the words
                const assessmentQuestions = words.slice(0, 20).map((word, index) => ({
                    questionText: word,
                    questionType: "verbal_evaluation",
                    points: 1,
                    isRequired: true
                }));

                // Add some multiple choice questions for variety (except level 1)
                if (level > 1 && words.length >= 4) {
                    // Create a multiple choice question using 4 random words
                    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
                    const correctAnswer = shuffledWords[0];
                    const options = shuffledWords.slice(0, 4);

                    assessmentQuestions.push({
                        questionText: `Which word is correctly written? (${correctAnswer})`,
                        questionType: "multiple_choice",
                        options: options,
                        correctOptionIndex: 0,
                        points: 2,
                        isRequired: false
                    });
                }

                // Level configuration
                const levelData = {
                    levelNumber: level,
                    title: `Level ${level} - ${getLevelTitle(level)}`,
                    description: getLevelDescription(level),
                    timeframe: Math.min(level + 1, 4), // Progressive timeframe
                    timeframeUnit: "weeks",
                    prerequisites: level > 1 ? [level - 1] : [],
                    objectives: getLevelObjectives(level),
                    resources: [
                        `Level ${level} word cards`,
                        `Reading practice sheets`,
                        "Audio pronunciation guide"
                    ],
                    assessmentCriteria: `Student can read and pronounce Level ${level} words correctly`,
                    assessmentQuestions: assessmentQuestions
                };

                programData.levels.push(levelData);
            } else {
                console.log(`⚠️  Level ${level} file not found: ${levelFile}`);
            }
        } catch (error) {
            console.error(`❌ Error processing level ${level}:`, error.message);
        }
    }

    // Write the JSON file
    try {
        fs.writeFileSync(outputFile, JSON.stringify(programData, null, 2), 'utf8');
        console.log(`✅ Successfully generated: ${outputFile}`);
        console.log(`📊 Program contains ${programData.levels.length} levels`);

        // Summary
        const totalQuestions = programData.levels.reduce((total, level) =>
            total + (level.assessmentQuestions?.length || 0), 0
        );
        console.log(`📝 Total assessment questions: ${totalQuestions}`);

        return outputFile;
    } catch (error) {
        console.error('❌ Error writing JSON file:', error.message);
        throw error;
    }
}

function getLevelTitle(level) {
    const titles = {
        1: "Basic Vowels",
        2: "Two-Letter Words",
        3: "Three-Letter Words",
        4: "Simple Consonants",
        5: "Complex Consonants",
        6: "Short Sentences",
        7: "Reading Comprehension",
        8: "Advanced Words",
        9: "Complex Sentences",
        10: "Fluent Reading"
    };
    return titles[level] || `Advanced Level ${level}`;
}

function getLevelDescription(level) {
    const descriptions = {
        1: "Introduction to basic Hindi vowels and their pronunciation",
        2: "Reading and understanding simple two-letter Hindi words",
        3: "Progressing to three-letter words and basic word formation",
        4: "Learning simple consonant combinations and sounds",
        5: "Mastering complex consonant combinations and conjunct letters",
        6: "Reading short sentences and understanding context",
        7: "Developing reading comprehension and meaning understanding",
        8: "Advanced vocabulary and complex word structures",
        9: "Reading complex sentences with proper intonation",
        10: "Achieving fluent reading with full comprehension"
    };
    return descriptions[level] || `Advanced level ${level} reading skills`;
}

function getLevelObjectives(level) {
    const baseObjectives = [
        `Master Level ${level} vocabulary`,
        `Improve reading fluency`,
        `Enhance pronunciation accuracy`
    ];

    if (level <= 3) {
        baseObjectives.push("Recognize letter combinations");
    } else if (level <= 6) {
        baseObjectives.push("Understand word meanings", "Read with proper pace");
    } else {
        baseObjectives.push("Comprehend text meaning", "Read with expression");
    }

    return baseObjectives;
}

// Run the generator
if (require.main === module) {
    generateHindiProgramJSON()
        .then(outputFile => {
            console.log('\n🎉 Hindi program JSON generation complete!');
            console.log(`📁 Output file: ${outputFile}`);
            console.log('\n📋 Next steps:');
            console.log('1. Review the generated JSON file');
            console.log('2. Upload it through the program management interface');
            console.log('3. The questions will be automatically added to the program levels');
        })
        .catch(error => {
            console.error('\n❌ Generation failed:', error.message);
            process.exit(1);
        });
}

module.exports = { generateHindiProgramJSON };