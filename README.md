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

### 开发环境启动步骤

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

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
cd server
rm -r node_modules
npm install

cd ../client
rm -r node_modules
npm install

$env:NODE_ENV="development"; npm run dev:server
$env:NODE_ENV="development"; npm run dev:client

首先，确保已登录 Vercel CLI：
vercel login
检查项目是否正确链接到 Vercel：
vercel link
检查最新部署状态：
npm run vercel-list
尝试重新部署：
npm run vercel-deploy
部署后检查健康状态：
curl https://shanduoduo.sicilyhuang.top/api/health
查看详细日志：
npm run vercel-logs:debug

npm install @supabase/supabase-js