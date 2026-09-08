# 🌐 EatTogether 免费永久公网部署指南（随时随地、微信点开即用）

为实现“长期能用、7x24小时不关机、手机微信点开即用”，推荐以下两种免费公网部署方式（耗时约 2~3 分钟，完全免费）。

---

## 方案 A：使用 Zeabur 部署（最推荐，国内访问极速、微信秒开、自带持久化）

[Zeabur](https://zeabur.com) 是一家支持一键从 GitHub 部署 Docker / Node 项目的云托管平台，有免费额度，亚太节点网络顺畅，微信直接打开不卡顿。

### 部署步骤：
1. **将项目推送到您的 GitHub**：
   ```bash
   git add .
   git commit -m "feat: student busy schedule eattogether"
   git remote add origin <你的GitHub仓库地址>
   git push -u origin main
   ```
2. **在 Zeabur 导入**：
   - 打开 [Zeabur 官网](https://zeabur.com) 并用 GitHub 登录。
   - 点击 **「Create Project (创建项目)」** -> **「Deploy New Service (部署新服务)」**。
   - 选择 **「Git」**，选中您刚才推送的 `silly-bose` 仓库。
   - Zeabur 会自动识别项目根目录的 `Dockerfile` 并自动完成编译与启动！
3. **绑定域名与开启持久化**：
   - 在服务卡片中点击 **「Networking (网络)」** -> **「Generate Domain (生成免费域名)」**，即可得到一个公网网址（例如 `https://our-eats.zeabur.app`）。
   - 在 **「Volumes (存储卷)」** 中添加挂载路径：`/app/server/data`，确保以后更新代码数据永久不丢失。
4. **大功告成！**：
   - 把链接发到微信，或者用手机扫码，随时随地两人协同约饭！

---

## 方案 B：使用 Render / Railway 一键部署

1. 登录 [Render](https://render.com) 或 [Railway](https://railway.app)。
2. 选择 **「Web Service」** 并连接 GitHub 仓库。
3. 环境选择 **Docker**，端口填写 `3001`。
4. 点击部署，1 分钟后即可获得公网 HTTPS 网址。

---

## 方案 C：本地局域网手机直接体验（无需公网，同一 Wi-Fi 秒连）

如果只想和身边的 TA 马上连上：
1. 查看电脑的局域网 IP（Mac 在「系统设置」->「Wi-Fi」中查看，例如 `192.168.1.5`）。
2. 在电脑浏览器打开 `http://localhost:3001`，点击右上角的 **「📱 手机扫码」**。
3. 只要手机连接同一个 Wi-Fi，用微信扫码即可直接在手机上操作！
