---
layout: post
title: IP Neighbour Table Overflow
date: 2014-04-20 23:47
description: |
  大量 Ping 同网段 IP 时 ARP 表迅速增长, 表项数量超过硬上限时就会导致无法记录新的
  ARP 项而产生 "No buffer space available" 的异常失效, 本文简述了其相关的配置和解决的方法
categories: [Linux]
tags: [Network, IP]
uniq_id: ip-neighbour-table-overflow

---

偶然性的发现一个网络问题, 在大批量的 ping 不同 IP 的时候, 会偶发性的出现
`No buffer space available` 的错误:

```bash
[root@localhost]
# ping 61.139.2.69
connect: No buffer space available
```

简单的说, 这个报错的原因就是 ARP 表满了, 不能存新项导致的, No buffer space 指的就是 ARP 表.

那如何看 arp 表呢.?

```bash
[root@localhost /root]
#ip neighbor show
10.137.11.247 dev bond0 lladdr 00:00:0c:9f:f3:84 REACHABLE
10.110.71.247 dev eth2 lladdr 00:00:0c:07:ac:0a STALE
10.110.66.105 dev eth2 lladdr 00:e0:ec:25:80:0c STALE

[root@localhost /root]
#arp -n
Address                  HWtype  HWaddress           Flags Mask            Iface
10.137.11.247            ether   00:00:0c:9f:f3:84   C                     bond0
10.110.71.247            ether   00:00:0c:07:ac:0a   C                     eth2
10.110.66.105            ether   00:e0:ec:25:80:0c   C                     eth2
```

那 arp 表的上限是怎么定的呢.?

```bash
[root@localhost /root]
#sysctl net.ipv4.neigh.default | grep gc

## 失效时间, 每次 ARP 被引用时刷新,
## 简单说就是一个 ARP 表项超过这个时间之后就会被标记成"可清除"
net.ipv4.neigh.default.gc_stale_time = 60

## ARP 表清理间隔(30s)
net.ipv4.neigh.default.gc_interval = 30

## ARP Cache 下限, 低于此限就不会清理 ARP 表
net.ipv4.neigh.default.gc_thresh1 = 128

## ARP Cache 软上限
net.ipv4.neigh.default.gc_thresh2 = 512

## ARP Cache 硬上限
net.ipv4.neigh.default.gc_thresh3 = 1024
```

解这个问题

```bash
sysctl -w net.ipv4.neigh.default.gc_thresh1=256
sysctl -w net.ipv4.neigh.default.gc_thresh2=1024
sysctl -w net.ipv4.neigh.default.gc_thresh3=2048
```

### 参考资料

* [ServerFault: No buffer space available and tuning with sysctl][1]
* [StackOverflow: Configuring ARP age timeout][5]
* [ip neighbor: Appendix B. Ethernet Layer Tools][3]
* [Kernel: Neighbour table overflow][4]
* [iptables 网关机 ping 提示 No buffer space available][2]

[1]: http://serverfault.com/questions/505964/no-buffer-space-available-and-tuning-with-sysctl "No buffer space available and tuning with sysctl"
[2]: http://bbs.chinaunix.net/thread-2208434-1-1.html "iptables 网关机 ping 提示 No buffer space available"
[3]: http://linux-ip.net/html/tools-ip-neighbor.html "ip neighbor: Appendix B. Ethernet Layer Tools"
[4]: http://www.e-rave.nl/kernel-neighbour-table-overflow "Kernel: Neighbour table overflow"
[5]: http://stackoverflow.com/questions/15372011/configuring-arp-age-timeout "Configuring ARP age timeout"
