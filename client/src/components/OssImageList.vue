<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOssImages, uploadToOss, deleteFromOss, updateOssOrder } from '../api/ossApi'

const images = ref([])
const loading = ref(false)
const currentImage = ref(null)
const showViewer = ref(false)

// Load images from OSS
const loadImages = async () => {
  loading.value = true
  try {
    images.value = await getOssImages("shanduoduo")
  } catch (error) {
    ElMessage.error('加载图片失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Handle image upload
const handleUpload = async (event) => {
  const files = event.target.files
  if (!files.length) return

  try {
    const file = files[0]
    await uploadToOss(file)
    ElMessage.success('上传成功')
    await loadImages()
    event.target.value = '' // Reset input
  } catch (error) {
    ElMessage.error('上传失败: ' + error.message)
  }
}

// Handle image deletion
const handleDelete = async (image) => {
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteFromOss(image.name || image)
    ElMessage.success('删除成功')
    await loadImages()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + error.message)
    }
  }
}

// Handle image preview
const handlePreview = (image) => {
  currentImage.value = image
  showViewer.value = true
}

// Handle viewer close
const handleViewerClose = () => {
  showViewer.value = false
}

// Handle drag and drop for reordering
const handleDrop = async (event, newIndex) => {
  const oldIndex = Number(event.dataTransfer.getData('text/plain'))
  if (isNaN(oldIndex)) return
  
  const newOrder = [...images.value]
  const [movedItem] = newOrder.splice(oldIndex, 1)
  newOrder.splice(newIndex, 0, movedItem)
  
  try {
    await updateOssOrder(newOrder)
    images.value = newOrder
    ElMessage.success('排序更新成功')
  } catch (error) {
    ElMessage.error('更新排序失败: ' + error.message)
    await loadImages()
  }
}

onMounted(loadImages)
</script>

<template>
  <div class="image-browser">
    <!-- Upload Section -->
    <div class="upload-section">
      <input
        type="file"
        accept="image/*"
        style="display: none"
        ref="fileInput"
        @change="handleUpload"
      >
      <el-button type="primary" @click="$refs.fileInput.click()">
        上传图片
      </el-button>
    </div>

    <!-- Image Grid -->
    <div v-loading="loading" class="image-grid">
      <div
        v-for="(image, index) in images"
        :key="image.name || image"
        class="image-item"
        draggable="true"
        @dragstart="event => event.dataTransfer.setData('text/plain', index)"
        @dragover.prevent
        @drop="event => handleDrop(event, index)"
      >
        <div class="image-container">
          <img
            :src="image.url"
            :alt="image.name || image"
            @click="handlePreview(image)"
          >
          <div class="image-overlay">
            <el-button
              type="danger"
              circle
              size="small"
              @click.stop="handleDelete(image)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Viewer -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="[currentImage?.url]"
      @close="handleViewerClose"
    />
  </div>
</template>

<style scoped>
.image-browser {
  padding: 20px;
}

.upload-section {
  margin-bottom: 20px;
  text-align: right;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  cursor: move;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.el-button.is-circle {
  margin: 4px;
}
</style>