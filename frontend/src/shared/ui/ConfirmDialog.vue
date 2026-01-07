<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  title: String,
  message: String,
  confirmText: String,
  cancelText: String,
  resolve: Function,
  close: Function,
})

const isOpen = ref(false)

onMounted(() => {
  isOpen.value = true
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})

const handleEscape = (event) => {
  if (event.key === 'Escape') handleCancel()
}

const handleConfirm = () => {
  props.resolve(true)
  closeModal()
}

const handleCancel = () => {
  props.resolve(false)
  closeModal()
}

const closeModal = () => {
  isOpen.value = false
  setTimeout(props.close, 300)
}
</script>

<template>
  <div
    v-if="isOpen"
    role="dialog"
    aria-modal="true" 
    class="modal-backdrop"
    @click="handleCancel">
    <div class="modal-content" @click.stop>
      <h3 id="dialog-title" class="modal-title">{{ title }}</h3>
      <p id="dialog-message" class="modal-message">{{ message }}</p>
      <div class="modal-actions">
        <button 
          @click="handleCancel" 
          class="btn-secondary">
          {{ cancelText || 'Нет' }}
        </button>
        <button 
          @click="handleConfirm" 
          class="btn-primary">
          {{ confirmText || 'Да' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--modal-backdrop);
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: var(--color-bg-modal);
  color: var(--color-text-primary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 24rem;
  max-width: 90vw;
  animation: slideIn 0.3s ease;
  border: 1px solid var(--modal-border);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-text-primary);
}

.modal-message {
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  line-height: 1.5;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: var(--text-body-md-size);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--btn-primary-gradient-from) 0%, var(--btn-primary-gradient-to) 100%);
  color: white;
  box-shadow: 0 2px 4px var(--btn-primary-shadow);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px var(--btn-primary-shadow);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  box-shadow: 0 1px 2px var(--btn-secondary-shadow);
}

.btn-secondary:hover {
  background: var(--action-btn-bg-hover);
  box-shadow: 0 2px 4px var(--btn-secondary-shadow-hover);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
