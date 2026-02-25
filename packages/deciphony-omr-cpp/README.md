# deciphony-omr-cpp

C++ 图转谱第一步：命令行读入图片，输出二值图（并得到二维数组数据）。

## 在 Visual Studio 里用

### 1. 把代码放进你的项目

- 若你建的是**空项目**：把 `main.cpp` 复制到项目里（或把本文件夹加入解决方案）。
- 若你建的是**控制台应用**：用本仓库的 `main.cpp` 覆盖自动生成的 `main.cpp`。

### 2. 配置 OpenCV

任选一种方式。

**方式 A：vcpkg（推荐）**

1. 安装 vcpkg：<https://github.com/microsoft/vcpkg>
2. 在 vcpkg 目录执行：
   ```bat
   .\vcpkg install opencv:x64-windows
   ```
3. 在 VS 里：项目 → 属性 → 常规 → 将 vcpkg 设为“使用 vcpkg 的 CMake 集成”或手动：
   - C/C++ → 常规 → 附加包含目录：`<vcpkg>\installed\x64-windows\include`
   - 链接器 → 常规 → 附加库目录：`<vcpkg>\installed\x64-windows\lib`
   - 链接器 → 输入 → 附加依赖项：`opencv_world4xx.lib`（具体版本号看 vcpkg 安装后的 lib 目录）

**方式 B：官网预编译包**

1. 从 <https://opencv.org/releases/> 下载 Windows 版，解压。
2. 项目属性：
   - 附加包含目录：`<opencv>\build\include`
   - 附加库目录：`<opencv>\build\x64\vc16\lib`（按你的 VS 版本选 vc14/vc15/vc16）
   - 附加依赖项：`opencv_world4xx.lib`
3. 运行前把 `opencv\build\x64\vc16\bin` 加入系统 PATH，或把 dll 复制到 exe 同目录。

### 3. 生成与运行

- 选 **x64** 配置，生成解决方案。
- 在命令行运行（把路径换成你的图片）：
  ```bat
  cd <你的 exe 所在目录>
  omr_cli.exe D:\path\to\score.png
  ```
  会生成 `binary_output.png`（二值图），并在控制台打印尺寸和左上角 8×8 的数值示例。

- 指定输出文件名：
  ```bat
  omr_cli.exe D:\path\to\score.png my_binary.png
  ```

## 你得到的「一组很多的数组数据」

- 二值图在内存里是 **cv::Mat**：行数 `binary.rows`，列数 `binary.cols`，类型 `CV_8UC1`（单通道 0–255）。
- 每个元素 **0**（背景）或 **255**（符号）。
- 访问方式：
  - `binary.at<uchar>(行, 列)` 取单个像素；
  - `binary.ptr<uchar>(行)` 取该行首指针，可整行遍历。
- 后续的投影、连通域、规则分类都基于这个 Mat 做。
