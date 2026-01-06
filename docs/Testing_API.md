# Инструкции для тестирования API

## Как запустить приложение

```bash
cd backend
npm run electron:dev
```

После запуска откройте DevTools: **F12** или **Ctrl+Shift+I**

---

## Тестовые команды для DevTools Console

### 1. Узнать порт backend

```javascript
// Порт будет выведен в логах или можно получить из window
// Обычно это динамический порт, смотрите в логи при запуске
const PORT = 3000; // Замените на актуальный порт из логов
```

### 2. Создать курс

```javascript
fetch(`http://localhost:${ PORT }/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
                             name: 'JavaScript для начинающих',
                             description: 'Основы JavaScript и ES6+'
                         })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Создан курс:', data);
        return data;
    });
```

**Ожидаемый результат:**

```json
{
  "id": 1,
  "name": "JavaScript для начинающих",
  "description": "Основы JavaScript и ES6+",
  "createdAt": "2026-01-05 15:57:00",
  "updatedAt": "2026-01-05 15:57:00"
}
```

### 3. Получить все курсы

```javascript
fetch(`http://localhost:${ PORT }/api/courses`)
    .then(r => r.json())
    .then(courses => {
        console.log('✅ Все курсы:', courses);
        console.table(courses);
    });
```

### 4. Получить курс по ID

```javascript
const courseId = 1; // ID из предыдущего шага
fetch(`http://localhost:${ PORT }/api/courses/${ courseId }`)
    .then(r => r.json())
    .then(course => {
        console.log('✅ Курс #' + courseId + ':', course);
    });
```

### 5. Обновить курс

```javascript
const courseId = 1;
fetch(`http://localhost:${ PORT }/api/courses/${ courseId }`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
                             name: 'JavaScript: Продвинутый уровень',
                             description: 'ES6+, async/await, promises'
                         })
})
    .then(r => r.json())
    .then(course => {
        console.log('✅ Курс обновлен:', course);
    });
```

### 6. Удалить курс

```javascript
const courseId = 1;
fetch(`http://localhost:${ PORT }/api/courses/${ courseId }`, {
    method: 'DELETE'
})
    .then(r => r.json())
    .then(result => {
        console.log('✅ Курс удален:', result);
    });
```

### 7. Проверка валидации (ошибка)

```javascript
// Попробуем создать курс без обязательного поля name
fetch(`http://localhost:${ PORT }/api/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Без названия' })
})
    .then(r => r.json())
    .then(error => {
        console.log('❌ Ожидаемая ошибка валидации:', error);
    });
```

**Ожидаемый результат:**

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

## Полный тестовый сценарий

```javascript
// Скопируйте весь блок в Console
( async () => {
    const PORT = 3000; // Укажите актуальный порт
    const baseUrl = `http://localhost:${ PORT }/api/courses`;

    console.log('🚀 Начинаем тестирование Courses API...\n');

    // 1. Создать курс
    console.log('1️⃣ Создание курса...');
    const created = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Тест API', description: 'Описание' })
    }).then(r => r.json());
    console.log('✅ Создан:', created);

    // 2. Получить все курсы
    console.log('\n2️⃣ Получение всех курсов...');
    const all = await fetch(baseUrl).then(r => r.json());
    console.log('✅ Всего курсов:', all.length);
    console.table(all);

    // 3. Получить курс по ID
    console.log('\n3️⃣ Получение курса по ID...');
    const one = await fetch(`${ baseUrl }/${ created.id }`).then(r => r.json());
    console.log('✅ Курс:', one);

    // 4. Обновить курс
    console.log('\n4️⃣ Обновление курса...');
    const updated = await fetch(`${ baseUrl }/${ created.id }`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Тест API (обновлен)' })
    }).then(r => r.json());
    console.log('✅ Обновлен:', updated);

    // 5. Удалить курс
    console.log('\n5️⃣ Удаление курса...');
    const deleted = await fetch(`${ baseUrl }/${ created.id }`, {
        method: 'DELETE'
    }).then(r => r.json());
    console.log('✅ Удален:', deleted);

    // 6. Проверка удаления
    console.log('\n6️⃣ Проверка, что курс удален...');
    const check = await fetch(baseUrl).then(r => r.json());
    console.log('✅ Осталось курсов:', check.length);

    console.log('\n🎉 Тестирование завершено успешно!');
} )();
```

---

## Проверка персистентности

1. Создайте несколько курсов
2. Закройте приложение (**Ctrl+Q** или кнопка Close)
3. Запустите снова: `npm run electron:dev`
4. Выполните `GET /api/courses`
5. **Ожидается**: все созданные курсы присутствуют

---

## Расположение базы данных

**Windows**: `%APPDATA%\AnkiTiny\anki.db`  
**macOS**: `~/Library/Application Support/AnkiTiny/anki.db`  
**Linux**: `~/.config/AnkiTiny/anki.db`

Можно открыть через [DB Browser for SQLite](https://sqlitebrowser.org/) для просмотра таблиц.
