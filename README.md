# shanduoduo-manager
shanduoduo-manager/
├── client/                 # 前端 Vue.js 项目
│   ├── src/
│   │   ├── components/
│   │   ├── router/
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # 后端 Node.js 项目
│   ├── api/
│   │   └── ossServer.js
│   ├── package.json
│   └── server.js
│
├── vercel.json
└── package.json           # 根目录package.json

# 开发环境启动步骤

1. 安装依赖
```bash
npm run install:all
```

2. 启动前端服务（默认端口：5173）
```bash
npm run dev:client
```

3. 启动后端服务（默认端口：3000）
```bash
npm run dev:server
```

4. 访问地址：
- 前端界面：http://localhost:5173
- 后端API：http://localhost:3000

# 本地启动
$env:NODE_ENV="development"; npm run dev:server
$env:NODE_ENV="development"; npm run dev:client

# Vercel启动
## 首先，确保已登录 Vercel CLI：
vercel login
## 检查项目是否正确链接到 Vercel：
vercel link
## 检查最新部署状态：
npm run vercel-list
## 尝试重新部署：
npm run vercel-deploy
## 部署后检查健康状态：
curl https://shanduoduo.sicilyhuang.top/api/health
## 查看详细日志：
npm run vercel-logs:debug

# 阿里云 OSS 的图片管理 API
请确保您的 Node.js 服务正在运行。
## 获取 liulantupian bucket 的图片列表：
GET /api/oss/liulantupian/images
## 获取 liulantupian bucket 的某个图片：
GET /api/oss/liulantupian/images/your_image_name.jpg
## 获取 liulantupian bucket 的 v0list.js 文件：
GET /api/oss/liulantupian/v0list.js
## 获取 shanduoduo bucket 的图片列表：
GET /api/oss/shanduoduo/images
## 上传图片到 liulantupian bucket：
POST /api/oss/liulantupian/upload (在请求体中包含 image 文件)
## 上传图片到 shanduoduo bucket：
POST /api/oss/shanduoduo/upload (在请求体中包含 image 文件)
## 删除 liulantupian bucket 的图片：
DELETE /api/oss/liulantupian/images/your_image_name.jpg
## 删除 shanduoduo bucket 的图片：
DELETE /api/oss/shanduoduo/images/your_image_name.jpg
## 更新 liulantupian bucket 的图片顺序：
POST /api/oss/liulantupian/update-order (请求体中包含文件名数组)
## 更新 shanduoduo bucket 的图片顺序：
POST /api/oss/shanduoduo/update-order (请求体中包含文件名数组)


# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
cd server
rm -r node_modules
npm install

cd ../client
rm -r node_modules
npm install

# 测试过程
http://localhost:5173/oss-images
http://localhost:3000/api/oss/shanduoduo/v0list.js
