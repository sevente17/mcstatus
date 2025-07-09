# mcstatus
一个简单的用于获取Minecraft服务器信息的项目
> [!WARNING]  
> 此项目的mcstatus_api.cjs文件全部使用Deepseek编写,此外均为人工编写，但代码质量不高，介意勿用。

# 快速开始
1.克隆此项目并运行
```
git clone git@github.com:sevente17/mcstatus.git
cd mcstatus mcstatus
npm run dev
```
2.调用API
```
curl https://127.0.0.1:3000/?type=favicon&hostname=mc.hypixel.net&port=25565
#获取Hypixel服务器图标
```
其余选项：
`description` `version` `preventsChatReports` `players`

# TODO
- [ ] 自定义超时时间
- [ ] 可部署vercel
- [ ] 优化错误处理
- [ ] 以及更多
