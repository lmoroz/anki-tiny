import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Composable для подключения к SSE потоку статистики
 * @param onUpdate - callback, вызываемый при получении обновлённых данных
 * @returns {{ isConnected: Ref<boolean>, disconnect: () => void }}
 */
export function useStatsStream(onUpdate) {
  const isConnected = ref(false);
  let eventSource = null;

  const connect = () => {
    if (eventSource) return;

    // Создаём EventSource на SSE endpoint
    eventSource = new EventSource(`${window.__BACKEND_URL__}/api/stats/stream`);

    // Обработка события stats-update
    eventSource.addEventListener('stats-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        // Передаём и courses, и globalStats
        onUpdate(data);
      } catch (error) {
        console.error('[SSE] Failed to parse stats update:', error);
      }
    });

    // Обработка успешного открытия соединения
    eventSource.onopen = () => {
      isConnected.value = true;
      console.log('[SSE] Connected to stats stream');
    };

    // Обработка ошибок (EventSource автоматически переподключается)
    eventSource.onerror = () => {
      isConnected.value = false;
      console.warn('[SSE] Connection error, will auto-reconnect');
    };
  };

  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      isConnected.value = false;
      console.log('[SSE] Disconnected from stats stream');
    }
  };

  onMounted(connect);
  onUnmounted(disconnect);

  return { isConnected, disconnect };
}
