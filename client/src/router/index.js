import { createRouter, createWebHistory } from 'vue-router'
import OssImageList from '../components/OssImageList.vue'
import DBList from '../components/DBList.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/oss-images',
      name: 'ossImages',
      component: OssImageList
    },
    {
      path: '/db-list',
      name: 'db-list',
      component: DBList
    },   
     {
      path: '/',
      redirect: '/oss-images'
     }
  ]
})

export default router