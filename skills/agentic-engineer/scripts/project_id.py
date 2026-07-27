#!/usr/bin/env python3
"""
项目编号生成器
按规则生成新的项目编号

编号规则:
    - TZ 系列: TZ + 四位流水号（如 TZ0009）
    - 投资系列: 投【YYYY】-装备-A###（如 投【2023】-装备-A006）
    - 自定义: 用户指定前缀 + 流水号

用法:
    python project_id.py --type tz --last 9
    python project_id.py --type invest --year 2024 --last 5
    python project_id.py --prefix JK --last 12
"""

import argparse
from datetime import datetime


def generate_tz_id(last_seq: int = 0) -> str:
    """生成 TZ 系列编号"""
    new_seq = last_seq + 1
    return f"TZ{new_seq:04d}"


def generate_invest_id(year: int = None, last_seq: int = 0) -> str:
    """生成投资系列编号"""
    if year is None:
        year = datetime.now().year
    new_seq = last_seq + 1
    return f"投【{year}】-装备-A{new_seq:03d}"


def generate_custom_id(prefix: str, last_seq: int = 0, digits: int = 3) -> str:
    """生成自定义编号"""
    new_seq = last_seq + 1
    return f"{prefix}{new_seq:0{digits}d}"


def main():
    parser = argparse.ArgumentParser(description="项目编号生成器")
    parser.add_argument(
        "--type", "-t",
        choices=["tz", "invest", "custom"],
        default="tz",
        help="编号类型"
    )
    parser.add_argument(
        "--last", "-l",
        type=int,
        default=0,
        help="上一个流水号"
    )
    parser.add_argument(
        "--year", "-y",
        type=int,
        default=None,
        help="年份（投资系列使用）"
    )
    parser.add_argument(
        "--prefix", "-p",
        type=str,
        default="",
        help="自定义前缀"
    )
    parser.add_argument(
        "--digits", "-d",
        type=int,
        default=3,
        help="流水号位数"
    )
    parser.add_argument(
        "--count", "-c",
        type=int,
        default=1,
        help="生成数量"
    )

    args = parser.parse_args()

    ids = []
    for i in range(args.count):
        offset = args.last + i
        if args.type == "tz":
            pid = generate_tz_id(offset)
        elif args.type == "invest":
            pid = generate_invest_id(args.year, offset)
        else:
            if not args.prefix:
                print("错误: 自定义类型需要指定 --prefix")
                return
            pid = generate_custom_id(args.prefix, offset, args.digits)
        ids.append(pid)

    for pid in ids:
        print(pid)


if __name__ == "__main__":
    main()
