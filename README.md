# duck — dae OpenWrt package

dae + daed (Web UI) integrated OpenWrt package.

## 结构

```
duck/            — daemon 包（daed + dae-wing + dae-core）
luci-app-duck/   — LuCI 管理界面
```

## 构建

将两个目录放入 OpenWrt 源码的 `package/` 下，然后：

```bash
./scripts/feeds install -a
make menuconfig  # 选中 duck + luci-app-duck
make -j$(nproc) V=w
```

## 默认配置

服务默认**禁用**，需在 LuCI 或通过 UCI 启用：

```bash
uci set duck.global.enabled=1
uci commit duck
/etc/init.d/duck enable
/etc/init.d/duck start
```
