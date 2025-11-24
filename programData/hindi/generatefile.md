# 📖 **Complete Guide: Creating Questions from Scratch to Import**

## **Your Generated File and Import Process**

### **Your Main Import File** 📁

**File**: `simple-hindi-program-import.json` (in your project root)

- **Location**: `d:\Work\Synquic\vidyamrit\simple-hindi-program-import.json`
- **Contains**: 1,142 questions across 10 levels
- **Format**: Simple JSON format exactly as you requested
- **Ready to Import**: Yes, immediately usable

### **How to Import It** 🚀

1. **Start your backend server** (if not running):

   ```bash
   cd d:\Work\Synquic\vidyamrit\backend
   npm start
   ```

2. **Open your PWA** in browser (usually `http://localhost:3000`)

3. **Navigate to**: Dashboard → Manage Programs

4. **Click**: "Import Program" button (next to "Create Program")

5. **Upload**: Select `simple-hindi-program-import.json` file

6. **Result**: Instant program creation with all 1,142 questions!

---

## **Step 1: Prepare Your Data Files** 📝

### **Option A: Individual Words (Simple)**

Create a text file with one word per line:

```
अ
आ
इ
ई
```

### **Option B: Text Blocks/Poems (Advanced)**

Create a text file with `----------- ` separators:

```
कर मदद रब अब /n
उड़ गए तब भय सब /n
अमन अचकन पहन कर/n
घर चल न ठहर अब /n
-----------
भगवन कर सब पर करम /n
सब वतन बन एक चमन /n
मत लड़-झगड़ कर शरम
हर तरफ बस अब अमन /n
-----------
```

### **File Naming Convention**

- Save as: `level1.txt`, `level2.txt`, etc.
- Place in: `data/` folder in your project root

## **Step 2: Generate JSON Automatically** ⚙️

### **Method 1: Use Auto-Generator (Recommended)**

```bash
cd d:\Work\Synquic\vidyamrit
node generate-simple-hindi-program.js
```

**Output**: Creates `simple-hindi-program-import.json`

### **Method 2: Create JSON Manually**

Create a file with this structure:

```json
{
  "programName": "Your Program Name",
  "subject": "Hindi",
  "description": "Your program description",
  "questionSets": [
    {
      "level": 1,
      "type": "verbal",
      "levelTitle": "Level 1 - Basic Reading",
      "levelDescription": "Introduction to basic Hindi reading",
      "timeframe": 2,
      "questions": ["अ", "आ", "इ"]
    },
    {
      "level": 2,
      "type": "verbal",
      "questions": ["अज", "अट", "अध"]
    }
  ]
}
```

## **Step 3: Question Types** 📚

### **Verbal Questions** (Most Common)

```json
{
  "level": 1,
  "type": "verbal",
  "questions": ["अ", "आ", "इ"]
}
```

**Use**: Reading aloud, pronunciation assessment

### **One Word Answer**

```json
{
  "level": 2,
  "type": "one_word_answer",
  "questions": ["अज", "अट"]
}
```

**Use**: Type the word they hear/see

### **Multiple Choice**

```json
{
  "level": 3,
  "type": "multiple_choice",
  "questions": [
    {
      "questionText": "What sound does 'अ' make?",
      "options": ["a", "aa", "i", "u"],
      "correctAnswer": 0
    }
  ]
}
```

## **Step 4: Import Process** 🔄

### **Frontend Method (Recommended)**

1. Open your web application
2. Go to **Manage Programs**
3. Click **"Import Program"** button
4. **Drag & drop** or **browse** for your JSON file
5. Click **"Import Program"**
6. **Success!** All questions imported instantly

### **Backend API Method (Advanced)**

```bash
curl -X POST http://localhost:5000/api/programs/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@simple-hindi-program-import.json"
```

## **Step 5: File Structure Examples** 📂

### **For Individual Words**

```
data/
├── level1.txt    (अ, आ, इ, ई)
├── level2.txt    (अज, अट, अध)
└── level3.txt    (अकड़, अकबर, अकरम)
```

### **For Text Blocks/Poems**

```
data/
├── level4.txt    (poems with ----------- separators)
├── level9.txt    (stories with ----------- separators)
└── level10.txt   (letter combinations with ----------- separators)
```

## **Step 6: Advanced Features** ⭐

### **Custom Level Metadata**

```json
{
  "level": 1,
  "type": "verbal",
  "levelTitle": "Custom Title",
  "levelDescription": "Custom description",
  "timeframe": 3,
  "questions": ["अ", "आ"]
}
```

### **Mixed Content Types**

You can have multiple question sets for the same level:

```json
"questionSets": [
  {
    "level": 1,
    "type": "verbal",
    "questions": ["अ", "आ"]
  },
  {
    "level": 1,
    "type": "one_word_answer",
    "questions": ["क", "ख"]
  }
]
```

### **Text Block Formatting**

Use `/n` for line breaks that will render properly:

```
कर मदद रब अब /n
उड़ गए तब भय सब /n
अमन अचकन पहन कर/n
```

## **Step 7: Troubleshooting** 🔧

### **Common Issues**

1. **File not found**: Ensure files are in `data/` folder
2. **Invalid JSON**: Use JSON validator online
3. **Import fails**: Check browser console for errors
4. **Missing questions**: Verify Hindi characters are present

### **Validation Rules**

- Program name is required
- Subject is required
- Each level must have at least 1 question
- Question text cannot be empty
- Multiple choice needs 2-4 options

## **Step 8: Quick Start Template** 🚀

### **Minimal Working Example**

```json
{
  "programName": "Quick Test Program",
  "subject": "Hindi",
  "description": "Test program for import",
  "questionSets": [
    {
      "level": 1,
      "type": "verbal",
      "questions": ["अ", "आ", "इ", "ई"]
    }
  ]
}
```

**Save as**: `test-import.json` → **Upload** → **Done!**

---

## **🎯 Summary Workflow**

1. **Create data files** → `level1.txt`, `level2.txt`...
2. **Run generator** → `node generate-simple-hindi-program.js`
3. **Get JSON file** → `simple-hindi-program-import.json`
4. **Upload via web** → Manage Programs → Import Program
5. **Instant success** → All questions imported!

**Time**: From data files to imported program in **under 2 minutes!** ⚡

## **Technical Implementation Details**

### **System Architecture**

- **Frontend**: React PWA with drag-and-drop file upload
- **Backend**: Node.js with Express and Multer for file handling
- **Database**: MongoDB with Mongoose for data persistence
- **Validation**: Comprehensive JSON schema validation
- **Conversion**: Automatic simple-to-full format conversion

### **Supported Formats**

The system supports both:

1. **Simple Format**: Basic JSON with questionSets array
2. **Full Format**: Complete program structure with detailed level configuration

### **File Processing Logic**

- Detects `----------- ` separators for text blocks
- Preserves `/n` line breaks for frontend rendering
- Handles both individual words and complete text passages
- Automatically cleans line endings and formatting

### **Security Features**

- File type validation (JSON only)
- File size limits (10MB max)
- Content validation against schema
- Automatic cleanup on errors
- Authentication required for import
