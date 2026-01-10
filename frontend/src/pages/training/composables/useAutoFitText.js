import { ref, nextTick, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { textFit } from './textFit.js';

const options = {
  minFontSize: 12,
  maxFontSize: 100,
};

export default function useAutoFitText(containerRef, contentRef, textSource) {
  // Флаг, чтобы не запускать расчеты внахлест (опционально, но полезно для async)
  let isCalculating = false;

  const fontSize = ref(options.maxFontSize);

  const awaitReflow = async () => {
    await nextTick();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  };

  const performAdjustmentWithTextFit = async (...args) => {
    if (isCalculating) return;
    isCalculating = true;
    console.log('%cadjustFontSize', 'color: yellow', ...args);
    const container = containerRef.value;
    const content = contentRef.value;

    if (!container || !content || !container.clientHeight) return;
    fontSize.value = textFit(content, options);
    isCalculating = false;
  };
  // Функция подгона размера
  const adjustFontSize = useDebounceFn(performAdjustmentWithTextFit, 100);

  //ResizeObserver на случай изменения размера окна браузера
  const observer = new ResizeObserver(adjustFontSize);
  observer.observe(containerRef.value);

  const stopWatchText = watch(textSource, adjustFontSize, { flush: 'post' });

  const unlink = () => {
    if (observer) observer.disconnect();
    if (stopWatchText) stopWatchText();
  };

  return {
    containerRef,
    contentRef,
    fontSize,
    unlink,
  };
}
