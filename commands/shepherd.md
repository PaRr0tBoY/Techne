---
description: "基于 GitHub Issue/PR 在 herdr 中创建独立开发环境（worktree + 分支 + 标签页 + Agent）"
---
调用 `/herdr` 技能，根据用户提供的 GitHub Issue 或 Pull Request 链接创建独立开发环境。

执行流程：

1. 解析用户提供的 Issue 或 PR 链接，获取仓库、编号、标题、默认分支及其他必要信息。
2. 校验当前项目与 Issue/PR 所属仓库是否一致；若不一致，则停止执行并提示用户确认。
3. 检查是否已存在与该 Issue/PR 对应的 Git worktree、分支及 Herdr 标签页。
4. 若不存在，则：

   * 在 `C:\Users\Acid\AppData\Roaming\herdr\worktree\` 下创建新的 Git worktree。
   * **Issue**：基于项目 `main` 分支创建新分支。
   * **Pull Request**：同样基于项目 `main` 分支创建新分支。
   * 分支命名优先遵循项目已有规范；若无规范，则使用：

     * `issue/<编号>-<slug>`
     * `pr/<编号>-<slug>`
   * `slug` 使用 Issue/PR 标题自动生成，统一转换为小写 `kebab-case`，移除非法字符，并截断至合理长度。
5. 若对应 worktree、分支或 Herdr 标签页已存在，则直接复用，不重复创建。
6. 在**当前 Spaces**中新建或切换到对应的 **Herdr 标签页（Herdr Tab）**，不得打开新的 Window 或新的 Spaces。该标签页的工作目录必须指向对应的 worktree。
7. 在该 Herdr 标签页中启动用户指定的 Agent（例如 `omp`），工作目录设置为该 worktree。
8. 将对应的 Issue 或 PR 作为唯一任务上下文提供给 Agent，使其可以立即开始工作。

要求：

* 不修改当前标签页、当前工作目录、当前分支及未提交修改。
* worktree 必须统一存放于 `C:\Users\Acid\AppData\Roaming\herdr\worktree\`，不得创建在仓库目录内。
* 整个流程必须具备幂等性，多次执行不会创建重复的 worktree、分支、Herdr 标签页或 Agent。
* 若目标 Herdr 标签页已存在，则直接切换；若其中已运行相同 Agent，则直接复用，不重复启动。
* 自动处理分支名中的非法字符，确保生成合法、可读且稳定的名称。
* 若发现已注册的 worktree 已失效（如目录不存在），应自动清理失效引用后重新创建。
* 任一步骤失败时，应自动回滚本次新增的 worktree、分支及其他临时资源，避免遗留半完成状态。
* 除非用户明确要求，否则不要自动执行代码修改、构建、测试、提交或推送，仅完成开发环境准备。

完成后返回：

* Issue/PR 编号及标题
* worktree 路径
* 分支名称
* Herdr 标签页名称
* 启动或复用的 Agent
* 创建或复用情况
* 执行过程中进行的自动修正或异常处理（如有）

$ARGUMENTS
