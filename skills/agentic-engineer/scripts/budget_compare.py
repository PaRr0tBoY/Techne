#!/usr/bin/env python3
"""
供应商报价对比分析表生成脚本
将多个供应商的报价数据整理为标准化对比表

用法:
    python budget_compare.py --input <报价数据JSON> --output <Excel文件路径>

输入JSON格式示例:
{
    "project_name": "皮带机采购",
    "items": [
        {"name": "皮带机", "spec": "B1000x23.5m", "qty": 1, "unit": "台"}
    ],
    "suppliers": [
        {
            "name": "供应商A",
            "contact": "张三",
            "quote_date": "2024-06-01",
            "items": [{"unit_price": 150000, "remarks": "含运费"}],
            "transport": 5000,
            "install": 10000,
            "training": 0,
            "warranty": "12个月"
        }
    ]
}
"""

import argparse
import json
import os
from datetime import datetime


def create_comparison_table(data: dict) -> str:
    """生成 Markdown 格式的报价对比表"""
    suppliers = data.get("suppliers", [])
    items = data.get("items", [])

    lines = []
    lines.append(f"# {data.get('project_name', '报价对比分析')}")
    lines.append(f"\n生成日期: {datetime.now().strftime('%Y-%m-%d')}\n")

    # 供应商汇总表
    lines.append("## 一、供应商报价汇总\n")
    header = "| 项目 |" + "|".join([s["name"] for s in suppliers]) + "| 备注 |"
    lines.append(header)
    sep = "|" + "---|" * (len(suppliers) + 2)
    lines.append(sep)

    rows = [
        ("联系人", [s.get("contact", "") for s in suppliers], ""),
        ("报价日期", [s.get("quote_date", "") for s in suppliers], ""),
        ("设备总价(元)", [f"{sum(i.get('unit_price', 0) for i in s.get('items', [])):,.2f}" for s in suppliers], "不含税/含税"),
        ("运输费(元)", [f"{s.get('transport', 0):,.2f}" for s in suppliers], ""),
        ("安装调试费(元)", [f"{s.get('install', 0):,.2f}" for s in suppliers], ""),
        ("培训费(元)", [f"{s.get('training', 0):,.2f}" for s in suppliers], ""),
        ("质保期", [s.get("warranty", "") for s in suppliers], ""),
    ]

    totals = []
    for s in suppliers:
        item_total = sum(i.get("unit_price", 0) for i in s.get("items", []))
        total = item_total + s.get("transport", 0) + s.get("install", 0) + s.get("training", 0)
        totals.append(f"{total:,.2f}")
    rows.append(("**合计(元)**", totals, ""))

    for label, values, remark in rows:
        row = f"| {label} |" + "|".join(values) + f"| {remark} |"
        lines.append(row)

    # 分项明细
    if items:
        lines.append("\n## 二、分项报价明细\n")
        header = "| 序号 | 名称 | 规格 | 数量 |" + "|".join([s["name"] + "单价" for s in suppliers]) + "| 单位 |"
        lines.append(header)
        sep = "|" + "---|" * (4 + len(suppliers) + 1)
        lines.append(sep)

        for i, item in enumerate(items):
            row_vals = []
            for s in suppliers:
                s_items = s.get("items", [])
                if i < len(s_items):
                    row_vals.append(f"{s_items[i].get('unit_price', 0):,.2f}")
                else:
                    row_vals.append("-")
            row = f"| {i+1} | {item.get('name', '')} | {item.get('spec', '')} | {item.get('qty', '')} |" + "|".join(row_vals) + f"| {item.get('unit', '')} |"
            lines.append(row)

    # 综合评价框架
    lines.append("\n## 三、综合评价\n")
    lines.append("| 评价维度 | 权重 |" + "|".join([s["name"] for s in suppliers]) + "|")
    lines.append("|" + "---|" * (2 + len(suppliers)))
    for dim in ["报价合理性", "技术能力", "交付周期", "售后服务", "品牌信誉"]:
        lines.append(f"| {dim} | 待填 |" + "|".join(["待评分" for _ in suppliers]) + "|")

    lines.append("\n## 四、推荐方案\n")
    lines.append("**首选方案**: （待填写）\n")
    lines.append("**备选方案**: （待填写）\n")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="生成报价对比分析表")
    parser.add_argument("--input", "-i", required=True, help="报价数据 JSON 文件")
    parser.add_argument("--output", "-o", required=True, help="输出文件路径 (.md)")

    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)

    content = create_comparison_table(data)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"报价对比表已生成: {args.output}")


if __name__ == "__main__":
    main()
