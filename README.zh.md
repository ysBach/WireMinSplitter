# 最少转账AA计算器 (MoneySplit)

MoneySplit 用于分摊共同支出，并找出结清账目所需的最少转账次数。
在浏览器中打开 [moneysplit-e1m.pages.dev](https://moneysplit-e1m.pages.dev/)。无需账号，也无需安装。

语言：[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md)

## 使用方法

1. 输入每个人的姓名和支出。
2. 可选：输入额外支付和额外收取。两者的总额必须相等。
3. 把可以多次转账的人标记为多次转账优先者。
4. 可选：打开严格偏好模式。这样只有被标记的人可以多次转账。
5. 查看转账指令。用“复制结果”或“截图”分享。

应用在浏览器中计算，不会把姓名和金额发送到服务器。
支持的浏览器可以安装本应用。浏览器缓存全部应用文件后，可离线使用。
人数较多时，搜索可能需要较长时间。点击“取消”即可停止。

## 工作原理

应用把每个余额计算为以分为单位的整数。然后，精确搜索找出转账次数最少的方案。
[docs/ALGORITHM.zh.md](docs/ALGORITHM.zh.md) 说明了每个步骤，并证明该方案最优。
应用中的 **算法如何工作** 显示相同的内容。

## 开发与部署

需要 Node.js 22 或更高版本。

```bash
npm ci
npm test
npm run build
npm run preview  # 在 http://127.0.0.1:8080 打开 dist/
```

要修改算法说明，请编辑 `scripts/algorithm-content.mjs`，然后运行 `npm run docs:algorithm`。
该命令会同时更新应用和 `docs/ALGORITHM*.md`。两者不一致时，`npm test` 会失败。

推送到 `main` 后，GitHub Actions 会在测试和构建完成后部署到 Cloudflare Pages 项目 `moneysplit`。
部署设置、Python 检查和本地 API 见[英文 README](README.md)。
