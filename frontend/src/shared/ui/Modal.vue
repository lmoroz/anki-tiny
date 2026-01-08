<script setup>
  import { onMounted, onUnmounted } from 'vue';

  const props = defineProps({
    show: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true,
    },
  });

  const emit = defineEmits(['close']);

  const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
      emit('close');
    }
  };

  const handleEscKey = (event) => {
    if (event.key === 'Escape' && props.show) {
      emit('close');
    }
  };

  onMounted(() => {
    document.addEventListener('keydown', handleEscKey);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscKey);
  });
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="modal-backdrop"
        @click="handleBackdropClick">
        <div
          class="modal-container"
          @click.stop>
          <div class="modal-header">
            <h2
              v-if="title"
              class="modal-title">
              {{ title }}
            </h2>
            <slot
              v-else
              name="header" />
            <button
              class="modal-close"
              @click="emit('close')">
              <i class="bi bi-x-lg" />
            </button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div
            class="modal-footer"
            v-if="$slots.footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--modal-backdrop);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-container {
    background: var(--color-bg-modal);
    backdrop-filter: blur(10px);
    border: 1px solid var(--modal-border);
    border-radius: 16px;
    box-shadow: 0 20px 60px var(--modal-shadow);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--modal-header-border);
  }

  .modal-title {
    font-size: var(--text-section-title-size);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: var(--modal-header-border);
    color: var(--color-text-primary);
  }

  .modal-body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--modal-header-border);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  /* Transitions */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active .modal-container,
  .modal-leave-active .modal-container {
    transition: transform 0.3s ease;
  }

  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: scale(0.9);
  }
</style>
