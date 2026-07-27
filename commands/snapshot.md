---
description: "创建开发快照：commit + annotated tag，作为可回退的迭代基线"
---
当前任务已基本完成，但预计后续仍会继续优化。

请为当前仓库创建一个可随时回退的开发快照，作为后续迭代的基线。

执行流程：

检查当前工作区，确认所有需要保留的修改均已纳入本次快照，不提交与当前开发主题无关的文件。
创建一个 Git Commit 作为快照。
Commit Message 使用英文。
优先遵循项目已有 Commit 规范（如 Conventional Commits）。
若无规范，则使用清晰、简洁、描述性的英文 Commit Message。
Commit 应明确表示这是一个开发快照（Checkpoint），而非最终完成版本。
在该 Commit 上创建一个带注释（Annotated Tag）的 Git Tag。
Tag 名称优先遵循项目已有规范。
若无规范，则使用：
checkpoint/<yyyy-mm-dd>-<branch-name>
Tag Message 简要说明该快照的用途。
若同名 Tag 已存在，应自动生成新的唯一名称，不覆盖已有 Tag。
默认仅在本地创建 Commit 和 Tag；除非用户明确要求，否则不要推送 Commit 或 Tag 到远程仓库。

要求：

不提交与当前开发主题无关的修改。
不执行 git add . 或其他会无差别暂存全部文件的操作，除非已确认所有修改均属于本次开发内容。
不修改当前分支。
不创建额外分支。
不删除任何 Commit、Branch 或 Tag。
整个流程不得执行任何可能导致历史重写或数据丢失的 Git 操作（如 reset --hard、rebase、push --force 等）。

完成后返回：

Commit Hash
Commit Message
Tag 名称
Tag Message
Tag 对应的 Commit
当前分支名称
当前工作区状态（是否仍有未提交修改）
若存在未纳入快照的文件，明确列出原因。
