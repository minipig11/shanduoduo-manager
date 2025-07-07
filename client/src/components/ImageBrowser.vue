// src/components/ImageBrowser.vue
<template>
  <div class="top-controls">
      <!-- Bucket Selector -->
      <el-select
        v-model="selectedBucket"
        placeholder="选择存储桶"
        @change="handleBucketChange"
        class="control-item"
      >
        <el-option
          v-for="option in bucketOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <!-- Upload Button -->
	    <input 
	      type="file" 
	      accept="image/*" 
	      @change="handleUpload" 
	      ref="fileInput"
	      style="display: none"
	    />
	    <button @click="triggerFileInput" class="control-item">添加图片</button>
    </div>
 <!-- Image Grid -->
    <div>
    <draggable 
      v-model="images" 
      @end="handleDragEnd"
      item-key="name"
      v-if="images.length > 0"
    >
      <template #item="{ element }">
        <div class="image-item">
          <!-- Add key to help Vue track items -->
          <img :src="element.url" :alt="element.name" :key="element.name" />
          <p>{{ element.name }}</p>
          <button @click="handleDelete(element)">删除</button>
        </div>
      </template>
    </draggable>
    <div v-else>暂无图片</div>

    
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOssImages, uploadToOss, deleteFromOss, updateOssOrder as updateOssOrderApi, getImageUrl } from '../api/ossApi'

export default {
  components: {
    draggable,  // 直接注册组件名
  },
  data() {
    return {
      images: [],
      loading: false,
      selectedBucket: 'shanduoduo',
      bucketOptions: [
        { label: '闪多多', value: 'shanduoduo' },
        { label: '浏览图片', value: 'liulantupian' }
      ]
    };
  },
  
  async created() {
    this.loadImages()
  },
  
  methods: {
    getImageUrl, // Make getImageUrl available in template
    // Load images from OSS
    async loadImages() {
      this.loading = true
      try {
        this.images = await getOssImages(this.selectedBucket)
      } catch (error) {
        ElMessage.error('加载图片失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // Handle image upload
    async handleUpload(event) {
      const files = event.target.files
      if (!files.length) return

      try {
        const file = files[0]
        await uploadToOss(file, this.selectedBucket)
        ElMessage.success('上传成功')
        await this.loadImages()
        event.target.value = '' // Reset input
      } catch (error) {
        ElMessage.error('上传失败: ' + error.message)
      }
    },

    // Handle image deletion
    async handleDelete (image) {
      try {
        await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deleteFromOss(image.name, this.selectedBucket)
        ElMessage.success('删除成功')
        await this.loadImages()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除失败: ' + error.message)
        }
      }
    },

    triggerFileInput() {
      this.$refs.fileInput?.click();  // 可选链操作符避免报错
    },

    // Handle bucket change
    handleBucketChange(newValue) {
      this.selectedBucket = newValue;
      this.loadImages();
    },

    // Handle drag end event
    async handleDragEnd(event) {
      try {
        // images 数组已被 v-model 更新
        await updateOssOrderApi(this.images, this.selectedBucket); // 假设 updateOssOrder 接收图片数组和存储桶
        ElMessage.success('图片顺序更新成功');
      } catch (error) {
        ElMessage.error('更新图片顺序失败: ' + error.message);
      }
    }
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
.top-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.control-item {
  width: 150px; /* Adjust as needed */
  font-size: 14px; /* Adjust font size for consistency */
  text-align: center; /* Center the text */
}
/* Element UI specific adjustments if needed */
.el-select.control-item .el-input__inner {
  text-align: center; /* Ensure text in El-Select input is centered */
  width: 100%; /* Ensure the input takes full width of the control-item */
}

.el-button.control-item {
  text-align: center; /* Ensure text in button is centered */
}
</style>