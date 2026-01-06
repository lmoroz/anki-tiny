<script setup>
  import TitleBar from '@/widgets/title-bar/TitleBar.vue'
</script>

<template>
  <div class="app-container relative bg-[#020617]">
    <div class="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/50 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
    <div class="absolute top-[-10%] right-[-20%] w-[60%] h-[60%] bg-blue-500/50 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
    <div class="absolute bottom-[-20%] left-[10%] right-[10%] h-[60%] bg-blue-600/50 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
    <TitleBar />
    <main class="app-content">
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .app-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
