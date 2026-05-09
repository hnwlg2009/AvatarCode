# CI/CD 状态徽章使用指南

## 📊 可用徽章

将以下徽章添加到 `README.md`:

### CI 状态

```markdown
[![CI Main](https://github.com/hnwlg2009/AvatarCode/actions/workflows/ci-main.yml/badge.svg)](https://github.com/hnwlg2009/AvatarCode/actions/workflows/ci-main.yml)
```

### CD 发布

```markdown
[![CD Release](https://github.com/hnwlg2009/AvatarCode/actions/workflows/cd-release.yml/badge.svg)](https://github.com/hnwlg2009/AvatarCode/actions/workflows/cd-release.yml)
```

### 每日构建

```markdown
[![Daily Build](https://github.com/hnwlg2009/AvatarCode/actions/workflows/daily-build.yml/badge.svg)](https://github.com/hnwlg2009/AvatarCode/actions/workflows/daily-build.yml)
```

### 版本徽章

```markdown
[![Version](https://img.shields.io/github/v/release/hnwlg2009/AvatarCode)](https://github.com/hnwlg2009/AvatarCode/releases)
[![Release Date](https://img.shields.io/github/release-date/hnwlg2009/AvatarCode)](https://github.com/hnwlg2009/AvatarCode/releases)
```

### 代码质量

```markdown
[![Codecov](https://img.shields.io/codecov/c/github/hnwlg2009/AvatarCode)](https://codecov.io/gh/hnwlg2009/AvatarCode)
[![Code Quality](https://img.shields.io/github/actions/workflow/status/hnwlg2009/AvatarCode/ci-main.yml?label=code%20quality)](https://github.com/hnwlg2009/AvatarCode/actions)
```

### 下载统计

```markdown
[![Downloads](https://img.shields.io/github/downloads/hnwlg2009/AvatarCode/total)](https://github.com/hnwlg2009/AvatarCode/releases)
[![Downloads Latest](https://img.shields.io/github/downloads/hnwlg2009/AvatarCode/latest/total)](https://github.com/hnwlg2009/AvatarCode/releases/latest)
```

---

## 📋 完整示例

在 `README.md` 中:

```markdown
# AvatarCode

![CI Main](https://github.com/hnwlg2009/AvatarCode/actions/workflows/ci-main.yml/badge.svg)
[![Version](https://img.shields.io/github/v/release/hnwlg2009/AvatarCode)](https://github.com/hnwlg2009/AvatarCode/releases)
[![Downloads](https://img.shields.io/github/downloads/hnwlg2009/AvatarCode/total)](https://github.com/hnwlg2009/AvatarCode/releases)

AI-Native Code Editor...
```

---

## 🎨 徽章样式

可自定义徽章样式:

```
?style=flat          # 扁平 (默认)
?style=flat-square   # 扁平方形
?style=plastic       # 塑料质感
?style=for-the-badge # 大徽章
?style=social        # 社交风格

?color=green         # 颜色
?color=blue
?color=important     # 红色
?color=critical      # 深红色
```

示例:
```markdown
![CI](https://github.com/hnwlg2009/AvatarCode/actions/workflows/ci-main.yml/badge.svg?style=for-the-badge&color=green)
```

