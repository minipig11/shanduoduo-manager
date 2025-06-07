// src/components/ImageBrowser.vue
<template>
  <div>
    <h2>图片浏览</h2>
    <draggable 
      v-model="images" 
      @end="updateOrder"
      item-key="name"
      v-if="images.length > 0"
    >
      <template #item="{ element }">
        <div class="image-item">
          <img :src="getImageUrl(element)" :alt="element" />
          <p>{{ element }}</p>
          <button @click="deleteImage(element)">删除</button>
        </div>
      </template>
    </draggable>
    <div v-else>暂无图片</div>

    <!-- 文件上传部分 -->
    <input 
      type="file" 
      accept="image/*" 
      @change="handleFileUpload" 
      ref="fileInput"
      style="display: none"
    />
    <button @click="triggerFileInput">添加图片</button>
  </div>
</template>

<script>
import draggable from 'vuedraggable';

export default {
  components: {
    draggable,  // 直接注册组件名
  },
  data() {
    return {
      images: [],
    };
  },
  
  async created() {
    console.log('created() 钩子被触发');
    try {
      const response = await fetch('http://localhost:3001/api/images');
      console.log('API 响应状态:', response.ok);
      const data = await response.json();
      //console.log('加载的图片列表:', data);
      this.images = data;
    } catch (error) {
      console.error('加载图片失败:', error);
    }
  },
  
  methods: {
    getImageUrl(imageName) {
      // 使用后端代理的路径（通过 Express 静态资源服务）
      return `http://localhost:3001/images/${imageName}`;
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (result.success) {
          this.images.push(result.filename); // 更新图片列表
        }
      } catch (error) {
        console.error('上传失败:', error);
      }
    },
    async deleteImage(filename) {
      try {
        const response = await fetch(`http://localhost:3001/api/images/${filename}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
          this.images = this.images.filter(img => img !== filename); // 更新列表
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    },
    async updateOrder() {
      const response = await fetch('http://localhost:3001/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.images),
      });
      const result = await response.json();
      if (!result.success) console.error('更新顺序失败');
    },
    triggerFileInput() {
      this.$refs.fileInput?.click();  // 可选链操作符避免报错
    },
  },
};
</script>

<style scoped>
.image-item {
  margin: 10px;
  display: flex;
  align-items: center;
}
img {
  max-width: 200px;
  max-height: 200px;
}
</style>