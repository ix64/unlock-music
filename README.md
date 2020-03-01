# Unlock Music 音乐解锁
- Unlock encrypted music file in browser. 
- 在浏览器中解锁加密的音乐文件。
- unlock-music项目是以学习和技术研究的初衷创建的。
- 由于存在可能的法律风险以及滥用风险，不再提供Demo服务。

[![Build Status](https://ci.ixarea.com/api/badges/ix64/unlock-music/status.svg)](https://ci.ixarea.com/ix64/unlock-music)

# Features
- [x] Unlock in browser 在浏览器中解锁
- [x] QQMusic Format QQ音乐格式 (.qmc0/.qmc3/.qmcflac/.qmcogg/.tkm)
- [x] MooMusic Format Moo音乐格式 ([.bkcmp3/.bkcflac](https://github.com/ix64/unlock-music/issues/11))
- [x] QQMusic Tm Format QQ音乐Tm格式 (.tm0/.tm2/.tm3/.tm6)
- [x] QQMusic New Format QQ音乐新格式 (Experimental 实验性支持)
    - [x] .mflac 
    - [x] .mgg
- [x] Netease Format 网易云音乐格式 (.ncm)
- [x] Drag and Drop 拖放文件
- [x] Play instantly 在线播放
- [x] Batch unlocking 批量解锁
- [x] Progressive Web App 渐进式Web应用
- [x] Complete ID3 for ncm 补全ncm的ID3信息
- [x] Multi-threads 多线程 

# 使用方法
## 下载已构建版本
- 已构建的版本发布在 [GitHub Release](https://github.com/ix64/unlock-music/releases/latest), 下载解压缩后即可部署或本地使用

## 自行构建
- 环境要求 
    - nodejs
    - npm
1. 获取项目源代码后执行 `npm install` 安装相关依赖
2. 执行 `npm run build` 即可进行构建，构建输出为 dist 目录
- `npm run serve` 可用于开发
