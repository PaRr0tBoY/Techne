# Vivaldi Browser APIs Reference

> 通过 CDP `Runtime.evaluate` 在 window.html 上下文中调用的 API 参考。
> **关键区别**：标准 Chrome 扩展 API 在 `chrome.*` 下，Vivaldi 私有 API 在 `self.vivaldi.*` 下。

## 执行方式

```bash
node .claude/skills/vivaldi-browser/scripts/cdp-client.mjs -e '<JS_CODE>'
```

代码运行在 `window.html` 上下文，自动 async 包装，直接用 `return` 返回数据。

---

# A类 — 偏好系统 (Preferences)

`self.vivaldi.prefs` 提供对 Vivaldi 全部 600+ 设置项的读写。偏好路径格式为 `vivaldi.<category>.<subcategory>.<key>`。

## A.0 prefs API 方法

```js
// 读取偏好（回调模式）
self.vivaldi.prefs.get('PATH', value => { /* value is the current setting */ });

// 设置偏好（同步生效）
self.vivaldi.prefs.set('PATH', newValue);

// 重置全部偏好为默认值
self.vivaldi.prefs.resetAllToDefault();
```

## A.1 读取偏好

```js
return await new Promise(resolve => {
  self.vivaldi.prefs.get('vivaldi.tabs.bar.position', value => resolve({ path: 'vivaldi.tabs.bar.position', value }));
});
```

## A.2 批量读取多个偏好

```js
const paths = [
  'vivaldi.tabs.bar.position',
  'vivaldi.tabs.visible',
  'vivaldi.address_bar.visible',
  'vivaldi.status_bar.display',
  'vivaldi.bookmarks.bar.visible',
  'vivaldi.panels.position'
];
const results = {};
for (const path of paths) {
  results[path] = await new Promise(r => self.vivaldi.prefs.get(path, r));
}
return results;
```

## A.3 按类别获取偏好（搜索）

```js
// 这里通过遍历已知路径前缀来发现偏好
// Vivaldi 偏好路径遵循分类层级结构
const categories = {
  'vivaldi.tabs': '标签页',
  'vivaldi.address_bar': '地址栏',
  'vivaldi.bookmarks': '书签',
  'vivaldi.panels': '面板',
  'vivaldi.status_bar': '状态栏',
  'vivaldi.theme': '主题',
  'vivaldi.startpage': '起始页',
  'vivaldi.downloads': '下载',
  'vivaldi.mail': '邮件',
  'vivaldi.calendar': '日历',
  'vivaldi.webpages': '网页',
  'vivaldi.keyboard': '键盘',
  'vivaldi.mouse_gestures': '鼠标手势',
  'vivaldi.tabs.stacking': '标签栈',
  'vivaldi.tabs.tiling': '分屏',
  'vivaldi.workspaces': '工作区',
  'vivaldi.privacy': '隐私',
  'vivaldi.appearance': '外观',
  'vivaldi.sync': '同步',
  'vivaldi.quick_commands': '快捷命令',
  'vivaldi.sessions': '会话',
  'vivaldi.notes': '笔记',
  'vivaldi.reading_list': '阅读列表',
  'vivaldi.auto_hide': '自动隐藏',
  'vivaldi.incognito': '隐私窗口'
};
return categories;
```

## A.4 修改单个偏好

```js
// ⚠️ 修改偏好会立即生效，请确认用户想要此操作
self.vivaldi.prefs.set('vivaldi.tabs.bar.position', 'BOTTOM_VALUE');
return await new Promise(resolve => {
  setTimeout(() => {
    self.vivaldi.prefs.get('vivaldi.tabs.bar.position', value => resolve({ updated: 'vivaldi.tabs.bar.position', newValue: value }));
  }, 200);
});
```

## A.5 常用偏好路径速查

### 标签页
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.tabs.bar.position` | string | 标签栏位置: `"top"`, `"bottom"`, `"left"`, `"right"`, `"none"` |
| `vivaldi.tabs.visible` | boolean | 显示标签栏 |
| `vivaldi.tabs.close_button_permanent` | boolean | 始终显示关闭按钮 |
| `vivaldi.tabs.show_close_button` | boolean | 显示关闭按钮 |
| `vivaldi.tabs.minimize` | boolean | 标签页最小宽度 |
| `vivaldi.tabs.activation.on_close` | string | 关闭标签后激活 |
| `vivaldi.tabs.activation.on_clone` | boolean | 克隆后激活 |
| `vivaldi.tabs.open_new_in_background` | boolean | 后台打开新标签 |
| `vivaldi.tabs.new_placement` | string | 新标签位置 |
| `vivaldi.tabs.cycle_by_recent_order` | boolean | 按最近顺序切换 |
| `vivaldi.tabs.double_click` | string | 双击标签行为 |
| `vivaldi.tabs.double_click_close` | boolean | 双击关闭标签 |
| `vivaldi.tabs.show_trash_can` | boolean | 显示已关闭标签按钮 |
| `vivaldi.tabs.thumbnails` | boolean | 标签缩略图 |
| `vivaldi.tabs.tooltip` | boolean | 标签提示 |
| `vivaldi.tabs.unread` | boolean | 未读标签指示器 |
| `vivaldi.tabs.dim_hibernated` | boolean | 休眠标签变暗 |
| `vivaldi.tabs.horizontal_scrolling` | boolean | 标签水平滚动 |
| `vivaldi.tabs.confirm_closing_tabs` | boolean | 关闭多个标签时确认 |
| `vivaldi.tabs.never_close_last` | boolean | 不关闭最后一个标签 |
| `vivaldi.tabs.close_pinned` | boolean | 允许关闭固定标签 |
| `vivaldi.tabs.auto_muting` | boolean | 自动静音 |
| `vivaldi.tabs.always_load_pinned_after_restore` | boolean | 恢复后加载固定标签 |

### 标签栈
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.tabs.stacking.mode` | string | 栈模式: `"compact"`, `"accordion"`, `"two_level"` |
| `vivaldi.tabs.stacking.allow_dnd` | boolean | 允许拖拽入栈 |
| `vivaldi.tabs.stacking.dnd_delay` | number | 拖拽延迟 (ms) |
| `vivaldi.tabs.stacking.auto_expand` | boolean | 自动展开 |
| `vivaldi.tabs.stacking.open_in_current` | boolean | 在当前栈打开 |
| `vivaldi.tabs.stacking.allow_rename` | boolean | 允许重命名 |

### 分屏
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.tabs.tiling.collapse_border` | boolean | 折叠边框 |
| `vivaldi.tabs.tiling.show_titlebar` | boolean | 显示标题栏 |
| `vivaldi.tabs.tiling.drag_and_drop` | boolean | 拖拽分屏 |

### 地址栏
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.address_bar.visible` | boolean | 显示地址栏 |
| `vivaldi.address_bar.position` | string | 地址栏位置 |
| `vivaldi.address_bar.show_full_url` | boolean | 显示完整 URL |
| `vivaldi.address_bar.show_progress` | boolean | 显示加载进度 |
| `vivaldi.address_bar.select_on_click` | boolean | 点击选中全部 |
| `vivaldi.address_bar.highlight_base_domain` | boolean | 高亮基础域名 |
| `vivaldi.address_bar.strip_javascript_on_paste` | boolean | 粘贴时去除 javascript: |
| `vivaldi.address_bar.omnibox.enabled` | boolean | 启用下拉建议 |
| `vivaldi.address_bar.omnibox.show_bookmarks` | boolean | 建议中书签 |
| `vivaldi.address_bar.omnibox.show_typed_history` | boolean | 建议中已输入历史 |
| `vivaldi.address_bar.omnibox.show_browser_history` | boolean | 建议中浏览历史 |
| `vivaldi.address_bar.omnibox.show_search_history` | boolean | 建议中搜索历史 |
| `vivaldi.address_bar.search.suggest_enabled` | boolean | 搜索建议 |
| `vivaldi.address_bar.search.in_new_tab` | boolean | 搜索在新标签打开 |
| `vivaldi.address_bar.search.field_width` | number | 搜索字段宽度 |
| `vivaldi.address_bar.inline_search.enabled` | boolean | 内联搜索 |

### 面板
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.panels.position` | string | 面板位置: `"left"`, `"right"` |
| `vivaldi.panels.show_toggle` | boolean | 显示面板切换按钮 |
| `vivaldi.panels.show_close_button` | boolean | 显示关闭按钮 |
| `vivaldi.panels.as_overlay.enabled` | boolean | 浮动面板模式 |
| `vivaldi.panels.as_overlay.auto_close` | boolean | 自动关闭浮动面板 |
| `vivaldi.panels.lazy_load` | boolean | 延迟加载面板 |

### 状态栏
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.status_bar.display` | string | 显示模式: `"shown"`, `"hidden"`, `"minimized"` |
| `vivaldi.status_bar.minimized` | boolean | 最小化状态栏 |

### 书签栏
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.bookmarks.bar.visible` | boolean | 显示书签栏 |
| `vivaldi.bookmarks.bar.position` | string | 书签栏位置 |
| `vivaldi.bookmarks.bar.display` | string | 显示模式 |
| `vivaldi.bookmarks.open_in_new_tab` | boolean | 新标签打开书签 |
| `vivaldi.bookmarks.single_click_opens` | boolean | 单击打开书签 |

### 起始页 / 快速拨号
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.startpage.speed_dial.columns` | number | 快速拨号列数 |
| `vivaldi.startpage.speed_dial.width` | number | 宽度 |
| `vivaldi.startpage.speed_dial.size` | string | 大小: `"small"`, `"medium"`, `"large"` |
| `vivaldi.startpage.speed_dial.titles_visible` | boolean | 显示标题 |
| `vivaldi.startpage.speed_dial.add_button_visible` | boolean | 显示添加按钮 |
| `vivaldi.startpage.image.enable` | boolean | 启用背景图 |
| `vivaldi.startpage.navigation` | boolean | 显示导航 |

### 外观
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.appearance.density` | string | UI 密度 |
| `vivaldi.appearance.disable_title_bar` | boolean | 禁用标题栏 |
| `vivaldi.appearance.range_buttons` | boolean | 范围按钮 |
| `vivaldi.appearance.hud.enabled` | boolean | HUD 菜单 |
| `vivaldi.appearance.css_ui_mods_directory` | string | CSS mod 目录 |
| `vivaldi.appearance.force_dark_mode_theme` | boolean | 强制深色主题 |

### 主题
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.theme.schedule.enabled` | boolean | 启用主题调度 |
| `vivaldi.theme.schedule.timeline` | array | 调度时间线 |
| `vivaldi.theme.use_animation` | boolean | 主题动画 |
| `vivaldi.theme.dim_blurred` | boolean | 模糊窗口变暗 |
| `vivaldi.theme.simple_scrollbar` | boolean | 简洁滚动条 |
| `vivaldi.theme.prefer_system_accent` | boolean | 跟随系统强调色 |
| `vivaldi.themes.current` | string | 当前主题 ID |
| `vivaldi.themes.user` | array | 用户主题列表 |

### 网页
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.webpages.smooth_scrolling.enabled` | boolean | 平滑滚动 |
| `vivaldi.webpages.tab_zoom.enabled` | boolean | 标签页缩放 |
| `vivaldi.webpages.full_screen.hide_mouse` | boolean | 全屏隐藏鼠标 |
| `vivaldi.webpages.picture_in_picture_button.enabled` | boolean | 画中画按钮 |
| `vivaldi.webpages.tab_focuses_links` | boolean | Tab 聚焦链接 |
| `vivaldi.webpages.spatial_navigation.enabled` | boolean | 空间导航 |
| `vivaldi.webpages.capture.save_location` | string | 截图保存位置 |
| `vivaldi.webpages.capture.capture_mode` | string | 截图模式 |
| `vivaldi.webpages.reader.style` | string | 阅读模式样式 |

### 键盘
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.keyboard.shortcuts.enable` | boolean | 启用快捷键 |
| `vivaldi.keyboard.shortcuts.enable_single_key` | boolean | 启用单键快捷键 |
| `vivaldi.keyboard.tab_to_all` | boolean | Tab 遍历所有控件 |

### 鼠标手势
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.mouse_gestures.enabled` | boolean | 启用手势 |
| `vivaldi.mouse_gestures.stroke_tolerance` | number | 手势容差 |
| `vivaldi.mouse_gestures.alt_gestures_enabled` | boolean | Alt 手势 |
| `vivaldi.mouse_gestures.rocker_gestures.enabled` | boolean | 摇杆手势 |
| `vivaldi.mouse_wheel.tab_switch` | boolean | 滚轮切换标签 |
| `vivaldi.mouse_wheel.page_zoom` | boolean | 滚轮缩放 |

### 工作区
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.workspaces.enabled` | boolean | 启用工作区 |
| `vivaldi.workspaces.button.show_in_tabbar` | boolean | 标签栏显示按钮 |
| `vivaldi.workspaces.button.show_name` | boolean | 显示名称 |
| `vivaldi.workspaces.button.mouse_wheel_enabled` | boolean | 滚轮切换 |

### 下载
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.downloads.open_panel_on_new` | boolean | 新下载打开面板 |
| `vivaldi.downloads.notify_on_complete` | boolean | 下载完成通知 |
| `vivaldi.downloads.start_automatically` | boolean | 自动开始下载 |

### 隐私
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.privacy.ad_blocker.enable_document_blocking` | boolean | 广告拦截 |
| `vivaldi.privacy.adverse_ad_block.enabled` | boolean | 反广告 |
| `vivaldi.privacy.block_pings.enabled` | boolean | 阻止追踪 |

### 自动隐藏
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.auto_hide.enabled` | boolean | 启用自动隐藏 |
| `vivaldi.auto_hide.tab_bar` | boolean | 自动隐藏标签栏 |
| `vivaldi.auto_hide.address_bar` | boolean | 自动隐藏地址栏 |
| `vivaldi.auto_hide.panel` | boolean | 自动隐藏面板 |
| `vivaldi.auto_hide.status_bar` | boolean | 自动隐藏状态栏 |
| `vivaldi.auto_hide.bookmarks_bar` | boolean | 自动隐藏书签栏 |
| `vivaldi.auto_hide.in_fullscreen` | boolean | 全屏时自动隐藏 |

### 菜单
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.menu.display` | string | 菜单显示: `"horizontal"`, `"vertical"` |
| `vivaldi.menu.icon_type` | string | 菜单图标类型 |
| `vivaldi.menu.compact` | boolean | 紧凑菜单 |

### 会话
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.sessions.save_on_exit` | boolean | 退出时保存会话 |
| `vivaldi.sessions.save_all_workspaces` | boolean | 保存所有工作区 |
| `vivaldi.sessions.open_in_new_window` | boolean | 新窗口打开会话 |
| `vivaldi.sessions.save_days` | number | 自动保存天数 |

### 设置窗口
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.settings.in_tab` | boolean | 标签页中打开设置 |
| `vivaldi.settings.mono_icons` | boolean | 单色图标 |

### 窗口
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.windows.use_native_decoration` | boolean | 原生窗口装饰 |
| `vivaldi.windows.linux_alt_controls` | boolean | Linux Alt 控件 |
| `vivaldi.windows.show_window_close_confirmation_dialog` | boolean | 关闭确认 |

### 启动
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.startup.check_is_default` | boolean | 检查默认浏览器 |
| `vivaldi.startup.remember_full_screen` | boolean | 记住全屏 |

### 翻译
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.translate.enabled` | boolean | 启用翻译 |
| `vivaldi.translate.target_language` | string | 目标语言 |

### 快捷命令
| 路径 | 类型 | 说明 |
|------|------|------|
| `vivaldi.quick_commands.show_bookmarks` | boolean | 显示书签 |
| `vivaldi.quick_commands.show_notes` | boolean | 显示笔记 |
| `vivaldi.quick_commands.show_history` | boolean | 显示历史 |
| `vivaldi.quick_commands.show_closed_tabs` | boolean | 显示关闭的标签 |
| `vivaldi.quick_commands.limit_results` | number | 结果数量限制 |

## A.6 偏好快照（导出全部可见状态）

```js
const categories = {
  'Tab Bar': ['vivaldi.tabs.bar.position', 'vivaldi.tabs.visible', 'vivaldi.tabs.show_close_button', 'vivaldi.tabs.close_button_permanent', 'vivaldi.tabs.thumbnails', 'vivaldi.tabs.tooltip'],
  'Tab Behavior': ['vivaldi.tabs.activation.on_close', 'vivaldi.tabs.open_new_in_background', 'vivaldi.tabs.cycle_by_recent_order', 'vivaldi.tabs.confirm_closing_tabs', 'vivaldi.tabs.auto_muting'],
  'Tab Stacks': ['vivaldi.tabs.stacking.mode', 'vivaldi.tabs.stacking.allow_dnd', 'vivaldi.tabs.stacking.auto_expand'],
  'Address Bar': ['vivaldi.address_bar.visible', 'vivaldi.address_bar.show_full_url', 'vivaldi.address_bar.omnibox.enabled'],
  'Panels': ['vivaldi.panels.position', 'vivaldi.panels.as_overlay.enabled', 'vivaldi.panels.show_toggle'],
  'Status Bar': ['vivaldi.status_bar.display'],
  'Bookmarks': ['vivaldi.bookmarks.bar.visible', 'vivaldi.bookmarks.open_in_new_tab'],
  'Theme': ['vivaldi.theme.schedule.enabled', 'vivaldi.theme.use_animation', 'vivaldi.theme.prefer_system_accent'],
  'Start Page': ['vivaldi.startpage.speed_dial.columns', 'vivaldi.startpage.speed_dial.size'],
  'Gestures': ['vivaldi.mouse_gestures.enabled', 'vivaldi.mouse_gestures.rocker_gestures.enabled'],
  'Workspaces': ['vivaldi.workspaces.enabled', 'vivaldi.workspaces.button.show_in_tabbar'],
  'Appearance': ['vivaldi.appearance.density', 'vivaldi.appearance.disable_title_bar'],
  'Auto-hide': ['vivaldi.auto_hide.enabled', 'vivaldi.auto_hide.tab_bar', 'vivaldi.auto_hide.address_bar'],
  'Startup': ['vivaldi.startup.check_is_default'],
  'Downloads': ['vivaldi.downloads.open_panel_on_new', 'vivaldi.downloads.notify_on_complete']
};

const snapshot = {};
for (const [category, paths] of Object.entries(categories)) {
  snapshot[category] = {};
  for (const path of paths) {
    snapshot[category][path] = await new Promise(r => self.vivaldi.prefs.get(path, r));
  }
}
return snapshot;
```

## A.7 安全注意事项

修改偏好是**破坏性操作**，直接生效且不可撤销（除非记住旧值手动恢复）。

修改前规则：
1. **先读后写** — 始终先 `get` 当前值，确认后再 `set`
2. **确认关键设置** — 修改 `vivaldi.tabs.bar.position`、`vivaldi.panels.position` 等布局设置前，告知用户效果
3. **批量修改时间隔** — 多个 `set` 之间加 `await new Promise(r => setTimeout(r, 100))`，避免竞态
4. **可恢复** — 每次修改前记录旧值，便于回滚

---

# B类 — 浏览器数据操作

> **关键区别**：标准 Chrome 扩展 API 在 `chrome.*` 下，Vivaldi 私有 API 在 `self.vivaldi.*` 下。

## API 命名空间速查

| 命名空间 | 可用性 | 包含 API |
|----------|--------|----------|
| `chrome.tabs` | ✅ | 标签页查询 |
| `chrome.bookmarks` | ✅ | 书签操作 |
| `chrome.history` | ✅ | 历史记录 |
| `chrome.downloads` | ✅ | 下载管理 |
| `chrome.windows` | ✅ | 窗口信息 |
| `chrome.sessions` | ✅ | 最近关闭的标签页/窗口 |
| `self.vivaldi.notes` | ✅ | 笔记 |
| `self.vivaldi.contacts` | ✅ | 联系人 |
| `self.vivaldi.searchEngines` | ✅ | 搜索引擎 |
| `self.vivaldi.readingListPrivate` | ✅ | 阅读列表 |
| `self.vivaldi.sessionsPrivate` | ✅ | 保存的会话 |
| `self.vivaldi.bookmarksPrivate` | ✅ | 书签私有操作 |
| `self.vivaldi.historyPrivate` | ✅ | 历史私有操作 |
| `self.vivaldi.tabsPrivate` | ✅ | 标签页私有操作 |

---

## B.1 标签页 (Tabs)

### 获取所有标签页
```js
const tabs = await chrome.tabs.query({});
return tabs.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active, pinned: t.pinned, windowId: t.windowId, index: t.index, status: t.status, muted: t.mutedInfo?.muted, groupId: t.groupId }));
```

### 获取当前窗口标签页
```js
const currentWindow = await chrome.windows.getCurrent();
const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
return tabs.map(t => ({ id: t.id, title: t.title, url: t.url, active: t.active, pinned: t.pinned, index: t.index }));
```

### 创建/关闭/移动标签页
```js
const tab = await chrome.tabs.create({ url: 'URL', active: true });
return { id: tab.id, title: tab.title };
// ---
await chrome.tabs.remove(TAB_ID);
return { closed: TAB_ID };
// ---
const tab = await chrome.tabs.move(TAB_ID, { index: 0 });
return tab;
```

### 标签页统计摘要
```js
const tabs = await chrome.tabs.query({});
const windows = await chrome.windows.getAll();
return {
  totalTabs: tabs.length,
  totalWindows: windows.length,
  activeTabs: tabs.filter(t => t.active).length,
  pinnedTabs: tabs.filter(t => t.pinned).length,
  audibleTabs: tabs.filter(t => t.audible).length,
  uniqueDomains: [...new Set(tabs.map(t => { try { return new URL(t.url).hostname; } catch { return ''; } }).filter(Boolean))].length
};
```

---

## B.2 书签 (Bookmarks)

### 获取书签树（展平）
```js
const tree = await chrome.bookmarks.getTree();
function flatten(nodes) {
  let result = [];
  for (const n of nodes) {
    if (n.url) result.push({ title: n.title, url: n.url, id: n.id, parentId: n.parentId, dateAdded: n.dateAdded });
    if (n.children) result = result.concat(flatten(n.children));
  }
  return result;
}
return flatten(tree);
```

### 搜索书签
```js
const results = await chrome.bookmarks.search('KEYWORD');
return results.map(b => ({ id: b.id, title: b.title, url: b.url }));
```

### 最近书签
```js
const results = await chrome.bookmarks.getRecent(20);
return results.map(b => ({ id: b.id, title: b.title, url: b.url }));
```

### 统计
```js
const tree = await chrome.bookmarks.getTree();
function count(nodes) {
  let total = 0, folders = 0;
  for (const n of nodes) {
    if (n.url) total++; else folders++;
    if (n.children) { const c = count(n.children); total += c.total; folders += c.folders; }
  }
  return { total, folders };
}
return count(tree);
```

---

## B.3 笔记 (Notes) — `self.vivaldi.notes`

### 获取所有笔记
```js
return await new Promise(resolve => {
  self.vivaldi.notes.getTree(notes => {
    function flatten(nodes) {
      let result = [];
      for (const n of nodes) {
        if (n.content) result.push({ id: n.id, title: n.title, content: n.content?.substring?.(0, 300), url: n.url, dateAdded: n.dateAdded, type: n.type });
        if (n.children) result = result.concat(flatten(n.children));
      }
      return result;
    }
    resolve(flatten(notes));
  });
});
```

### 搜索笔记
```js
return await new Promise(resolve => {
  self.vivaldi.notes.search('KEYWORD', results => {
    resolve(results.map(n => ({ id: n.id, title: n.title, content: n.content?.substring?.(0, 200), url: n.url })));
  });
});
```

### 创建/删除笔记
```js
return await new Promise(resolve => {
  self.vivaldi.notes.create({ title: 'TITLE', content: 'CONTENT', url: 'URL' }, note => resolve(note));
});
// ---
return await new Promise(resolve => {
  self.vivaldi.notes.remove('NOTE_ID', () => resolve({ deleted: 'NOTE_ID' }));
});
```

---

## B.4 历史记录 (History)

### 今天的历史
```js
const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
return await new Promise(resolve => {
  chrome.history.search({ text: '', startTime: dayAgo, maxResults: 500 }, results => {
    resolve(results.map(h => ({
      id: h.id, title: h.title, url: h.url,
      visitCount: h.visitCount, typedCount: h.typedCount,
      lastVisitTime: new Date(h.lastVisitTime).toISOString()
    })));
  });
});
```

### 日期范围
```js
const start = new Date('YYYY-MM-DD').getTime();
const end = new Date('YYYY-MM-DD').getTime();
return await new Promise(resolve => {
  chrome.history.search({ text: '', startTime: start, endTime: end, maxResults: 1000 }, results => {
    resolve(results.map(h => ({ title: h.title, url: h.url, visitCount: h.visitCount, lastVisitTime: new Date(h.lastVisitTime).toISOString() })));
  });
});
```

### 域名搜索
```js
return await new Promise(resolve => {
  chrome.history.search({ text: 'DOMAIN_OR_KEYWORD', startTime: Date.now() - 86400000, maxResults: 100 }, results => {
    resolve(results.map(h => ({ title: h.title, url: h.url, visitCount: h.visitCount })));
  });
});
```

### 删除 URL
```js
return await new Promise(resolve => {
  chrome.history.deleteUrl({ url: 'URL_TO_DELETE' }, () => resolve({ deleted: true }));
});
```

### 域名统计（今天）
```js
const dayAgo = Date.now() - 86400000;
return await new Promise(resolve => {
  chrome.history.search({ text: '', startTime: dayAgo, maxResults: 500 }, results => {
    const domains = {};
    results.forEach(h => {
      try { const d = new URL(h.url).hostname.replace('www.', ''); domains[d] = (domains[d] || 0) + 1; } catch {}
    });
    resolve(Object.entries(domains).sort((a, b) => b[1] - a[1]).map(([d, c]) => ({ domain: d, count: c })));
  });
});
```

---

## B.5 下载 (Downloads)

### 最近的下载
```js
return await new Promise(resolve => {
  chrome.downloads.search({ limit: 20, orderBy: ['-startTime'] }, results => {
    resolve(results.map(d => ({
      id: d.id, filename: d.filename, url: d.url,
      state: d.state, fileSize: d.fileSize, bytesReceived: d.bytesReceived,
      startTime: new Date(d.startTime).toISOString(),
      error: d.error
    })));
  });
});
```

### 进行中的下载
```js
return await new Promise(resolve => {
  chrome.downloads.search({ state: 'in_progress', limit: 50 }, results => {
    resolve(results.map(d => ({
      id: d.id, filename: d.filename,
      progress: d.fileSize ? Math.round((d.bytesReceived / d.fileSize) * 100) : 0,
      state: d.state
    })));
  });
});
```

---

## B.6 阅读列表 — `self.vivaldi.readingListPrivate`

### 获取
```js
return await new Promise(resolve => {
  self.vivaldi.readingListPrivate.getAll(items => {
    resolve((items || []).map(i => ({
      id: i.id, title: i.title, url: i.url,
      read: i.read, creationTime: i.creationTime,
      estimatedReadTimeMinutes: i.estimatedReadTimeMinutes
    })));
  });
});
```

### 添加/移除
```js
return await new Promise(resolve => {
  self.vivaldi.readingListPrivate.add({ title: 'TITLE', url: 'URL' }, item => resolve(item));
});
// ---
return await new Promise(resolve => {
  self.vivaldi.readingListPrivate.remove({ url: 'URL' }, () => resolve({ removed: true }));
});
```

### 标记已读
```js
return await new Promise(resolve => {
  self.vivaldi.readingListPrivate.setReadStatus({ url: 'URL', read: true }, () => resolve({ updated: true }));
});
```

---

## B.7 会话 — `self.vivaldi.sessionsPrivate`

### 列出保存的会话
```js
return await new Promise(resolve => {
  self.vivaldi.sessionsPrivate.getAll(sessions => {
    resolve((sessions || []).map(s => ({
      id: s.id, name: s.name,
      tabCount: s.windows?.reduce((sum, w) => sum + (w.tabs?.length || 0), 0) || 0,
      windowCount: s.windows?.length || 0,
      createDate: s.createDate ? new Date(s.createDate).toISOString() : null
    })));
  });
});
```

### 打开/保存/删除会话
```js
return await new Promise(resolve => {
  self.vivaldi.sessionsPrivate.open('SESSION_ID', true, result => resolve(result));
});
// ---
return await new Promise(resolve => {
  self.vivaldi.sessionsPrivate.add('SESSION_NAME', result => resolve(result));
});
// ---
return await new Promise(resolve => {
  self.vivaldi.sessionsPrivate.delete('SESSION_ID', () => resolve({ deleted: true }));
});
```

---

## B.8 搜索引擎 — `self.vivaldi.searchEngines`

> 注意：此 API 在不同 Vivaldi 版本中返回格式可能不同。先用下面代码探测。

### 探测可用方法
```js
return { type: typeof self.vivaldi.searchEngines, methods: Object.keys(self.vivaldi.searchEngines || {}) };
```

### 列出搜索引擎
```js
return await new Promise(resolve => {
  self.vivaldi.searchEngines.getTemplateUrls(result => {
    const engines = Array.isArray(result) ? result : (result?.templateUrls || result?.data || []);
    resolve(engines.map(e => ({ keyword: e.keyword, shortName: e.shortName, url: e.url, isDefault: e.isDefault, isActive: e.isActive })));
  });
});
```

---

## B.9 联系人 — `self.vivaldi.contacts`

### 获取所有联系人
```js
return await new Promise(resolve => {
  self.vivaldi.contacts.getAll(contacts => {
    resolve((contacts || []).map(c => ({
      id: c.id, name: c.name,
      email: c.emailAddresses?.map(e => e.address),
      phone: c.phoneNumbers?.map(p => p.number),
      organization: c.organization
    })));
  });
});
```

### 搜索联系人
```js
const keyword = 'SEARCH_TERM'.toLowerCase();
return await new Promise(resolve => {
  self.vivaldi.contacts.getAll(contacts => {
    const filtered = (contacts || []).filter(c =>
      c.name?.toLowerCase().includes(keyword) ||
      c.emailAddresses?.some(e => e.address?.toLowerCase().includes(keyword))
    );
    resolve(filtered.map(c => ({ id: c.id, name: c.name, email: c.emailAddresses?.map(e => e.address) })));
  });
});
```

---

## B.10 最近关闭的标签页 — `chrome.sessions`

### 最近关闭的标签
```js
return await new Promise(resolve => {
  chrome.sessions.getRecentlyClosed({ maxResults: 20 }, items => {
    resolve(items.map(i => ({
      type: i.tab ? 'tab' : 'window',
      title: i.tab?.title || i.window?.title,
      url: i.tab?.url,
      tabCount: i.window?.tabs?.length,
      lastModified: i.lastModified
    })));
  });
});
```

---

## B.11 组合速查

### 浏览器全景快照
```js
const [tabs, bookmarks, historyCount, downloads] = await Promise.all([
  chrome.tabs.query({}),
  (async () => {
    const tree = await chrome.bookmarks.getTree();
    let t = 0, f = 0;
    function count(nodes) { for (const n of nodes) { if (n.url) t++; else f++; if (n.children) count(n.children); } }
    count(tree);
    return { total: t, folders: f };
  })(),
  new Promise(r => chrome.history.search({ text: '', startTime: Date.now() - 86400000, maxResults: 1 }, results => r(results.length))),
  new Promise(r => chrome.downloads.search({ limit: 1, orderBy: ['-startTime'] }, results => r(results[0] || null)))
]);

return {
  tabs: { total: tabs.length, active: tabs.filter(t => t.active).length, pinned: tabs.filter(t => t.pinned).length },
  bookmarks: { total: bookmarks.total, folders: bookmarks.folders },
  recentHistory24h: historyCount,
  lastDownload: downloads ? { filename: downloads.filename, state: downloads.state } : null
};
```
