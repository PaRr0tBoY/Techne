---
name: parrot-design
description: >
  让 AI 按照用户指定的设计档案完成页面、工具页、组件和界面设计。技能默认不自动调用；用户手动调用时必须指定 design profile。支持由外部设计工具持续更新的 token、规范和组件适配层。
disable-model-invocation: true
---

# Parrot Design

本技能只在用户手动调用时使用。每次调用必须指定一个 Design Profile，例如：

```text
/skill:parrot-design scheme=polaris
```

未指定 Profile 时必须询问；不得自动选择、猜测或混用多个 Profile。

## 文件结构

- `references/profiles/<scheme>/manifest.json`：Profile 元数据、来源和版本
- `references/profiles/<scheme>/source/`：外部设计工具导出的解压文件，唯一上游来源
- `references/profiles/<scheme>/adapters/`：该 Profile 的组件适配规则和代码
- `references/components/`：跨 Profile 的通用行为组件（如 i18n、ARIA、contenteditable、reduced-motion）

外部 ZIP 必须先解压到 `source/`。不要把 ZIP 当运行时依赖，也不要手改 `source/`。同步新版本时只替换 `source/`，保留 `adapters/`。

## 工作流

1. 解析用户指定的 `scheme`，读取对应 `manifest.json`。
2. 读取该 Profile 的 `source/`：优先 DESIGN.md，再按需读取 token/CSS/JSON。
3. 按需求读取该 Profile 的 `adapters/` 组件；需要通用行为时再读取 `references/components/`。
4. 若需求未指定布局，按产品需求设计；Profile 只约束视觉语言和组件行为，不提供必须照搬的页面骨架。
5. 页面结构、导航位置、Hero、卡片数量和装饰取舍由用户需求决定。
6. 不得混用其他 Profile 的 token、组件规范或装饰语言。
7. 交付前验证原功能、响应式、明暗态、reduced-motion、i18n/a11y，并报告 Profile、版本和来源。

## 反套壳规则

- 允许复用 token、CSS 变量和 Profile 组件代码。
- 禁止整页复制任何模板或 demo；组件示例不是页面结构规范。
- 需求不需要的配图、Hero、bento、浮动顶栏或装饰不得自动添加。
- 页面应由需求和组件组合产生，而不是由某个参考页面改名产生。

## Profile 冲突

用户要求与 Profile 规范冲突时，指出冲突、给出 Profile 内替代方案并询问用户。Profile 之间的冲突不自动解决；改用另一个 Profile 必须由用户明确指定。

## 验证与交付

- HTML/组件：浏览器或等价运行验证，不只做静态检查。
- 修改现有页面：确认原有输入、数据处理、结果展示和跳转仍工作。
- 交付说明包含：`scheme`、Profile 版本、source 来源、使用的适配组件、验证结果和遗留项。
