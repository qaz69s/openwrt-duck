# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2023 ImmortalWrt.org
# Adapted for OpenWrt 25.x by qaz69s
#
# Builds daed from source using QiuSimons' optimized forks.

include $(TOPDIR)/rules.mk

PKG_NAME:=duck
PKG_VERSION:=2026.05.09
DAED_VERSION:=daed-1e35217
WING_VERSION:=wing-dc50308
CORE_VERSION:=core-2b3c63f
WING_HASH_SHORT:=$(shell echo $(WING_VERSION) | cut -d- -f2)
CORE_HASH_SHORT:=$(shell echo $(CORE_VERSION) | cut -d- -f2)
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_PROTO:=git
PKG_SOURCE_VERSION:=1e35217375eb11f4fe1c4c4dae60cce9d99ee466
PKG_SOURCE_URL:=https://github.com/daeuniverse/daed.git
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=AGPL-3.0-only MIT
PKG_LICENSE_FILES:=LICENSE wing/LICENSE
PKG_MAINTAINER:=qaz69s

DAED_BUILD_DIR:=$(BUILD_DIR)/daed-$(PKG_VERSION)
PKG_BUILD_DIR:=$(DAED_BUILD_DIR)/wing

PKG_BUILD_DEPENDS:=golang/host bpf-headers
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/daeuniverse/dae-wing

GO_PKG_LDFLAGS:= \
	-s -w -buildid= \
	-linkmode external -extldflags '-static -Wl,-s' \
	-X '$(GO_PKG)/db.AppDescription=duck is a integration solution of dae, API and UI.'
GO_PKG_LDFLAGS_X:= \
	$(GO_PKG)/db.AppName=$(PKG_NAME) \
	$(GO_PKG)/db.AppVersion=$(DAED_VERSION)_$(WING_VERSION)_$(CORE_VERSION)
GO_PKG_TAGS:=embedallowed,trace

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/bpf.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

GO_PKG_BUILD_VARS+= \
	GOFLAGS="-trimpath -buildvcs=false -pgo=auto"

GO_PKG_TARGET_VARS+= \
	CGO_LDFLAGS="$(TARGET_LDFLAGS) -static -Wl,-s" \
	GOEXPERIMENT=newinliner,simd

define Package/duck/Default
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  URL:=https://github.com/daeuniverse/daed
endef

define Package/duck
  $(call Package/duck/Default)
  TITLE:=A Modern Dashboard For dae
  DEPENDS:=$(GO_ARCH_DEPENDS) \
    +ca-bundle +kmod-sched-core +kmod-sched-bpf \
    +kmod-veth +v2ray-geoip +v2ray-geosite \
    +@KERNEL_XDP_SOCKETS
endef

define Package/duck/description
  duck is a backend of dae, provides a method to bundle arbitrary
  frontend, dae and geodata into one binary.
endef

define Package/duck/conffiles
/etc/config/duck
endef

NODE_VERSION:=v24.12.0
NODE_DIST:=node-$(NODE_VERSION)-linux-x64
NODE_URL:=https://nodejs.org/dist/$(NODE_VERSION)/$(NODE_DIST).tar.xz

define Build/Prepare
	( \
		export $(GO_BIN_PATH) ; \
		rm -rf $(DAED_BUILD_DIR) ; \
		mkdir -p $(DAED_BUILD_DIR) ; \
		$(TAR) --strip-components=1 -C $(DAED_BUILD_DIR) -xzf $(DL_DIR)/$(PKG_NAME)-$(PKG_VERSION).tar.gz ; \
		git clone https://github.com/daeuniverse/dae-wing $(PKG_BUILD_DIR) && \
			git -C $(PKG_BUILD_DIR) checkout $(WING_HASH_SHORT) ; \
		rm -rf $(PKG_BUILD_DIR)/dae-core ; \
		git clone https://github.com/olicesx/dae $(PKG_BUILD_DIR)/dae-core && \
			git -C $(PKG_BUILD_DIR)/dae-core checkout $(CORE_HASH_SHORT) ; \
		rm -rf $(DAED_BUILD_DIR)/outbound ; \
		git clone --depth=1 -b perf/complete-optimizations https://github.com/olicesx/outbound.git $(DAED_BUILD_DIR)/outbound ; \
		rm -rf $(DAED_BUILD_DIR)/quic-go ; \
		git clone --depth=1 -b perf/node-pooling-v2 https://github.com/olicesx/quic-go.git $(DAED_BUILD_DIR)/quic-go ; \
		pushd $(PKG_BUILD_DIR)/dae-core ; \
			git submodule update --init ; \
			$(if $(GO_BIN_PATH),go get -u=patch) ; \
			$(if $(GO_BIN_PATH),go mod tidy) ; \
		popd ; \
		pushd $(PKG_BUILD_DIR) ; \
			go mod edit -replace github.com/daeuniverse/outbound=../outbound ; \
			go mod edit -replace github.com/daeuniverse/quic-go=../quic-go ; \
			$(if $(GO_BIN_PATH),go get -u=patch) ; \
			$(if $(GO_BIN_PATH),go mod tidy) ; \
			wget -qO default.pgo "https://github.com/QiuSimons/luci-app-dae/raw/refs/heads/kix/dae/pprof/default.pgo" ; \
		popd ; \
		mkdir -p $(DAED_BUILD_DIR)/.node_tmp/config ; \
		wget -qO - "$(NODE_URL)" | tar -xJ -C $(DAED_BUILD_DIR)/.node_tmp --strip-components=1 ; \
		export PATH="$(DAED_BUILD_DIR)/.node_tmp/bin:$$$$PATH" ; \
		export XDG_CONFIG_HOME="$(DAED_BUILD_DIR)/.node_tmp/config" ; \
		npm install -g pnpm ; \
		pushd $(DAED_BUILD_DIR) ; \
			pnpm install ; \
			pnpm build --filter daed ; \
		popd ; \
		mkdir -p $(PKG_BUILD_DIR)/webrender/web ; \
		cp -rf $(DAED_BUILD_DIR)/apps/web/dist/* $(PKG_BUILD_DIR)/webrender/web ; \
		find $(PKG_BUILD_DIR)/webrender/web -name "*.map" -type f -delete ; \
		find $(PKG_BUILD_DIR)/webrender/web -type f -size +4k ! -name "*.gz" ! -name "*.woff"  ! -name "*.woff2" -exec sh -c ' \
			gzip -9 -k "{}"; \
			if [ "$$$$(stat -c %s {})" -lt "$$$$(stat -c %s {}.gz)" ]; then \
				rm {}.gz; \
			else \
				rm {}; \
			fi' \
		";" ; \
		rm -rf $(DAED_BUILD_DIR)/.node_tmp ; \
	)
endef

DAE_CFLAGS:= \
	-O2 -Wall -Werror \
	-DMAX_MATCH_SET_LEN=1024 \
	-I$(BPF_HEADERS_DIR)/tools/lib \
	-I$(BPF_HEADERS_DIR)/arch/$(BPF_KARCH)/include/asm/mach-generic

define Build/Compile
	( \
		pushd $(PKG_BUILD_DIR) ; \
		export \
		$(GO_GENERAL_BUILD_CONFIG_VARS) \
		$(GO_PKG_BUILD_CONFIG_VARS) \
		$(GO_PKG_BUILD_VARS) ; \
		go generate ./... ; \
		cd dae-core ; \
		export \
		BPF_CLANG="$(CLANG)" \
		BPF_STRIP_FLAG="-strip=$(LLVM_STRIP)" \
		BPF_CFLAGS="$(DAE_CFLAGS)" \
		BPF_TARGET="bpfel,bpfeb" \
		BPF_TRACE_TARGET="$(GO_ARCH)" ; \
		go generate ./control/control.go ; \
		go generate ./trace/trace.go ; \
		popd ; \
	)
	$(call GoPackage/Build/Compile)
endef

define Package/duck/install
	$(call GoPackage/Package/Install/Bin,$(PKG_INSTALL_DIR))
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/dae-wing $(1)/usr/bin/duck

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(CURDIR)/files/etc/config/duck $(1)/etc/config/duck

	$(INSTALL_DIR) $(1)/etc/duck

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(CURDIR)/files/etc/init.d/duck $(1)/etc/init.d/duck

	$(INSTALL_DIR) $(1)/usr/share/duck
	ln -sf /usr/share/v2ray/geoip.dat $(1)/usr/share/duck/geoip.dat
	ln -sf /usr/share/v2ray/geosite.dat $(1)/usr/share/duck/geosite.dat
endef

$(eval $(call GoBinPackage,duck))
$(eval $(call BuildPackage,duck))
