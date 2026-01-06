<script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const isMaximized = ref(false)

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleToggleMaximize = () => {
    window.electronAPI?.toggleMaximize()
    isMaximized.value = !isMaximized.value
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  const handleOpenSettings = () => {
    router.push('/settings')
  }

  onMounted(() => {
    console.log('[TitleBar] Mounted')
  })
</script>

<template>
  <div class="title-bar">
    <div class="title-bar-drag-area">
      <div class="title-bar-icon">
        <i class="bi bi-journal-bookmark-fill" />
      </div>
      <div class="title-bar-title">Repetitio</div>
    </div>
    <button
      class="settings-btn"
      @click="handleOpenSettings"
      title="Настройки">
      <i class="bi bi-gear" />
    </button>
    <div class="title-bar-controls">
      <button
        class="title-bar-btn minimize-btn"
        @click="handleMinimize"
        title="Свернуть">
        <i class="bi bi-dash-lg" />
      </button>
      <button
        class="title-bar-btn maximize-btn"
        @click="handleToggleMaximize"
        :title="isMaximized ? 'Восстановить' : 'Развернуть'">
        <i :class="isMaximized ? 'bi bi-window-stack' : 'bi bi-square'" />
      </button>
      <button
        class="title-bar-btn close-btn"
        @click="handleClose"
        title="Закрыть">
        <i class="bi bi-x-lg" />
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
    background: var(--color-title);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--color-border);
    -webkit-app-region: drag;
    user-select: none;
    z-index: 1000;
    -webkit-user-select: none;
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
    color: var(--color-text-primary);
  }

  .title-bar-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
    user-select: none;
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
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
  }

  .title-bar-btn:hover {
    background: var(--action-btn-bg-hover);
  }

  .title-bar-btn:active {
    background: var(--action-btn-bg);
    color: var(--action-btn-text);
  }

  .close-btn:hover {
    background: var(--color-danger);
    color: #fff;
  }

  .close-btn:active {
    background: var(--btn-danger-bg-hover);
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

  .settings-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
    -webkit-app-region: no-drag;
    margin-right: 8px;
  }

  .settings-btn:hover {
    background: var(--action-btn-bg-hover);
    color: var(--color-primary);
  }

  .settings-btn:active {
    background: var(--action-btn-bg);
    color: var(--color-primary-hover);
  }
</style>
