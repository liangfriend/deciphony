/**
 * 第一步：命令行读入图片，转成二值图。
 * 二值图在内存里就是一个 cv::Mat（行×列 的数组），
 * 每个元素 0 或 255（背景/符号）。
 *
 * 用法: omr_cli.exe <输入图片路径> [输出二值图路径]
 * 例:   omr_cli.exe score.png
 * 例:   omr_cli.exe score.png binary.png
 */

#include <iostream>
#include <string>
#include <opencv2/opencv.hpp>

int main(int argc, char* argv[])
{
    if (argc < 2) {
        std::cerr << "用法: " << argv[0] << " <输入图片路径> [输出二值图路径]\n";
        std::cerr << "例:   " << argv[0] << " score.png\n";
        std::cerr << "例:   " << argv[0] << " score.png binary.png\n";
        return 1;
    }

    const std::string inputPath(argv[1]);
    const std::string outputPath = (argc >= 3) ? argv[2] : "binary_output.png";

    // 1. 读图
    cv::Mat img = cv::imread(inputPath);
    if (img.empty()) {
        std::cerr << "无法读取图片: " << inputPath << "\n";
        return 1;
    }

    // 2. 转灰度
    cv::Mat gray;
    if (img.channels() == 3)
        cv::cvtColor(img, gray, cv::COLOR_BGR2GRAY);
    else
        gray = img.clone();

    // 3. 二值化（符号为白 255，背景为黑 0，与后续投影/连通域一致）
    cv::Mat binary;
    cv::threshold(gray, binary, 0, 255, cv::THRESH_BINARY_INV + cv::THRESH_OTSU);

    // 4. 轻度去噪（可选）
    cv::Mat kernel = cv::getStructuringElement(cv::MORPH_RECT, cv::Size(2, 2));
    cv::morphologyEx(binary, binary, cv::MORPH_CLOSE, kernel);

    // 5. 保存二值图，便于肉眼检查
    if (!cv::imwrite(outputPath, binary)) {
        std::cerr << "保存二值图失败: " << outputPath << "\n";
        return 1;
    }
    std::cout << "二值图已保存: " << outputPath << " (白=符号, 黑=背景)\n";

    // 6. 你现在得到的「一组很多的数组数据」就是这个 Mat
    const int rows = binary.rows;
    const int cols = binary.cols;
    std::cout << "二值图尺寸: " << rows << " 行 x " << cols << " 列\n";
    std::cout << "总像素数: " << rows * cols << " (每个像素 0 或 255)\n";

    // 7. 如何访问这组数据（示例：打印左上角 8x8 小块）
    const int sampleSize = 8;
    std::cout << "\n左上角 " << sampleSize << "x" << sampleSize << " 的数值示例:\n";
    for (int r = 0; r < sampleSize && r < rows; ++r) {
        for (int c = 0; c < sampleSize && c < cols; ++c) {
            std::cout << (int)binary.at<uchar>(r, c) << "\t";
        }
        std::cout << "\n";
    }

    // 后续步骤（投影、连通域、规则分类）都基于 binary 这个 Mat 做：
    // - binary.rows, binary.cols  行数、列数
    // - binary.at<uchar>(r, c)    第 r 行第 c 列的值 (0 或 255)
    // - binary.ptr<uchar>(r)      第 r 行首地址，可整行遍历

    return 0;
}
