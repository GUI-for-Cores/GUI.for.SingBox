import { type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Overview',
    component: () => import('@/views/HomeView/index.vue'),
    meta: {
      name: 'router.overview',
      icon: 'overview',
    },
  },
  {
    path: '/profiles',
    name: 'Profiles',
    component: () => import('@/views/ProfilesView/index.vue'),
    meta: {
      name: 'router.profiles',
      icon: 'profiles',
    },
  },
  {
    path: '/subscriptions',
    name: 'Subscriptions',
    component: () => import('@/views/SubscribesView/index.vue'),
    meta: {
      name: 'router.subscriptions',
      icon: 'subscriptions',
    },
  },
  {
    path: '/rulesets',
    name: 'Rulesets',
    component: () => import('@/views/RulesetsView/index.vue'),
    meta: {
      name: 'router.rulesets',
      icon: 'rulesets',
    },
  },
  {
    path: '/plugins',
    name: 'Plugins',
    component: () => import('@/views/PluginsView/index.vue'),
    meta: {
      name: 'router.plugins',
      icon: 'plugins',
    },
  },
  {
    path: '/scheduledtasks',
    name: 'ScheduledTasks',
    component: () => import('@/views/ScheduledTasksView/index.vue'),
    meta: {
      name: 'router.scheduledtasks',
      icon: 'scheduledTasks',
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/SettingsView/index.vue'),
    meta: {
      name: 'router.settings',
      icon: 'settings2',
      hidden: false,
    },
  },
]

export default routes
