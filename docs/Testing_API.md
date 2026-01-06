# API Testing Instructions

## How to run the application

```bash
cd backend
npm run electron:dev
```

After launch, open DevTools: **F12** or **Ctrl+Shift+I**

---

## Chrome DevTools Console Commands

### 1. Get backend port

```javascript
// The port will be output in logs or can be retrieved from window
// Usually dynamic port, check logs on startup
const PORT = 3000; // Replace with actual port from logs
```

### 2. Create a course

```javascript
fetch(`http://localhost:${PORT}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'JavaScript for Beginners',
        description: 'JavaScript basics and ES6+'
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Course created:', data);
        return data;
    });
```

**Expected result:**

```json
{
  "id": 1,
  "name": "JavaScript for Beginners",
  "description": "JavaScript basics and ES6+",
  "createdAt": "2026-01-05 15:57:00",
  "updatedAt": "2026-01-05 15:57:00"
}
```

### 3. Get all courses

```javascript
fetch(`http://localhost:${PORT}/api/courses`)
    .then(r => r.json())
    .then(courses => {
        console.log('✅ All courses:', courses);
        console.table(courses);
    });
```

### 4. Get course by ID

```javascript
const courseId = 1; // ID from previous step
fetch(`http://localhost:${PORT}/api/courses/${courseId}`)
    .then(r => r.json())
    .then(course => {
        console.log('✅ Course #' + courseId + ':', course);
    });
```

### 5. Update course

```javascript
const courseId = 1;
fetch(`http://localhost:${PORT}/api/courses/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'JavaScript: Advanced Level',
        description: 'ES6+, async/await, promises'
    })
})
    .then(r => r.json())
    .then(course => {
        console.log('✅ Course updated:', course);
    });
```

### 6. Delete course

```javascript
const courseId = 1;
fetch(`http://localhost:${PORT}/api/courses/${courseId}`, {
    method: 'DELETE'
})
    .then(r => r.json())
    .then(result => {
        console.log('✅ Course deleted:', result);
    });
```

### 7. Validation check (error)

```javascript
// Try to create course without required 'name' field
fetch(`http://localhost:${PORT}/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'No title' })
})
    .then(r => r.json())
    .then(error => {
        console.log('❌ Expected validation error:', error);
    });
```

**Expected result:**

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "message": "Course name is required",
      "path": [
        "name"
      ]
    }
  ]
}
```

---

## Full Test Scenario

```javascript
// Copy the entire block into Console
(async () => {
    const PORT = 3000; // Specify actual port
    const baseUrl = `http://localhost:${PORT}/api/courses`;

    console.log('🚀 Starting Courses API testing...\n');

    // 1. Create course
    console.log('1️⃣ Creating course...');
    const created = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Test', description: 'Description' })
    }).then(r => r.json());
    console.log('✅ Created:', created);

    // 2. Get all courses
    console.log('\n2️⃣ Getting all courses...');
    const all = await fetch(baseUrl).then(r => r.json());
    console.log('✅ Total courses:', all.length);
    console.table(all);

    // 3. Get course by ID
    console.log('\n3️⃣ Getting course by ID...');
    const one = await fetch(`${baseUrl}/${created.id}`).then(r => r.json());
    console.log('✅ Course:', one);

    // 4. Update course
    console.log('\n4️⃣ Updating course...');
    const updated = await fetch(`${baseUrl}/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'API Test (Updated)' })
    }).then(r => r.json());
    console.log('✅ Updated:', updated);

    // 5. Delete course
    console.log('\n5️⃣ Deleting course...');
    const deleted = await fetch(`${baseUrl}/${created.id}`, {
        method: 'DELETE'
    }).then(r => r.json());
    console.log('✅ Deleted:', deleted);

    // 6. Deletion check
    console.log('\n6️⃣ Checking deletion...');
    const check = await fetch(baseUrl).then(r => r.json());
    console.log('✅ Courses remaining:', check.length);

    console.log('\n🎉 Testing completed successfully!');
})();
```

---

## Persistence Check

1. Create several courses.
2. Close application (**Ctrl+Q** or Close button).
3. Start again: `npm run electron:dev`.
4. Execute `GET /api/courses`.
5. **Expected**: all created courses are present.

---

## Database Location

**Windows**: `%APPDATA%\Repetitio\repetitio.db`  
**macOS**: `~/Library/Application Support/Repetitio/repetitio.db`  
**Linux**: `~/.config/Repetitio/repetitio.db`

Can be opened via [DB Browser for SQLite](https://sqlitebrowser.org/) to view tables.
