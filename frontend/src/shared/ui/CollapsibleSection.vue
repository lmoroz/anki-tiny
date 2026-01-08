<script setup>
  import { ref, onMounted, watch } from 'vue';

  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    defaultExpanded: {
      type: Boolean,
      default: true,
    },
  });

  const isExpanded = ref(props.defaultExpanded);

  onMounted(() => {
    const savedState = localStorage.getItem(props.storageKey);
    if (savedState !== null) isExpanded.value = savedState === 'true';
  });

  watch(isExpanded, (newValue) => {
    localStorage.setItem(props.storageKey, String(newValue));
  });

  function toggle() {
    isExpanded.value = !isExpanded.value;
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<template>
  <div class="collapsible-section">
    <div
      class="section-header"
      role="button"
      tabindex="0"
      :aria-expanded="isExpanded"
      @click="toggle"
      @keydown="handleKeydown">
      <i
        class="bi"
        :class="isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'" />
      <h3>{{ title }}</h3>
    </div>

    <div
      v-show="isExpanded"
      class="section-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
  .collapsible-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: background-color 0.2s;
  }

  .section-header:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .section-header:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .section-header i {
    font-size: 16px;
    color: var(--color-text-secondary);
    transition: transform 0.2s;
  }

  .section-header h3 {
    font-size: var(--text-section-title-size);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-left: 32px;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
