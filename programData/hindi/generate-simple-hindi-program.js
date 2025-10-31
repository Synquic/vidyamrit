const fs = require('fs');
const path = require('path');

function generateSimpleFormatFromData() {
    console.log('🔄 Generating simple format JSON from data files...');

    const questionSets = [];
    const dataDir = path.join(__dirname, 'data');

    // Process each level file
    for (let level = 1; level <= 10; level++) {
        const filePath = path.join(dataDir, `level${level}.txt`);

        if (fs.existsSync(filePath)) {
            console.log(`📖 Processing level ${level}...`);

            const content = fs.readFileSync(filePath, 'utf8');

            // Check if the content has separator lines (-----------)
            if (content.includes('-----------')) {
                console.log(`   Detected text blocks with separators in level ${level}`);

                // Split by separator and process each block
                const textBlocks = content.split('-----------')
                    .map(block => block.trim())
                    .filter(block => block.length > 0)
                    .filter(block => /[\u0900-\u097F]/.test(block)) // Only blocks with Hindi characters
                    .map(block => {
                        // Normalize line endings and clean up formatting
                        return block
                            .replace(/\r\n/g, '\n')  // Convert Windows line endings
                            .replace(/\r/g, '\n')    // Convert Mac line endings
                            .trim();
                    });

                if (textBlocks.length > 0) {
                    // Get level metadata
                    const levelMetadata = getLevelMetadata(level);

                    questionSets.push({
                        level: level,
                        type: "verbal",
                        levelTitle: levelMetadata.title,
                        levelDescription: levelMetadata.description,
                        timeframe: levelMetadata.timeframe,
                        questions: textBlocks
                    });

                    console.log(`   Found ${textBlocks.length} text blocks in level ${level}`);
                } else {
                    console.log(`   ⚠️  No valid Hindi content found in text blocks for level ${level}`);
                }
            } else {
                // Original logic for individual words
                console.log(`   Processing as individual words for level ${level}`);

                const words = content.split('\n')
                    .map(word => word.trim())
                    .filter(word => word.length > 0)
                    .filter(word => /[\u0900-\u097F]/.test(word)); // Only Hindi characters

                if (words.length > 0) {
                    // Get level metadata
                    const levelMetadata = getLevelMetadata(level);

                    questionSets.push({
                        level: level,
                        type: "verbal",
                        levelTitle: levelMetadata.title,
                        levelDescription: levelMetadata.description,
                        timeframe: levelMetadata.timeframe,
                        questions: words
                    });

                    console.log(`   Found ${words.length} words/phrases in level ${level}`);
                } else {
                    console.log(`   ⚠️  No valid Hindi content found in level ${level}`);
                }
            }
        } else {
            console.log(`   ⚠️  File not found: level${level}.txt`);
        }
    }

    // Create the simple program structure
    const simpleProgram = {
        programName: "Hindi Reading Assessment Program - Simple Format",
        subject: "Hindi",
        description: "Comprehensive Hindi reading program with progressive difficulty levels using simple JSON format",
        questionSets: questionSets
    };

    // Write to file
    const outputPath = path.join(__dirname, 'simple-hindi-program-import.json');
    fs.writeFileSync(outputPath, JSON.stringify(simpleProgram, null, 2), 'utf8');

    console.log('✅ Successfully generated:', outputPath);
    console.log(`📊 Program contains ${questionSets.length} question sets`);

    const totalQuestions = questionSets.reduce((total, set) => total + set.questions.length, 0);
    console.log(`📝 Total questions: ${totalQuestions}`);

    console.log('\n🎉 Simple format Hindi program JSON generation complete!');
    console.log(`📁 Output file: ${outputPath}`);
    console.log('📋 Next steps:');
    console.log('1. Review the generated JSON file');
    console.log('2. Upload it through the program management interface');
    console.log('3. The questions will be automatically converted and added to the program levels');

    return outputPath;
}

function getLevelMetadata(levelNumber) {
    const levelData = {
        1: {
            title: "Level 1 - Basic Vowels and Consonants",
            description: "Introduction to basic Hindi vowels and consonants",
            timeframe: 2
        },
        2: {
            title: "Level 2 - Two Letter Combinations",
            description: "Learning to read two letter combinations and basic words",
            timeframe: 2
        },
        3: {
            title: "Level 3 - Three Letter Words",
            description: "Reading three letter words and simple vocabulary",
            timeframe: 3
        },
        4: {
            title: "Level 4 - Poetry and Phrases",
            description: "Reading short poems and text passages with proper rhythm",
            timeframe: 3
        },
        5: {
            title: "Level 5 - Basic Matras Part 1",
            description: "Introduction to basic vowel marks (matras)",
            timeframe: 2
        },
        6: {
            title: "Level 6 - Basic Matras Part 2",
            description: "Advanced vowel marks and combinations",
            timeframe: 2
        },
        7: {
            title: "Level 7 - Advanced Matras",
            description: "Complex vowel mark combinations and conjuncts",
            timeframe: 3
        },
        8: {
            title: "Level 8 - Difficult Words",
            description: "Challenging vocabulary and complex word structures",
            timeframe: 2
        },
        9: {
            title: "Level 9 - Story Reading and Comprehension",
            description: "Reading complete stories and poems with understanding",
            timeframe: 4
        },
        10: {
            title: "Level 10 - Advanced Text Formation",
            description: "Creating words from letter combinations and advanced reading",
            timeframe: 3
        }
    };

    return levelData[levelNumber] || {
        title: `Level ${levelNumber}`,
        description: `Level ${levelNumber} reading assessment`,
        timeframe: 2
    };
}

// Run the generator
if (require.main === module) {
    generateSimpleFormatFromData();
}

module.exports = { generateSimpleFormatFromData };