---
layout: post
title: ICMP PING 学习
date: 2014-4-8
description: ICMP PING 原来是这么实现的! multi-thread 有坑啊!
categories: [Network]
tags: [Linux, Network]
uniq_id: icmp-ping

---

七个月前的某一天, 我想用 Ruby 重写一个内部的工具, 其中有一个功能需要用到
PING, 出于某种代码洁癖, 我想用纯 Ruby 的方式来解决这个问题, 于是我就找到了
[djberg96/net-ping][1], 并且因为某些效率上的需求, 我需要给这个工具加上一点并发.

问题就出在这个并发上了, 想到并发时候第一个想法当然是 threading, 但是如同我在这个
[issue][2] 中的描述, net-ping 在 multi-thread 的情况下会发生结果不符合预期的情况.
这个问题直到这个月才得到了解决, 借此机会好好的记录一下整个学习过程.

[ICMP][3](网络控制协议)是一个跟 TCP 和 UDP 平起平坐的协议, 它与 TCP&UDP
最不相同的一点就在于它并不依靠端口来跟后端应用进行绑定, 系统接收到任一个 ICMP
请求都会毫无差别的, 向服务器上的所有应用传达这个数据, 所以在 `socket.recvfrom`
时候必须加以更严格的判断, 以防被同机器的其他进程的信息干扰了.

ICMPv4 的 header 十分的简单, 只有 8 个字节, 第一个字节表示消息类型(_type_),
第二个字节表示消息代码(_code_), 接着 2 字节的校验和(_checksum_),
再就是根据消息类型而用处不同的 4 个字节的 header 数据了.


[PING][4] 用到了 ICMP 中的 `Echo`(8) 和 `Echo reply`(0) 两个消息类型.
根据 [RFC792#page-14][5] 的描述

> The echoer returns these same values in the echo reply.

因为 echo reply 中会原封不动的回传 Identifier 和 Sequence Number,
这两个参数可以用来帮助程序判断收到的 ICMP 包是否是我们之前发出的那个包的回应,
在一般的实践上, Identifier 用来帮助程序判断是否是自己发出去的包, 而用从 1 开始递增的
Sequence Number 来帮助判断发出去包的个数和收到包的标识

```
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|     Type      |     Code      |          Checksum             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Identifier          |        Sequence Number        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

了解了上面的信息, 如何做一个 ICMP PING 的程序就变的比较清晰了

1. 先构建一个 ICMP 的 Socket, 绑定到发送的 IP 和 Port(因为实际不开端口,
所以端口为0)
2. 用 Type 8, Code 0, 并加上 Id 和 Seq 来打包一个 ICMP 数据包
3. 设定目标地址并发送包
3. 等待回应
4. 收到回应后先检查 ICMP 报文类型(Echo request 的 Type 是 0)
5. 再检查Id, 如果和之前发出去的 ID 相符, 说明是自己发出去的,
否则回到第四步继续等待, 直到超时

参考 Code: [djberg96/net-ping:lib/net/ping/icmp.rb][6]

## 这个 Bug

最后提一下之前说的 Bug. 究其原因就是之前实现的时候, 在生成 Identifier
的时候生硬的使用了 pid, 所以在 multi-thread 的情况下因为拿到了相同的 pid,
导致程序无法分辨到底是哪一个 thread 发出的 ICMP 请求被返回了, 于是就出错了.

解决方案也十分的简单: 使用 thread_id 即可

[1]: https://github.com/djberg96/net-ping "net-ping"
[2]: https://github.com/djberg96/net-ping/issues/22 "net-ping return inaccurate result with multithreading."
[3]: http://en.wikipedia.org/wiki/Internet_Control_Message_Protocol
[4]: http://en.wikipedia.org/wiki/Ping_(networking_utility) "Ping (networking utility)"
[5]: http://tools.ietf.org/html/rfc792#page-14 "Echo or Echo Reply Message"
[6]: https://github.com/djberg96/net-ping/blob/7917722a883cd0a7919881aec5abdeb35af2699c/lib/net/ping/icmp.rb "lib/net/ping/icmp.rb"
