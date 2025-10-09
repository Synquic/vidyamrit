const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vidyamrit', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define the exact same schema as in our model
const TimeframeUnit = {
    WEEKS: 'weeks',
    MONTHS: 'months',
};

const ProgramLevelSchema = new mongoose.Schema(
    {
        levelNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        timeframe: {
            type: Number,
            required: true,
            min: 1,
        },
        timeframeUnit: {
            type: String,
            enum: Object.values(TimeframeUnit),
            default: TimeframeUnit.WEEKS,
        },
        prerequisites: [
            {
                type: Number,
                min: 1,
            },
        ],
    },
    {
        _id: false,
    }
);

const ProgramSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
            unique: true,
        },
        subject: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        totalLevels: {
            type: Number,
            required: true,
            min: 1,
            max: 50,
        },
        levels: {
            type: [ProgramLevelSchema],
            validate: {
                validator: function (levels) {
                    console.log('=== VALIDATION START ===');
                    console.log('this.totalLevels:', this.totalLevels);
                    console.log('levels.length:', levels.length);
                    console.log('levels:', JSON.stringify(levels, null, 2));

                    // Validate that levels array length matches totalLevels
                    if (levels.length !== this.totalLevels) {
                        console.log(`Length validation FAILED: ${levels.length} !== ${this.totalLevels}`);
                        return false;
                    }
                    console.log('Length validation PASSED');

                    // Validate that level numbers are sequential starting from 1
                    const levelNumbers = levels
                        .map((l) => l.levelNumber)
                        .sort((a, b) => a - b);
                    console.log('levelNumbers:', levelNumbers);

                    for (let i = 0; i < levelNumbers.length; i++) {
                        if (levelNumbers[i] !== i + 1) {
                            console.log(`Sequential validation FAILED at index ${i}: expected ${i + 1}, got ${levelNumbers[i]}`);
                            return false;
                        }
                    }
                    console.log('Sequential validation PASSED');

                    // Validate prerequisites
                    for (const level of levels) {
                        if (level.prerequisites) {
                            for (const prereq of level.prerequisites) {
                                if (prereq >= level.levelNumber) {
                                    console.log(`Prerequisite validation FAILED: level ${level.levelNumber} has prereq ${prereq}`);
                                    return false;
                                }
                            }
                        }
                    }
                    console.log('Prerequisite validation PASSED');

                    console.log('=== VALIDATION PASSED ===');
                    return true;
                },
                message: "Invalid levels configuration",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Program = mongoose.model('TestProgram', ProgramSchema);

// Test data
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
    ],
    "createdBy": new mongoose.Types.ObjectId("507f1f77bcf86cd799439011")
};

async function testValidation() {
    try {
        console.log('Creating program...');

        const program = new Program(testData);
        await program.save();

        console.log('Program created successfully!');
        console.log('Program ID:', program._id);

        // Clean up
        await Program.deleteOne({ _id: program._id });
        console.log('Test program deleted');

    } catch (error) {
        console.error('Validation error:', error.message);
        if (error.errors) {
            console.error('Detailed errors:', Object.values(error.errors).map(err => err.message));
        }
    } finally {
        mongoose.connection.close();
    }
}

testValidation();