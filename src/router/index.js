import { createRouter, createWebHistory } from 'vue-router'
import OssImageList from '../components/OssImageList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/oss-images',
      name: 'ossImages',
      component: OssImageList
    },
    {
      path: '/',
      redirect: '/oss-images'
    }
  ]
})

export default router