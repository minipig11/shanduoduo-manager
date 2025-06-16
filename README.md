# liulantupian-manager

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

node src/server.js

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
