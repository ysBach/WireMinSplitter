# 最少转账AA计算器 (MoneySplit / Wire-Min-Splitter)

请在浏览器中打开 [https://moneysplit-e1m.pages.dev/](https://moneysplit-e1m.pages.dev/)。

在浏览器内计算结算的静态网站。界面语言为英语、韩语、日语、中文。姓名和金额不会发送到计算服务器。不需要账户、数据库、支付服务或 Python 服务器。

用户只需要浏览器。不需要终端、账户、Node.js 或 Python。所有者的电脑也无需保持运行。

## 使用方法

1. 打开[公开网站](https://moneysplit-e1m.pages.dev/)。
2. 输入每位参与者的姓名和支出。额外付款、收款为可选项，两者总额必须完全相等。
3. 选择可以多次转账的人和模式。严格模式下，只有选中的人可以进行多笔转账。
4. 点击**计算结算**。
5. 查看精确的转账说明。其他显示单位是近似值，并会如此标注。

## 发布状态

公开网址是 [https://moneysplit-e1m.pages.dev/](https://moneysplit-e1m.pages.dev/)。这是 Cloudflare Pages 上的静态网站。当前公开版本不是 Tauri 安装包。

`http://127.0.0.1:8080` 只是本机的本地预览，不是可分享的公开网址。

Cloudflare Pages 提供免费的静态网站托管。详见[官方文档](https://developers.cloudflare.com/pages/functions/pricing/)。本网站不需要 Functions、付费升级或购买域名。自定义域名另有注册与续费费用。

## 安装与离线

安装 PWA 是可选的，并取决于浏览器。安装后可在单独的应用窗口中打开。

离线使用要求应用文件已全部成功缓存。只加载了首页并不够。浏览器清理存储空间后，离线副本可能消失。Tauri 安装包留待后续开发。

## 结算规则

- 金额和倍数按精确小数计算，不使用浮点数金额。
- 最终净余额分配到分，总和为零。输入相同的参与者之间也可能相差一分。平局按姓名的 Unicode 码点顺序决定，因此相同输入重新计算会得到相同结果。
- 先最小化转账次数。次数相同时，减少未选中付款人的多笔转账负担。
- **原始值**根据倍数应用前的金额独立计算，不将转换后的转账金额除以倍数来还原。
- 严格模式下，每个视图分别显示方案或错误。原始值和倍数视图可能只有一个可行。

## 耗时较长的搜索

精确的最少转账搜索可能耗时很长。没有自动时间限制。用**取消**停止。取消不表示无法结算。

## 开发者与部署人员

需要 Node.js 22 或更新版本。

```bash
npm ci
npm test
npm run build
npm run preview
```

部署人员按以下步骤更新。当前网站使用 Cloudflare Pages 的[直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

1. 在自己的电脑上运行 `npm run build`。
2. 在 Cloudflare **Workers & Pages** 中打开现有 Pages 项目 `moneysplit`。
3. 选择 **Create a new deployment**，然后选择 **Production**。
4. 上传 `dist` 文件夹，或 `index.html` 位于压缩包根目录的 ZIP 文件。
5. 保存并部署，然后分享公开网址。

直接上传项目无法改为 Git 集成。自动 Git 部署需要新项目。步骤见[英文 README](README.md)。

Python 保留为参考实现和可选的本地 API。使用项目 `.venv`：

```bash
uv sync --extra test
uv run pytest
```

## 许可证与详细信息

截图库已包含在本地。许可证见 `web/vendor/html2canvas.LICENSE`。

完整规则、API、部署步骤和验证命令见[英文 README](README.md)。
