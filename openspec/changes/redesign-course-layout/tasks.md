# Implementation Tasks: Course Layout Redesign

## Phase 1: Desktop Two-Column Layout

### 1.1 Modify CoursePage.vue Structure
- [ ] Wrap main content в grid container (`.course-page-grid`)
- [ ] Move Course Info block to the left column (`.course-info-section`)
  - Title + description
  - Stats cards
  - Training button
  - QuickAddCard widget
- [ ] Move Cards Section to the right column (`.cards-section`)
  - Section header
  - Create card button
  - CardList component
- [ ] Add responsive grid CSS:
  - Mobile: `grid-template-columns: 1fr`
  - Desktop (≥1024px): `grid-template-columns: 2fr 1fr`
  - Gap: 24px

**Validation**: Open course page on desktop, ensure two columns are visible side by side

---

### 1.2 Add Compact Card Mode
- [ ] Add computed prop `isDesktop` через `useMediaQuery('(min-width: 1024px)')`
- [ ] Pass prop `:compact="isDesktop"` to CardList
- [ ] Pass prop to CardItem
- [ ] Add class `.compact` to CardItem when `props.compact === true`:
  - `min-height: 100px`
  - `font-size: 14px`
  - `.card-text { -webkit-line-clamp: 2 }`
  - Decrease metrics padding

**Validation**: Ensure cards in the right column are compact

---

## Phase 2: Mobile Slide-Out Panel

### 2.1 Add Panel State Management
- [ ] Add `ref(false)` for `isCardsPanelOpen` in CoursePage.vue
- [ ] Create functions `openCardsPanel()` and `closeCardsPanel()`
- [ ] Add `onKeydown` listener for Escape (calls `closeCardsPanel`)

**Validation**: Check that state is managed correctly in devtools

---

### 2.2 Create Floating Action Button (FAB)
- [ ] Add FAB component (can be inline in CoursePage.vue):
  - Text: "Показать карточки ({{ cards.length }})"
  - Icon: `bi-list-ul`
  - Styles: fixed position, right: 24px, bottom: 24px
  - `@click="openCardsPanel"`
- [ ] Show FAB only on mobile (`v-if="!isDesktop"`)
- [ ] Скрывать FAB когда панель открыта (`v-if="!isDesktop && !isCardsPanelOpen"`)

**Validation**: На mobile видна FAB внизу справа, при клике панель должна открываться

---

### 2.3 Create Slide-Out Panel
- [ ] Add panel structure:
  ```vue
  <div v-if="showCardsPanel" class="cards-panel-container">
    <div class="panel-backdrop" @click="closeCardsPanel" />
    <div class="cards-panel">
      <div class="panel-header">
        <h2>Карточки</h2>
        <button @click="closeCardsPanel" aria-label="Закрыть">
          <i class="bi bi-x-lg" />
        </button>
      </div>
      <div class="panel-content">
        <Button @click="handleCreateCard">Создать карточку</Button>
        <CardList :cards="cards" ... />
      </div>
    </div>
  </div>
  ```
- [ ] Add styles:
  - `.cards-panel`: fixed, right 0, transform: translateX(100%), transition, 85% width on tablet (max-width 400px) and 100% on mobile
  - `.cards-panel.open`: transform: translateX(0)
  - `.panel-backdrop`: fixed inset, bg rgba(0,0,0,0.5), backdrop-filter: blur(4px)
- [ ] Add transition through dynamic class binding (`:class="{ open: isCardsPanelOpen }"`)
- [ ] Add `overflow: hidden` on body when panel is open

**Validation**: On mobile, the panel slides in from the right when FAB is clicked, backdrop darkens the background, and scrolling works within the panel

---

### 2.4 Implement Focus Trap
- [ ] Install `@vueuse/core` (if not already installed)
- [ ] Use `useFocusTrap` on `.cards-panel` ref
- [ ] Activate trap when `isCardsPanelOpen === true`
- [ ] Deactivate and return focus to FAB on close

**Validation**: Tab navigation cycles inside the panel, focus returns to FAB on close

---

## Phase 3: Enhanced Card Statistics

### 3.1 Add FSRS Metrics Display (CardItem.vue)
- [ ] Add section `.card-stats` to `card-footer` (front side):
  ```vue
  <div class="card-stats">
    <span class="stat-item" title="Stability">
      <i class="bi bi-graph-up" aria-label="Stability" />
      {{ card.stability.toFixed(1) }}
    </span>
    <span class="stat-item" title="Сложность карточки">
      <i class="bi bi-speedometer2" aria-label="Сложность" />
      {{ card.difficulty.toFixed(1) }}
    </span>
    <span class="stat-item" title="Количество повторений">
      <i class="bi bi-arrow-repeat" aria-label="Повторений" />
      {{ card.reps }}
    </span>
    <span class="stat-item" title="Количество ошибок">
      <i class="bi bi-x-circle" aria-label="Ошибок" />
      {{ card.lapses }}
    </span>
  </div>
  ```
- [ ] Add styles:
  - `.card-stats`: flex, gap: 12px, flex-wrap, margin-top: 8px
  - `.stat-item`: font-size: 12px, color: text-secondary, display: flex, align-items: center, gap: 4px
  - `.stat-item i`: font-size: 14px

**Validation**: 4 metrics are displayed on card

---

### 3.2 Add Timestamps Display
- [ ] Add section `.card-timestamps` after `.card-stats`:
  ```vue
  <div class="card-timestamps">
    <span class="timestamp-item">
      <i class="bi bi-calendar3" aria-label="Следующее повторение" />
      Следующее: {{ formatDate(card.due) }}
    </span>
    <span v-if="card.lastReview" class="timestamp-item">
      <i class="bi bi-clock-history" aria-label="Последнее повторение" />
      Last review: {{ formatRelativeTime(card.lastReview) }}
    </span>
    <span class="timestamp-item">
      <i class="bi bi-plus-circle" aria-label="Дата создания" />
      Created: {{ formatDate(card.createdAt) }}
    </span>
  </div>
  ```
- [ ] Implement helper functions:
  - `formatDate(dateString)` — already exists, reuse
  - `formatRelativeTime(dateString)` — "Today", "Yesterday", "N days ago"
- [ ] Add styles:
  - `.card-timestamps`: flex-direction: column, gap: 4px, font-size: 12px, margin-top: 8px

**Validation**: Timestamps are displayed on card

---

### 3.3 Implement Tooltips
- [ ] Ensure `title` attribute is used on all icons (already added in 3.1-3.2)
- [ ] Optionally: add custom tooltip component for more controlled display
- [ ] Test hover on desktop

**Validation**: Tooltips are displayed on hover

---

## Phase 4: Accessibility Enhancements

### 4.1 Add ARIA Labels
- [ ] FAB: `aria-label="Show card list"`
- [ ] Close button in panel: `aria-label="Close card panel"`
- [ ] All statistics icons: `aria-label` with full metric name

**Validation**: Screen reader correctly announces elements

---

### 4.2 Keyboard Navigation
- [ ] Ensure Escape closes panel (`onKeydown` in 2.1)
- [ ] Focus trap works (from 2.4)
- [ ] Tab order is logical: FAB → (panel open) → close button → create card → cards

**Validation**: Navigation with keyboard works without mouse

---

## Phase 5: Testing \u0026 Verification

### 5.1 Responsive Testing
- [ ] **Desktop (1920x1080)**:
  - Two columns are visible side by side
  - Cards are in compact mode
  - All metrics are readable
- [ ] **Tablet (768x1024)**:
  - One column, FAB is visible
  - Panel opens smoothly
  - Backdrop works
- [ ] **Mobile (375x667)**:
  - All elements fit
  - Panel is not wider than 85% viewport
  - Scroll works

**Validation**: Тестирование в DevTools responsive mode + реальные устройства

---

### 5.2 Functional Testing
- [ ] QuickAddCard works in both modes
- [ ] Card editing works (from CardItem)
- [ ] Card deletion works
- [ ] State badges are correct
- [ ] New statistics updates after review (integration with Training page)

**Validation**: Полный цикл работы с карточками

---

### 5.3 Performance Testing
- [ ] Measure time to render for list of 50 cards
- [ ] Ensure transitions are hardware-accelerated (check in DevTools Performance)
- [ ] Check for memory leaks on panel open/close

**Validation**: No performance regressions

---

## Phase 6: Documentation

### 6.1 Update Changelog
- [ ] Add entry to `docs/Changelog.md`:
  - New two-column layout on desktop
  - Slide-out panel on mobile
  - Expanded card statistics (8 metrics)

**Validation**: Changelog is up to date

---

### 6.2 Create Walkthrough
- [ ] Create `docs/Walkthrough.md` or update existing
- [ ] Screenshots:
  - Desktop two-column layout
  - Mobile panel (opened and closed)
  - Example card with new statistics
- [ ] Describe key changes and how to use them

**Validation**: Walkthrough is clear for new users

---

## Dependencies Between Tasks

```
1.1 → 1.2 (need grid for compact mode)
2.1 → 2.2 → 2.3 → 2.4 (sequential panel implementation)
3.1 → 3.2 → 3.3 (statistics built step by step)
Phase 1-3 → Phase 4 (accessibility after main features)
Phase 1-4 → Phase 5 (testing after implementation)
Phase 5 → Phase 6 (documentation after verification)
```

## Estimated Effort

- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 1 hour
- **Phase 5**: 2-3 hours
- **Phase 6**: 1 hour

**Total**: ~11-17 hours (with debugging and iterations)
