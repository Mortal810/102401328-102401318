# 两人用 GitHub 完成真实协作

> 该文档是操作指南，不表示已经替两位同学创建仓库、提交代码、Fork 或 Merge。所有操作需两人使用真实账号在 GitHub 完成。

## A 创建主仓库

1. 登录 GitHub → New repository → Name=`102401328-102401318` → Public → Create。
2. 本机在包含 `index.html` 的项目根目录打开 PowerShell，执行：

```powershell
git init -b main
git add .
git commit -m "chore: initialize campus lost-and-found project"
git remote add origin https://github.com/<A的用户名>/102401328-102401318.git
git push -u origin main
```

**注意：**如果在 GitHub 创建仓库时已勾选初始化 README，请先拉取远端并合并历史或创建空仓库，避免因历史不同导致 Push 拒绝。上面的流程按“空仓库”编写。

## B Fork 并克隆

1. 在浏览器进入 A 的主仓库，点击 Fork → Create fork。
2. 在本机执行：

```powershell
git clone https://github.com/<B的用户名>/102401328-102401318.git
cd 102401328-102401318
git remote add upstream https://github.com/<A的用户名>/102401328-102401318.git
git remote -v
git switch -c feat/search-detail
```

3. 在自己的 `feat/search-detail` 中完成搜索/详情小模块，亲自运行与检查。
4. 提交并推送：

```powershell
git add js/search.js js/detail.js
git commit -m "feat(search): implement keyword search and item detail"
git push -u origin feat/search-detail
```

5. 打开自己的 Fork 页面 → Compare & pull request → 目标仓库选 A 的 main → 编写说明与测试方法 → Create pull request。
6. A 检查 Files changed、进行 Comment/Approve，确认页面仍正常后 Merge PR。双方保存真实页面截图。

## 继续下一个模块

```powershell
git switch main
git fetch upstream
git merge --ff-only upstream/main
git push origin main
git switch -c feat/my-posts-status
# 完成我的发布、状态修改后：
git add .
git commit -m "feat(status): implement publisher status transitions"
git push -u origin feat/my-posts-status
```

新建第二个 PR。测试模块可以单独第三个 PR。

## 真实分工提醒

此下载包已包含完整参考实现；如用于结对编程课程，**不能把一个压缩包一次性提交就宣称两人完成了多个真实开发阶段**。两人应分别阅读、理解、修改、调试各模块，在自己的开发环境按实际过程形成真实的分支、提交、Review、PR、复测和 PSP 记录。提交时间与截图必须对应真实操作。
