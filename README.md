# shanduoduo-manager

# Now you can access: 
http://localhost:5173/imagelist
http://localhost:5173/videolist

```sh
npm install
```
```sh
npm run dev
```

```sh
npm run build
```

### NPM
npm install multer
npm install ali-oss dotenv
npm install express cors
确保：

node api/server.js

# 图片接口
支持的图片格式包括 jpg、jpeg、png。

/api/images - GET 接口，获取图片列表
/images - 静态文件访问路径
/api/upload - POST 接口，上传图片文件
/api/images/:filename - DELETE 接口，删除指定图片
/api/update-order - POST 接口，更新图片排序

# 视频接口
支持的视频格式包括 mp4、avi、mov 和 wmv。

/api/videos - GET 接口，获取视频列表
/videos - 静态文件访问路径
/api/upload-video - POST 接口，上传视频文件
/api/videos/:filename - DELETE 接口，删除指定视频
/api/update-video-order - POST 接口，更新视频排序

你可以通过以下方式测试这些接口：

# 获取图片列表
curl http://localhost:3001/api/images

# 上传图片
curl -X POST -F "image=@photo.jpg" http://localhost:3001/api/upload

# 删除图片
curl -X DELETE http://localhost:3001/api/images/photo.jpg

# 更新图片排序
curl -X POST -H "Content-Type: application/json" -d '["image1.jpg","image2.jpg"]' http://localhost:3001/api/update-order

# 获取视频列表：
curl http://localhost:3001/api/videos

# 上传视频：
curl -X POST -F "video=@video.mp4" http://localhost:3001/api/upload-video

# 删除视频：
curl -X DELETE http://localhost:3001/api/videos/video.mp4

# 更新视频排序：
curl -X POST -H "Content-Type: application/json" -d '["video1.mp4","video2.mp4"]' http://localhost:3001/api/update-video-order



###  现在你可以同时访问：
本地文件系统的图片管理 API
阿里云 OSS 的图片管理 API

# Test get oss images
curl http://localhost:3000/oss/images

# Test upload (replace path/to/image.jpg with actual image path)
curl -X POST -F "image=@path/to/image.jpg" http://localhost:3000/oss/upload


### OSS 相关的端点：
GET /oss/images - 获取 OSS 中的图片列表
POST /oss/upload - 上传图片到 OSS
DELETE /oss/images/:filename - 从 OSS 删除图片
POST /oss/update-order - 更新 OSS 中的图片顺序
