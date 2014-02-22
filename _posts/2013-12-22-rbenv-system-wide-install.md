---
layout: post
title: rbenv system wide install (support for multi-user usecase)
date: '2013-12-22'
description: 
categories: Ruby
tags: [Ruby]
uniq_id: rbenv_system_wide_install

---

让 rbenv 良好的兼容 linux 下多用户共同使用一个 rbenv 的场景

## 起因

是 @luikore 吕大神的帖子 [[姨妈] 终于把 rvm 换成 rbenv 了](http://ruby-china.org/topics/16073), 讨论 rbenv 比之 rvm 不足的地方, 我列了这么四点

- rvm 傻瓜的帮你处理一些库依赖 (特别是在 osx 下系统 readline 和 brew 安装的 GNU readline 傻傻分不清楚的时候)
- rvm 良好的处理了多用户服务器环境下的管理
- 它官方有提供 offline 安装的方法, 对我来说很重要, 我有很多机器都不能上外网(生产环境安全要求严格).
- 有一个 binary 功能, 可以让我自己打包一个适应本地环境的 ruby, 避免在每个服务器上编译(未验证)

今天来尝试用 rbenv 解决上述问题

## 整理下需求:

1. 目标环境: 是 linux 下的 production 运行环境, 满足多用户共同使用的需求
2. 库依赖: 只专注于解决第一个问题, 跨平台的库依赖问题不予解决(比如不同系统使用不同的包管理,不同的包名等问题)
3. 离线安装: 能够完全只依赖有限的网络条件 offline 安装 (基本解决)
4. 多用户支持: 使用 linux 组权限解决 rbenv 的 none root 用户使用问题(比如安装新 ruby, 切换默认 ruby, 全局性的安装&删除 gem)

## 最后的结果

### 多用户支持

通过 linux 的组权限解决, 不完美, 有点小问题.

问题在 umask 的设置上, 系统默认是 `umask 022` 即组权限默认抹去 __写权限__. 在类似的场景下可能会出现 permission deny: 用户 A 在 gem 的默认位置上安装了 gem A, 但是用户 B 想把它删掉

解决这个问题的根本办法是请在 production 环境里面使用 `bundle install --deploy` 谢谢!

### 离线安装支持

这部分没有写在脚本里, 按照两步走:

1. 离线安装 rbenv 和 ruby-install: 简单, 打个 tar 包就好了
2. 离线安装 ruby: 简单, 建立一个 `$RBENV_PREFIX/cache` 文件夹, 然后把 ruby 源代码放进去就好了

> 参考资料: [Package download caching](https://github.com/sstephenson/ruby-build#package-download-caching)

### 部署运行方式

linux 的安全性问题就不赘言了, 总之你需要用一个独立的帐号来运行你的 rails app, 那么你应该这么做

> 折腾个什么劲啊, 用 capistrano-rbenv 呗

## 安装脚本参考

<div class="show-gist" data-gist-id="8064624"></div>
