---
trigger: always_on
---

# JavaScript / TypeScript Code Formatting Rules

## Общие правила

1. **Отступы**: всегда использовать 2 пробела (согласно `.editorconfig`)
2. **Перевод строки**: Unix-style (LF)
3. **Кодировка**: UTF-8
4. **Trailing whitespace**: удалять
5. **Финальный перевод строки**: обязателен в конце файла

## Условные конструкции (`if / else if / else`)

### 1. Стиль скобок

- Открывающая фигурная скобка `{` всегда находится **на той же строке**, что и `if / else if / else`
- `else` и `else if` всегда пишутся **на новой строке**, а не в одной строке с закрывающей скобкой

**✅ Правильно:**

```ts
if (condition) {
  doSomething1();
  doSomething2();
} else {
  doSomethingElse1();
  doSomethingElse2();
}

if (condition) {
  doSomething();
} else if (anotherCondition) {
  doAnotherThing();
} else {
  doDefaultThing();
}
```

**❌ Неправильно:**

```ts
if (condition) {
  doSomething();
} else {
  doSomethingElse();
}
```

### 2. Одиночные statements

- Если тело условия содержит ровно один statement, фигурные скобки НЕ используются

- Такой if / else / else if пишется в одну строку

**✅ Правильно:**

```ts
if (condition) doSomething();

if (condition) doSomething();
else doSomethingElse();

if (condition) doOneThing();
else if (anotherCondition) doAnotherThing();
else doDefaultThing();
```

**❌ Неправильно:**

```ts
if (condition) {
  doSomething();
}

if (condition) {
  doSomething();
} else {
  doSomethingElse();
}
```

### 3. Несколько statements

- Если внутри условия больше одного statement — фигурные скобки ОБЯЗАТЕЛЬНЫ
- Открывающая скобка { остаётся на той же строке

**✅ Правильно:**

```ts
if (condition) {
  doFirstThing();
  doSecondThing();
} else doOneThing();
```

### 4. Вложенные условия

- Вложенные if с одним statement могут быть без скобок
- Если внутри вложенного условия появляется более одного statement — используются скобки

**✅ Правильно:**

```ts
if (outerCondition) {
  if (innerCondition) doSomething();
  else doSomethingElse();
} else doDefaultThing();
```

### 5. Сложные выражения

- Если тело условия содержит:
  - объекты
  - массивы
  - многострочные выражения
    → фигурные скобки ОБЯЗАТЕЛЬНЫ, даже если это формально один statement

**✅ Правильно:**

```ts
if (condition) {
  const result = {
    key1: "value1",
    key2: "value2",
  };
}
```

## Применение

- Эти правила ОБЯЗАТЕЛЬНЫ для всего JavaScript и TypeScript кода в проекте
- Нарушение правил считается ошибкой генерации кода
