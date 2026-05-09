# 代码签名和密钥管理指南

**安全级别**: 🔒 高  
**适用范围**: CD Pipeline 维护者

---

## 🔐 GitHub Secrets 配置

### 必需配置

| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `CSC_LINK` | 代码签名证书 | 证书颁发机构 |
| `CSC_KEY_PASSWORD` | 证书密码 | 设置时指定 |
| `CSC_FOR_PULL_REQUEST` | PR 签名 (true/false) | 手动设置 |
| `APPLE_ID` | Apple Developer ID | developer.apple.com |
| `APPLE_APP_SPECIFIC_PASSWORD` | Apple 专用密码 | Apple ID 设置 |
| `APPLE_TEAM_ID` | Apple Team ID | Apple Developer |
| `WIN_CSC_LINK` | Windows 签名证书 | DigiCert/Sectigo |
| `WIN_CSC_KEY_PASSWORD` | Windows 证书密码 | 设置时指定 |

### 配置步骤

1. 进入 `Settings → Secrets and variables → Actions`
2. 点击 "New repository secret"
3. 添加上述密钥

---

## 🏷️ macOS 代码签名

### 获取证书

1. 加入 Apple Developer Program ($99/年)
2. 创建 Certificate Signing Request
3. 下载 Developer ID Application 证书

### 导出证书

```bash
# 从钥匙串导出
# Keychain Access → My Certificates
# 右键 Developer ID Application → Export
# 保存为 .p12 文件
```

### 转换为 Base64

```bash
base64 -i certificate.p12 | pbcopy
# 粘贴到 GitHub Secret: CSC_LINK
```

---

## 🪟 Windows 代码签名

### 获取证书

推荐证书颁发机构:
- DigiCert
- Sectigo (原 Comodo)
- GlobalSign

### 配置流程

1. 购买代码签名证书 (~$200-400/年)
2. 生成 CSR 并验证
3. 下载 .pfx 证书文件
4. 设置密码

### 转换 Base64

```bash
# PowerShell
certutil -encode certificate.pfx cert.b64
Get-Content cert.b64 | Set-Content -NoNewline -Path cert.base64
# 复制内容到 GitHub Secret: WIN_CSC_LINK
```

---

## 🐧 Linux AppImage 签名

AppImage 可选签名：

```bash
# 使用 GPG 签名
gpg --detach-sign --output AvatarCode.AppImage.sig AvatarCode.AppImage
```

---

## 🔑 密钥轮换

**周期**: 每 12 个月

**流程**:
1. 生成新证书
2. 更新 GitHub Secrets
3. 重新构建 Release
4. 撤销旧证书

---

## 🛡️ 安全建议

- ✅ 永远不在代码中硬编码密钥
- ✅ 定期轮换证书 (12 个月)
- ✅ 使用强密码 (16+ 字符)
- ✅ 限制证书访问权限
- ✅ 监控证书过期时间

---

**最后更新**: 2026-05-06  
**维护者**: devin WLG

