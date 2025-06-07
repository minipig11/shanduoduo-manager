// src/components/ImageBrowser.vue
<template>
  <div>
    <h2>图片浏览</h2>
    <div v-if="images.length === 0">暂无图片</div>
    <div v-else>
      <div v-for="(image, index) in images" :key="index" class="image-item">
        <img :src="getImageUrl(image)" :alt="image" />
        <p>{{ image }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      images: [],
    };
  },
  methods: {
    getImageUrl(imageName) {
      // 使用后端代理的路径（通过 Express 静态资源服务）
      return `http://localhost:3001/images/${imageName}`;
    },
  },
  async created() {
    const response = await fetch('http://localhost:3001/api/images');
    this.images = await response.json();
  }
};
</script>

<style scoped>
.image-item {
  margin: 10px;
  display: inline-block;
}
img {
  max-width: 200px;
  max-height: 200px;
}
</style>