import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home/Home.vue'
import QA from '../pages/Qa/Qa.vue'
import Dev from '../pages/Dev/Dev.vue'
import CV from '../pages/CV/CV.vue'
import NotFound from '../pages/NotFound/NotFound.vue'
// import Others from '../pages/Others.vue'
// import Admin from '../pages/Admin.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  // {
  //   path: '/qa',
  //   name: 'QA',
  //   component: QA
  // },
  // {
  //   path: '/dev',
  //   name: 'Dev',
  //   component: Dev
  // },
  {
    path: '/cv',
    name: 'CV',
    component: CV
  },
  {
    path: '/competence',
    name: 'Competence',
    beforeEnter() {
      // Redireciona para a página estática de competências
      window.location.href = '/competence-page/'
    }
  },
  // Rota catch-all para 404 - deve ser sempre a última
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
  // {
  //   path: '/others',
  //   name: 'Others',
  //   component: Others
  // },
  // {
  //   path: '/admin',
  //   name: 'Admin',
  //   component: Admin
  // }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router