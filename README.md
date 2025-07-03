# shanduoduo-manager

### NPM
npm install multer
npm install ali-oss dotenv
npm install express cors
确保：

node server.js

### 阿里云 OSS 的图片管理 API

# Test get oss images
curl http://localhost:3000/oss/images

# Test upload (replace path/to/image.jpg with actual image path)
curl -X POST -F "image=@path/to/image.jpg" http://localhost:3000/oss/upload


### OSS 相关的端点：
GET /oss/images - 获取 OSS 中的图片列表
POST /oss/upload - 上传图片到 OSS
DELETE /oss/images/:filename - 从 OSS 删除图片
POST /oss/update-order - 更新 OSS 中的图片顺序
