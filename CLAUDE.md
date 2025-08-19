# Claude Configuration

## 安全准则

在 MVP 扩展开发时请遵循以下规则：

### 允许的操作

- ls, cat, head, tail, grep, find, tree
- git (所有 git 命令)
- npm, yarn, pip, pip3
- node, python, python3
- vim, nano
- mkdir, touch, cp, mv

### 严格禁止

- rm, rmdir (删除文件)
- sudo, su (提权操作)
- chmod 777 (危险权限)
- systemctl, service (系统服务)
- shutdown, reboot (系统控制)

## 项目说明

这是 MVP 代码库功能扩展项目。
请专注于增量开发，每次只添加一个功能模块。
尽量使用 token 消耗少的方式完成任务
