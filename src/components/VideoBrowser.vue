<template>
  <div>
    <h2>视频浏览</h2>
    <draggable 
      v-model="videos" 
      @end="updateOrder"
      item-key="name"
      v-if="videos.length > 0"
    >
      <template #item="{ element }">
        <div class="video-item">
          <video 
            :src="getVideoUrl(element)" 
            :alt="element"
            controls
            width="320"
          ></video>
          <p>{{ element }}</p>
          <button @click="deleteVideo(element)">删除</button>
        </div>
      </template>
    </draggable>
    <div v-else>暂无视频</div>

    <!-- 文件上传部分 -->
    <input 
      type="file" 
      accept="video/*" 
      @change="handleFileUpload" 
      ref="fileInput"
      style="display: none"
    />
    <button @click="triggerFileInput">添加视频</button>
  </div>
</template>

<script>
import draggable from 'vuedraggable';

export default {
  components: {
    draggable,
  },
  data() {
    return {
      videos: [],
    };
  },
  
  async created() {
    console.log('VideoBrowser created() 钩子被触发');
    try {
      const response = await fetch('http://localhost:3001/api/videos');
      console.log('API 响应状态:', response.ok);
      const data = await response.json();
      this.videos = data;
    } catch (error) {
      console.error('加载视频失败:', error);
    }
  },
  
  methods: {
    getVideoUrl(videoName) {
      return `http://localhost:3001/videos/${videoName}`;
    },

    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      console.log('Uploading video:', file.name); // Add logging
      const formData = new FormData();
      formData.append('video', file);

      try {
        const response = await fetch('http://localhost:3001/api/upload-video', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          console.log('Video uploaded successfully:', result.filename);
          // Add to the end of the list without triggering updateOrder
          this.videos = [...this.videos, result.filename];
        } else {
          throw new Error(result.error || '上传失败');
        }
      } catch (error) {
        console.error('上传失败:', error);
        alert('视频上传失败，请重试');
      } finally {
        // Clear the file input for next upload
        this.$refs.fileInput.value = '';
      }
    },

    async deleteVideo(filename) {
      try {
        const response = await fetch(`http://localhost:3001/api/videos/${filename}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
          this.videos = this.videos.filter(video => video !== filename);
        }
      } catch (error) {
        console.error('删除失败:', error);
      }
    },

    async updateOrder() {
      const response = await fetch('http://localhost:3001/api/update-video-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.videos),
      });
      const result = await response.json();
      if (!result.success) console.error('更新顺序失败');
    },

    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
  },
};
</script>

<style scoped>
.video-item {
  margin: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

video {
  max-width: 320px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 5px 10px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #cc0000;
}
</style>