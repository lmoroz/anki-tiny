---
trigger: always_on
---

# Vite Import & Components Rule

## Vue-file preference structure rule

Always place `<script setup>` block over `<template>` block in .vue files

## Aliases

- В проекте настроен alias `@` в `vite.config.js`.
- **ЗАПРЕЩЕНО** использовать относительные импорты вида `../` и `./` для модулей, находящихся внутри `src`.
- **ОБЯЗАТЕЛЬНО** использовать alias `@` для всех импортов из `src`.

Примеры:

- ❌ `import Foo from '../components/Foo.vue'`
- ✅ `import Foo from '@/components/Foo.vue'`

## Vue Components

- В проекте подключён `unplugin-vue-components`.
- **ЗАПРЕЩЕНО** вручную импортировать Vue-компоненты приложения в `.vue` файлах.
- Компоненты считаются автоматически доступными по имени.
- Импорты допустимы **только** для:
  - composables
  - утилит
  - внешних библиотек

Примеры:

- ❌ `import BaseButton from '@/components/BaseButton.vue'`
- ✅ `<BaseButton />` без импорта

## Enforcement

- Перед добавлением импорта:
  1. Проверяй, находится ли файл внутри `src`.
  2. Если да — используй `@`.
  3. Если это Vue-компонент приложения — **не добавляй импорт**.
