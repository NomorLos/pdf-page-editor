# PDF 页面编辑

一个 Windows 本地轻量 PDF 页面级编辑工具。程序启动后会打开本地浏览器界面，可用于拆分、合并、重排、删除和旋转 PDF 页面。

## 功能

- 添加一个或多个 PDF
- 本地缩略图预览
- 拖拽重排页面
- 删除选中页面
- 左右旋转页面
- 按范围拆分 PDF，例如 `1-3,8,10-12`
- 导出为新的 PDF
- 支持中文路径、中文文件名和带空格路径

## 运行开发版

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

然后打开浏览器访问：

```text
http://127.0.0.1:8765/
```

## 打包 Windows EXE

```powershell
powershell -ExecutionPolicy Bypass -File .\build_exe.ps1
```

打包产物会生成到本地 `outputs/PDF轻工具/` 目录。该目录不建议直接提交到 Git。

## 自检

```powershell
.\.venv\Scripts\python.exe run_self_check.py
```

自检会创建临时中文路径 PDF，验证合并、重排、旋转和拆分。

## 说明

- 该项目做页面级编辑，不对内容修改。
- 默认不会覆盖原文件，导出时会弹出系统另存为窗口。
- 前端预览使用本地内置 PDF.js，不依赖联网。
