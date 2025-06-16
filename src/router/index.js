import { createRouter, createWebHistory } from 'vue-router'
import ImageBrowser from '../components/ImageBrowser.vue'
import VideoBrowser from '../components/VideoBrowser.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/imagelist',
      name: 'imagelist',
      component: ImageBrowser
    },
    {
      path: '/videolist',
      name: 'videolist',
      component: VideoBrowser
    },
    {
      path: '/',
      redirect: '/imagelist'
    }
  ]
})

export default router