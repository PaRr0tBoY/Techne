# Design Profiles

设计档案由外部设计工具导出，以解压后的文件形式放在各 Profile 的 `source/` 中。

## 当前 Profile

| ID | 名称 | 来源 | 选择方式 |
|---|---|---|---|
| `polaris` | Polaris | `C:/Users/Acid/Downloads/Polaris-delivery.zip` | 必须显式指定 |

## 规则

- `source/` 是外部设计工具的上游发布内容；同步新档案时替换它，不手改。
- `adapters/` 是本技能为该方案补充的组件适配规则，不随 ZIP 覆盖。
- `manifest.json` 记录来源、版本和路径。
- 未指定 Profile 时必须询问，不得自动选择或混用多个 Profile。
- 不同 Profile 的 token、组件规范和装饰语言不得混用。
