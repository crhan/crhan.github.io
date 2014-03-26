---
layout: post
title: 记一次 gcc x86_64 包编译失败的解决
date: '2014-03-27'
description: 使用 Koji 完整编译 CentOS 时在 x86_64 位架构下遭遇依赖不完整的问题
categories: Linux
tags: [Linux, Build]
uniq_id: koji-build-gcc-multiarch

---

最近闲得无聊想尝试下从头编译 centos ，过程中就属 gcc 的 x86_64 架构下编译不过的问题最为诡异，具体表现就是在 koji root.log 中 `yum-builddep` 的环节里报找不到 `/lib/libc.so.6` 依赖的问题。

```
DEBUG util.py:264:  Error: No Package found for /lib/libc.so.6
```

解开 gcc srpm 包看 spec 文件中的定义，发现它指定了 x86_64 包的编译要同时安装 32 和 64 位的 glibc（Glibc 提供 libc.so.6）。但是在 koji 的编译逻辑里面，编译时只会选用__对应架构__的 RPM 包，所以在 64 位包编译时依赖 32 位包肯定会发生 404 not found 的问题。

```
...
%global multilib_64_archs sparc64 ppc64 s390x x86_64
...
%ifarch %{multilib_64_archs} sparcv9 ppc
# Ensure glibc{,-devel} is installed for both multilib arches
# 这里意思是凡是在 x86_64 架构下编译这个包就要依赖 32 和 64 位的 glibc so 库
BuildRequires: /lib/libc.so.6 /usr/lib/libc.so /lib64/libc.so.6 /usr/lib64/libc.so
%endif
...
```

这个问题我肯定不是第一个碰到的，但是我却怎么也没有找到任何有用的信息。我也去尝试下载 fedora21 的 gcc srpm 包解开来看，这段定义依旧存在，并且对应的 build 也都通过了。我也找了数个线上不同版本 os 的机器尝试找这样的一个包，都没有任何收获。

直到我找到了 GoOSe linux 的 gcc 编译 [root.log][1] 中终于注意到了一个从没见过的包 `glibc32-2.11.1-1.x86_64`。仔细一看这个包虽然写着 x86_64 的名字，包内容却是挂羊头卖狗肉似的提供了 32 位的 libc.so。继续往下查发现这个包从未出现在任何一个发行版的 REPO 中，在 fedora 的编译系统中最后一次编译也只停留在 f12 中，接着被一直沿用到现在。也是因为这个包并没有被纳入任何一个发行版的 release，所以在下载 srpm 的时候也完全找不到它的踪迹。

所以这个问题终于得到了解决！从 Fedora Koji 中下载来 [glibc32][2]，在我的 Koji 上 Build 好放进目标仓库，终于可以开始编译 gcc 了！


[1]: http://koji.gooselinux.org/mnt/koji/packages/gcc/4.4.4/13.gl6/data/logs/x86_64/root.log
[2]: http://koji.fedoraproject.org/koji/buildinfo?buildID=153452
