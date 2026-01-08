import { onMounted, onUnmounted, ref } from 'vue';

export default function useScrollAndHighlight() {
  const showTopFade = ref(false);
  const showBottomFade = ref(true);
  let scrollContainer = null;

  const scrollTo = (card, container) => {
    // Вычисляем позицию карточки относительно контейнера
    const cardRect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Текущий скролл контейнера
    const currentScroll = container.scrollTop;

    // Вычисляем смещение
    const offset = cardRect.top - containerRect.top;

    // Скроллим только контейнер
    container.scrollTo({
      top: currentScroll + offset,
      behavior: 'smooth',
    });
  };

  const highlight = (el = null, className = 'anim-bounce-in-bck', delay = 0) => {
    if (!el) return;
    setTimeout(() => {
      el.classList.add(className);

      el.addEventListener(
        'animationend',
        () => {
          el.classList.remove(className);
        },
        { once: true }
      );
    }, delay);
  };

  const checkScroll = () => {
    const el = scrollContainer.value;
    if (!el) {
      showTopFade.value = false;
      showBottomFade.value = false;
      return;
    }

    // Порог срабатывания (например, 10px), чтобы не мерцало на границах
    const threshold = 10;

    // Есть ли куда скроллить вверх?
    showTopFade.value = el.scrollTop > threshold;

    // Есть ли куда скроллить вниз?
    // Проверка: (прокрученное + видимое) < (полная высота - порог)
    showBottomFade.value = el.scrollTop + el.clientHeight < el.scrollHeight - threshold;
  };

  const useFades = (el) => {
    scrollContainer = el;

    onMounted(() => {
      const el = scrollContainer.value;
      if (el) {
        el.addEventListener('scroll', checkScroll);
        checkScroll();
      }
    });

    onUnmounted(() => {
      if (scrollContainer.value) {
        scrollContainer.value.removeEventListener('scroll', checkScroll);
      }
    });
  };

  return { scrollTo, highlight, useFades, showTopFade, showBottomFade };
}
