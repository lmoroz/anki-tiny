import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/home/HomePage.vue'),
    meta: { title: 'Главная' }
  },
  {
    path: '/course/:id',
    name: 'course',
    component: () => import('@/pages/course/CoursePage.vue'),
    meta: { title: 'Курс' }
  },
  {
    path: '/training/:id',
    name: 'training',
    component: () => import('@/pages/training/TrainingPage.vue'),
    meta: { title: 'Тренировка' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/settings/SettingsPage.vue'),
    meta: { title: 'Настройки' }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.afterEach((to) => {
  document.title = `Anki Tiny - ${to.meta.title || 'Приложение'}`;
});

export default router;
