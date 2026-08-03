#!/usr/bin/env python3
"""
机械工程师文档快速生成脚本
根据模板和输入数据生成标准化 Word 文档

用法:
    python generate_doc.py --template <模板类型> --data <JSON数据文件> --output <输出路径>

模板类型:
    project-plan    项目立项申请
    acceptance      验收报告
    summary         工作总结
    paper           技术论文
    budget          预算报价
    contract        合同评审
    investigation   异常调查
    layout          布局规划
"""

import argparse
import json
import os
import re
from datetime import datetime


def load_template(template_type: str) -> str:
    """加载对应类型的 Markdown 模板"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(
        script_dir, "..", "references", f"{template_type}-template.md"
    )
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()


def fill_template(template: str, data: dict) -> str:
    """用数据填充模板中的占位符"""
    result = template

    # 递归处理嵌套字典
    def flatten(d, parent_key=""):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}.{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten(v, new_key).items())
            elif isinstance(v, list):
                for i, item in enumerate(v):
                    if isinstance(item, dict):
                        items.extend(flatten(item, f"{new_key}[{i}]").items())
                    else:
                        items.append((f"{new_key}[{i}]", str(item)))
            else:
                items.append((new_key, str(v)))
        return dict(items)

    flat_data = flatten(data)

    # 替换 [key] 或 {{key}} 格式的占位符
    for key, value in flat_data.items():
        # 支持多种占位符格式
        patterns = [
            rf"\[\s*{re.escape(key)}\s*\]",
            rf"{{{{\s*{re.escape(key)}\s*}}}}",
        ]
        for pattern in patterns:
            result = re.sub(pattern, value, result)

    # 自动填充日期
    result = result.replace("[YYYY-MM-DD]", datetime.now().strftime("%Y-%m-%d"))
    result = result.replace("[YYYY年MM月]", datetime.now().strftime("%Y年%m月"))
    result = result.replace("[YYYY年MM月DD日]", datetime.now().strftime("%Y年%m月%d日"))

    return result


def generate_project_id(project_type: str = "TZ") -> str:
    """生成项目编号"""
    now = datetime.now()
    seq = now.strftime("%m%d")
    return f"{project_type}{seq}"


def main():
    parser = argparse.ArgumentParser(description="生成机械工程师标准化文档")
    parser.add_argument(
        "--template", "-t", required=True, help="模板类型"
    )
    parser.add_argument(
        "--data", "-d", help="JSON 数据文件路径"
    )
    parser.add_argument(
        "--output", "-o", required=True, help="输出文件路径"
    )
    parser.add_argument(
        "--project-id", help="指定项目编号（不指定则自动生成）"
    )

    args = parser.parse_args()

    # 加载数据
    data = {}
    if args.data and os.path.exists(args.data):
        with open(args.data, "r", encoding="utf-8") as f:
            data = json.load(f)

    # 自动填充项目编号
    if args.project_id:
        data["project_id"] = args.project_id
    elif "project_id" not in data:
        data["project_id"] = generate_project_id()

    # 加载并填充模板
    template = load_template(args.template)
    content = fill_template(template, data)

    # 保存输出（暂存为 Markdown，可后续转换为 docx）
    output_path = args.output
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"文档已生成: {output_path}")
    print(f"项目编号: {data['project_id']}")


if __name__ == "__main__":
    main()
