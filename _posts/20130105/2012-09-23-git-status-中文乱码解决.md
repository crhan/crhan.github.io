---
layout: post
title: Git Status 中文乱码解决
date: '2012-09-23'
description: 妈妈再也不担心我的 Git status 乱码了
categories: 我的玩具
tags: [Git]
uniq_id: '2012-09-23'
---

只要一行就行了

```bash
git config --global core.quotepath false
```

前后效果对比见图

![][1]

[1]: {{ site.assets }}/git-status-乱码.png
