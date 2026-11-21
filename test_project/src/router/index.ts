
import ListingsView from '@/views/ListingsView.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: "Listings",
      component: ListingsView,
      path: "/listings"
    },
  ],
})

export default router
