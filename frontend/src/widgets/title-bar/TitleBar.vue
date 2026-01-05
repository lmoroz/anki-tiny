<script setup>
import { ref, onMounted } from 'vue';

const isMaximized = ref(false);

const handleMinimize = () => {
  window.electronAPI?.minimize();
};

const handleToggleMaximize = () => {
  window.electronAPI?.toggleMaximize();
  isMaximized.value = !isMaximized.value;
};

const handleClose = () => {
  window.electronAPI?.close();
};

onMounted(() => {
  console.log('[TitleBar] Mounted');
});
</script>

<template>
  <div class="title-bar">
    <div class="title-bar-drag-area">
      <div class="title-bar-icon">
        <i class="bi bi-journal-bookmark-fill"/>
      </div>
      <div class="title-bar-title">Repetitio</div>
    </div>
    <div class="title-bar-controls">
      <button 
        class="title-bar-btn minimize-btn" 
        @click="handleMinimize"
        title="Свернуть"
      >
        <i class="bi bi-dash-lg"/>
      </button>
      <button 
        class="title-bar-btn maximize-btn" 
        @click="handleToggleMaximize"
        :title="isMaximized ? 'Восстановить' : 'Развернуть'"
      >
        <i :class="isMaximized ? 'bi bi-window-stack' : 'bi bi-square'"/>
      </button>
      <button 
        class="title-bar-btn close-btn" 
        @click="handleClose"
        title="Закрыть"
      >
        <i class="bi bi-x-lg"/>
      </button>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 36px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  -webkit-app-region: drag;
  user-select: none;
  z-index: 1000;
}

.title-bar-drag-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  flex: 1;
}

.title-bar-icon {
  font-size: 16px;
  color: #60a5fa;
}

.title-bar-title {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.title-bar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.title-bar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 36px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 14px;
}

.title-bar-btn:hover {
  background: rgba(148, 163, 184, 0.15);
}

.title-bar-btn:active {
  background: rgba(148, 163, 184, 0.25);
}

.close-btn:hover {
  background: #dc2626;
  color: #fff;
}

.close-btn:active {
  background: #b91c1c;
}

.minimize-btn i {
  font-size: 12px;
}

.maximize-btn i {
  font-size: 11px;
}

.close-btn i {
  font-size: 13px;
}
</style>
