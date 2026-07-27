#!/usr/bin/env python3
"""
root_cause_toolkit.py
用于 /investigation 深挖疑点、/capa 生成根因分析框架。

不做智能推断——只生成结构化的空白模板（Markdown），
由 Claude 或用户在对话中填入具体内容。这样可以保证
根因分析过程留痕、可复核，而不是直接给结论。

用法：
    python3 root_cause_toolkit.py 5why "问题描述"
    python3 root_cause_toolkit.py fishbone "问题描述"
    python3 root_cause_toolkit.py pareto "问题描述" 项目1 项目2 项目3
    python3 root_cause_toolkit.py all "问题描述"
"""

import sys


def five_why(problem: str) -> str:
    lines = [f"### 5Why 分析：{problem}", "", "| 层级 | 提问 | 回答 |", "|---|---|---|"]
    prompt = problem
    for i in range(1, 6):
        lines.append(f"| Why {i} | 为什么会发生「{prompt}」？ | |")
        prompt = "（上一层的回答）"
    return "\n".join(lines)


def fishbone(problem: str) -> str:
    categories = ["人（Man）", "机（Machine）", "料（Material）", "法（Method）", "环（Environment）"]
    lines = [f"### 鱼骨图分析：{problem}", "", "| 类别 | 可能原因 | 是否验证为根因 |", "|---|---|---|"]
    for c in categories:
        lines.append(f"| {c} | | |")
    return "\n".join(lines)


def pareto(problem: str, items: list) -> str:
    lines = [f"### Pareto 排序：{problem}", "", "| 失效模式 | 发生次数 | 占比 | 累计占比 |", "|---|---|---|---|"]
    if not items:
        lines.append("| （待填入各失效模式） | | | |")
    else:
        for item in items:
            lines.append(f"| {item} | | | |")
    return "\n".join(lines)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    mode = sys.argv[1]
    problem = sys.argv[2]
    extra = sys.argv[3:]

    outputs = []
    if mode in ("5why", "all"):
        outputs.append(five_why(problem))
    if mode in ("fishbone", "all"):
        outputs.append(fishbone(problem))
    if mode in ("pareto", "all"):
        outputs.append(pareto(problem, extra))

    if not outputs:
        print(f"未知模式：{mode}（可选：5why / fishbone / pareto / all）")
        sys.exit(1)

    print("\n\n".join(outputs))


if __name__ == "__main__":
    main()
