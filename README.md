# PDF Editor-lite

PDF Editor-lite 是一个 Windows 本地轻量 PDF 页面编辑工具。它通过本地浏览器界面运行，不需要联网，可用于 PDF 合并、拆分、重排、删除、旋转，并支持 Word/PPT 转 PDF。

## 功能

- 添加一个或多个 PDF
- Word 转 PDF 并进入编辑区，或直接保存为 PDF
- PPT 转 PDF 并进入编辑区，或直接保存为 PDF
- PPT 转 PDF 支持 `不合并`、`2合1`、`4合1`、`6合1`、`8合1`
- 本地缩略图预览
- 拖拽重排页面
- 删除选中页面
- 左右旋转页面
- 按范围拆分 PDF，例如 `1-3,8,10-12`
- 导出为新的 PDF
- 支持中文路径、中文文件名和带空格路径
- 长任务执行时显示处理中遮罩，避免误以为程序卡住

## 直接使用 EXE

双击 `PDF工具.exe`。程序会自动打开浏览器页面：

```text
http://127.0.0.1:8765/
```

如果浏览器没有自动打开，可以手动访问上面的地址。

## 页面操作

1. 点击 `添加 PDF` 选择一个或多个 PDF。
2. 选择页面后可使用左转、右转、删除。
3. 直接拖拽缩略图可调整页面顺序。
4. 拆分时，在输入框填写页码范围，例如 `1-3,8,10-12`，再点击 `拆分`。
5. 点击 `导出 PDF` 保存当前编辑区里的页面顺序和旋转结果。

## Word/PPT 转 PDF

Word：

- `Word转PDF并编辑`：选择 `.doc` 或 `.docx`，转换后自动加入编辑区。
- `Word转PDF保存`：选择 `.doc` 或 `.docx`，只转换并保存 PDF。

PPT：

- 先选择 PPT 多页合一方式：`不合并`、`2合1`、`4合1`、`6合1`、`8合1`。
- `PPT转PDF并编辑`：选择 `.ppt` 或 `.pptx`，转换后自动加入编辑区。
- `PPT转PDF保存`：选择 `.ppt` 或 `.pptx`，只转换并保存 PDF。

PPT 多页合一只用于 PPT/PPTX 转 PDF。输出固定为 A4 竖版，页面按从左到右、从上到下排列，并保持幻灯片比例居中缩放。

## 运行环境

- Windows 10 / Windows 11
- 默认浏览器，例如 Edge 或 Chrome
- 普通 PDF 编辑不需要联网
- Word/PPT 转 PDF 需要目标电脑安装 Microsoft Office 或 LibreOffice
- EXE 内置 Python 运行环境，但不内置 Microsoft Office 或 LibreOffice

转换顺序：

1. 优先使用 Microsoft Office 原生导出 PDF，版式通常更稳。
2. 如果 Office 导出失败，再尝试 LibreOffice 命令行转换。

## 开发运行

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

然后访问：

```text
http://127.0.0.1:8765/
```

## 打包 Windows EXE

```powershell
powershell -ExecutionPolicy Bypass -File .\build_exe.ps1
```

打包产物会生成到本地 `outputs/PDF轻工具/` 目录。该目录不建议提交到 Git。

## 自检

```powershell
.\.venv\Scripts\python.exe run_self_check.py
```

自检会创建临时中文路径 PDF，验证合并、重排、旋转、拆分和 PPT 多页合一排版。

## 说明

- 这个工具只做页面级编辑，不直接修改 PDF 原有文字内容。
- 默认不会覆盖原文件，导出时会弹出系统另存为窗口。
- 前端预览使用本地内置 PDF.js，不依赖联网。
- 错误日志位置：`%LOCALAPPDATA%\PDF Editor-lite\error.log`
