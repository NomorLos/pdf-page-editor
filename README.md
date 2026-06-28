# PDF Editor-lite

一个 Windows 本地 PDF 页面编辑小工具。双击 EXE 后会自动打开浏览器界面，文件处理都在本机完成。

## 能做什么

- 合并多个 PDF
- 拖拽调整页面顺序
- 删除、旋转页面
- 按页码范围拆分 PDF
- 导出为新的 PDF
- Word 转 PDF
- PPT 转 PDF，并支持 2/4/6/8 合 1

## 直接使用

双击：

```text
PDF工具.exe
```

程序会自动打开：

```text
http://127.0.0.1:8765/
```

如果浏览器没有自动打开，手动访问上面的地址即可。

## PDF 编辑

1. 点击 `添加 PDF`，选择一个或多个 PDF。
2. 点击页面缩略图进行选择。
3. 可使用左转、右转、删除。
4. 直接拖拽缩略图可调整顺序。
5. 需要拆分时，输入 `1-3,8,10-12` 这类范围，再点 `拆分`。
6. 点 `导出 PDF` 保存新文件。

导出和拆分都会生成新文件，不会自动覆盖原文件。

## Word 转 PDF

- `Word转PDF并编辑`：转换后加入编辑区，可继续合并、拆分、重排。
- `Word转PDF保存`：只转换并直接保存为 PDF。

支持 `.doc`、`.docx`。

## PPT 转 PDF

- `PPT转PDF并编辑`：先转换为普通 PDF 并加入编辑区。
- 导入后可选择 `不合并`、`2合1`、`4合1`、`6合1`、`8合1`。
- 可选择排列方向：`从左到右` 或 `从上到下`。
- 修改合并方式或排列方向后，预览会自动刷新。
- `PPT转PDF保存`：按当前合并方式和排列方向直接保存 PDF。

PPT 多页合一固定输出为 A4 竖版。

## 运行要求

- Windows 10 / Windows 11
- 普通 PDF 编辑不需要联网
- Word/PPT 转 PDF 需要安装 Microsoft Office 或 LibreOffice
- 程序会优先使用 Microsoft Office，失败时再尝试 LibreOffice

## 说明

- 只做页面级编辑，不直接修改 PDF 里的文字内容。
- 支持中文路径、中文文件名和带空格路径。
- 遇到损坏或加密 PDF 时，界面会提示错误。
- 错误日志位置：`%LOCALAPPDATA%\PDF Editor-lite\error.log`

## 开发

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

打包：

```powershell
powershell -ExecutionPolicy Bypass -File .\build_exe.ps1
```

自检：

```powershell
.\.venv\Scripts\python.exe run_self_check.py
```
