import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home/Home.vue'
import QA from '../pages/QA.vue'
import Dev from '../pages/Dev.vue'
import CV from '../pages/CV.vue'
import Others from '../pages/Others.vue'
import Admin from '../pages/Admin.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/qa',
    name: 'QA',
    component: QA
  },
  {
    path: '/dev',
    name: 'Dev',
    component: Dev
  },
  {
    path: '/cv',
    name: 'CV',
    component: CV
  },
  {
    path: '/others',
    name: 'Others',
    component: Others
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router