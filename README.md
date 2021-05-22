# Unlock Music 音乐解锁

- 在浏览器中解锁加密的音乐文件。 Unlock encrypted music file in the browser.
- unlock-music项目是以学习和技术研究的初衷创建的，修改、再分发时请遵循[License](https://github.com/ix64/unlock-music/blob/master/LICENSE)
- Unlock Music的CLI版本正在开发中。
- 我们新建了Telegram群组，欢迎加入！[https://t.me/unlock_music_chat](https://t.me/unlock_music_chat)
- [CLI版本 Alpha](https://github.com/unlock-music/cli) 大批量转换建议使用CLI版本
- [相关的其他项目](https://github.com/ix64/unlock-music/wiki/%E5%92%8CUnlockMusic%E7%9B%B8%E5%85%B3%E7%9A%84%E9%A1%B9%E7%9B%AE)

![Test Build](https://github.com/ix64/unlock-music/workflows/Test%20Build/badge.svg)
![GitHub releases](https://img.shields.io/github/downloads/ix64/unlock-music/total)
![Docker Pulls](https://img.shields.io/docker/pulls/ix64/unlock-music)

## 特性

### 支持的格式

- [x] QQ音乐 (.qmc0/.qmc2/.qmc3/.qmcflac/.qmcogg/[.tkm](https://github.com/ix64/unlock-music/issues/9))
  - [x] 写入封面图片
- [x] Moo音乐格式 ([.bkcmp3/.bkcflac](https://github.com/ix64/unlock-music/issues/11))
- [x] QQ音乐Tm格式 (.tm0/.tm2/.tm3/.tm6)
- [x] QQ音乐新格式 (实验性支持)
  - [x] .mflac
  - [x] [.mgg](https://github.com/ix64/unlock-music/issues/3)
- [x] 网易云音乐格式 (.ncm)
  - [x] 补全ncm的ID3/FlacMeta信息
- [x] 虾米音乐格式 (.xm) (测试阶段)
- [x] 酷我音乐格式 (.kwm) (测试阶段)
- [x] 酷狗音乐格式 (
  .kgm) ([CLI版本](https://github.com/ix64/unlock-music/wiki/%E5%85%B6%E4%BB%96%E9%9F%B3%E4%B9%90%E6%A0%BC%E5%BC%8F%E5%B7%A5%E5%85%B7#%E9%85%B7%E7%8B%97%E9%9F%B3%E4%B9%90-kgmvpr%E8%A7%A3%E9%94%81%E5%B7%A5%E5%85%B7))

### 其他特性

- [x] 在浏览器中解锁
- [x] 拖放文件
- [x] 在线播放
- [x] 批量解锁
- [x] 渐进式Web应用
- [x] 多线程

## 使用方法

### 安装浏览器扩展

[![Chrome Web Store](https://storage.googleapis.com/chrome-gcs-uploader.appspot.com/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](https://chrome.google.com/webstore/detail/gldlhhhmienbhlpkfanjpmffdjblmegd)
[<img src="https://developer.microsoft.com/en-us/store/badges/images/Chinese_Simplified_get-it-from-MS.png" height="60" alt="Microsoft Edge Addons"/>](https://microsoftedge.microsoft.com/addons/detail/ggafoipegcmodfhakdkalpdpcdkiljmd)
[![Firefox Browser Addons](https://ffp4g1ylyit3jdyti1hqcvtb-wpengine.netdna-ssl.com/addons/files/2015/11/get-the-addon.png)](https://addons.mozilla.org/zh-CN/firefox/addon/unlock-music/)

### 使用已构建版本

- 从[GitHub Release](https://github.com/ix64/unlock-music/releases/latest)下载已构建的版本
  - 本地使用请下载`legacy版本`（`modern版本`只能通过**http/https协议**访问）
- 解压缩后即可部署或本地使用（**请勿直接运行源代码**）

### 使用Docker镜像

```shell
docker run --name unlock-music -d -p 8080:80 ix64/unlock-music
```

### 自行构建

- 环境要求
  - nodejs
  - npm

1. 获取项目源代码后执行 `npm install` 安装相关依赖
2. 执行 `npm run build` 即可进行构建，构建输出为 dist 目录

- `npm run serve` 可用于开发
3. 如需构建浏览器扩展，build完成后还需要执行`npm run make-extension`

## 贡献者变化

[![Contributor over time](https://contributor-graph-api.apiseven.com/contributors-svg?chart=contributorOverTime&repo=unlock-music/unlock-music)](https://www.apiseven.com/en/contributor-graph?chart=contributorOverTime&repo=unlock-music/unlock-music)
