---
layout: post
title: DHCP 高可用实践
date: '2014-01-12'
description: 通过 DHCP 自身的 failover 机制，配合 keepalived 的 VIP 自动漂移，实现 DHCP 的高可用
categories: HA
tags: [Linux, DHCP, HA]
uniq_id: dhcp-failover-and-keepalived-ha

---

## 本文不会包含

1. 如何跟网工沟通，以及什么是 subnet，什么是 ip helper address
2. 如何安装，或者编译安装 DHCP，以及 keepalived
3. 如何启动 DHCP 以及 keepalived

## DHCP 高可用实现要点

DHCP 高可用分为以下几个步骤实现，这里举一个实际的栗子：

1. 确定使用 10.223.0.246 这个 IP 来接受 DHCP 请求
1. 网络交换机正确配置 `ip address helper 10.223.0.246`（如若只有二层网络可以忽略这个配置）
2. DHCP 本身的 Failover 配置（实现 lease db 的自动同步）
3. keepalived 的 VIP 配置

前两步需要与网工沟通后完成，服务器的配置写在本文的最后。


## DHCP Failover

> 依赖声明：因为 DHCP failover 协议尚在 draft 阶段（[draft-ietf-dhc-failover-07.txt][1]），所以请至少使用 [ISC-DHCP-4.1][2] 及以上的版本，并且保持同一个 failover 集群下的 DHCP 版本一致，避免一些潜在的兼容性问题


```bash
# DHCP Primary                              |  # DHCP Sencondary
                                            |
ddns-update-style interim;                  |  ddns-update-style interim;
log-facility local6;                        |  log-facility local6;
authorized;                                 |  authorized;
ping-check true;                            |  ping-check true;
ping-timeout 3;                             |  ping-timeout 3;
default-lease-time 86400;                   |  default-lease-time 86400;
max-lease-time 86400;                       |  max-lease-time 86400;
                                            |
failover peer "oob" {                       |  failover peer "oob" {
  primary;                                  |    secondary;
  split 128;                                |    # no split in secondary
  mclt 3600;                                |    mclt 3600;
  address 10.223.0.244;                     |    address 10.223.0.245;
  port 647;                                 |    port 647;
  peer address 10.223.0.245;                |    peer address 10.223.0.244;
  peer port 647;                            |    peer port 647;
  max-response-delay 60;                    |    max-response-delay 60;
  max-unacked-updates 10;                   |    max-unacked-updates 10;
  load balance max seconds 3;               |    load balance max seconds 3;
}                                           |  }
                                            |
                                            |
                                            |
subnet 10.223.0.0 netmask 255.255.240.0 {   |  subnet 10.223.0.0 netmask 255.255.240.0 {
  option routers 10.223.0.247;              |    option routers 10.223.0.247;
  option broadcast-address 10.223.15.255;   |    option broadcast-address 10.223.15.255;
  option subnet-mask 255.255.240.0;         |    option subnet-mask 255.255.240.0;
                                            |
  pool {                                    |    pool {
          failover peer "oob";              |            failover peer "oob";
      range 10.223.0.11 10.223.0.240;       |        range 10.223.0.11 10.223.0.240;
      range 10.223.1.11 10.223.1.240;       |        range 10.223.1.11 10.223.1.240;
      range 10.223.2.11 10.223.2.240;       |        range 10.223.2.11 10.223.2.240;
      range 10.223.3.11 10.223.3.240;       |        range 10.223.3.11 10.223.3.240;
      range 10.223.4.11 10.223.4.240;       |        range 10.223.4.11 10.223.4.240;
      range 10.223.5.11 10.223.5.240;       |        range 10.223.5.11 10.223.5.240;
      range 10.223.6.11 10.223.6.240;       |        range 10.223.6.11 10.223.6.240;
      range 10.223.7.11 10.223.7.240;       |        range 10.223.7.11 10.223.7.240;
      range 10.223.8.11 10.223.8.240;       |        range 10.223.8.11 10.223.8.240;
      range 10.223.9.11 10.223.9.240;       |        range 10.223.9.11 10.223.9.240;
      range 10.223.10.11 10.223.10.240;     |        range 10.223.10.11 10.223.10.240;
      range 10.223.11.11 10.223.11.240;     |        range 10.223.11.11 10.223.11.240;
      range 10.223.12.11 10.223.12.240;     |        range 10.223.12.11 10.223.12.240;
      range 10.223.13.11 10.223.13.240;     |        range 10.223.13.11 10.223.13.240;
      range 10.223.14.11 10.223.14.240;     |        range 10.223.14.11 10.223.14.240;
      range 10.223.15.11 10.223.15.240;     |        range 10.223.15.11 10.223.15.240;
    }                                       |      }
}                                           |  }
```

> 参考资料: [man 5 dhcpd.conf](http://linux.die.net/man/5/dhcpd.conf)

## Keepalived

```bash
vrrp_instance VI_1 {       |  vrrp_instance VI_1 {
    state MASTER           |      state MASTER
    interface eth2         |      interface eth2
    virtual_router_id 51   |      virtual_router_id 51
    priority 99            |      priority 90 # so this is backup server
    advert_int 1           |      advert_int 1
    authentication {       |      authentication {
        auth_type PASS     |          auth_type PASS
        auth_pass 1111     |          auth_pass 1111
    }                      |      }
    virtual_ipaddress {    |      virtual_ipaddress {
        10.223.0.246/32    |          10.223.0.246/32 # VIP
    }                      |      }
}                          |  }
```

> 参考资料
>
> 1. [man 5 keepalived.conf](http://linux.die.net/man/5/keepalived.conf)
> 2. [CentOS / Redhat Linux: Install Keepalived To Provide IP Failover For Web Cluster](http://www.cyberciti.biz/faq/rhel-centos-fedora-keepalived-lvs-cluster-configuration/)
> 2. [LVS NAT + Keepalived HOWTO](http://www.keepalived.org/LVS-NAT-Keepalived-HOWTO.html)

[1]: http://tools.ietf.org/html/draft-ietf-dhc-failover-07
[2]: https://www.isc.org/downloads/
