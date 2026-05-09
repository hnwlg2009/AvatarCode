#!/bin/bash
# AvatarCode 一键部署脚本
# 使用方法：chmod +x setup.sh && ./setup.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        log_info "检测到操作系统：$PRETTY_NAME"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
}

# 检查是否以 root 运行
check_root() {
    if [ "$EUID" -ne 0 ] && [ "$SKIP_ROOT_CHECK" != "true" ]; then
        log_warn "建议以 root 用户运行此脚本 (使用 sudo)"
        log_info "如果以普通用户运行，部分 apt 命令可能失败"
    fi
}

# 安装系统依赖
install_system_deps() {
    log_info "Step 1/4: 安装系统依赖..."
    
    case $OS in
        debian|ubuntu)
            apt-get update
            apt-get install -y \
                curl \
                git \
                python3 \
                python3-pip \
                build-essential \
                libxss1 \
                libgdk-pixbuf2.0-0 \
                libgtk-3-0 \
                libnotify4 \
                libnss3 \
                libxrandr2 \
                libasound2 \
                libxtst6 \
                xdg-utils
            ;;
        *)
            log_warn "不支持的操作系统：$OS"
            log_info "请手动安装必要的系统依赖"
            ;;
    esac
    
    log_success "系统依赖安装完成"
}

# 安装 Node.js
install_nodejs() {
    log_info "Step 2/4: 安装 Node.js..."
    
    # 检查是否已安装 nvm
    if [ ! -d "$HOME/.nvm" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    fi
    
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # 安装 Node.js 22.22.0
    nvm install 22.22.0
    nvm use 22.22.0
    nvm alias default 22.22.0
    
    log_success "Node.js 安装完成：$(node --version)"
    log_success "npm 版本：$(npm --version)"
}

# 安装项目依赖
install_project_deps() {
    log_info "Step 3/4: 安装项目依赖..."
    
    # 安装项目依赖
    npm install --legacy-peer-deps
    
    # 安装全局工具
    npm install -g typescript typescript-language-server
    
    # 设置 Git hooks
    npm run prepare || true
    
    log_success "项目依赖安装完成"
}

# 验证安装
verify_installation() {
    log_info "Step 4/4: 验证安装..."
    
    echo ""
    echo "系统版本信息:"
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
    echo "  Git: $(git --version)"
    echo "  Python: $(python3 --version 2>&1 || echo 'Not installed')"
    echo ""
    
    # 运行类型检查
    log_info "运行 TypeScript 类型检查..."
    npm run typecheck || log_warn "类型检查失败，但可以继续开发"
    
    # 运行测试
    log_info "运行测试套件..."
    npm test || log_warn "部分测试失败，但可以继续开发"
    
    log_success "验证完成"
}

# 显示使用说明
show_instructions() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 部署完成!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "启动开发服务器:"
    echo -e "  ${BLUE}npm run dev${NC}"
    echo ""
    echo "运行测试:"
    echo -e "  ${BLUE}npm test${NC}"
    echo ""
    echo "构建 Electron 应用:"
    echo -e "  ${BLUE}npm run electron:build${NC}"
    echo ""
    echo "运行 Electron 开发模式:"
    echo -e "  ${BLUE}npm run electron:dev${NC}"
    echo ""
    echo "代码格式化:"
    echo -e "  ${BLUE}npm run format${NC}"
    echo ""
    echo "代码检查:"
    echo -e "  ${BLUE}npm run lint${NC}"
    echo ""
    echo "详细文档请查看:"
    echo -e "  ${BLUE}ENVIRONMENT_SETUP.md${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}🌟 AvatarCode 一键部署脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    
    detect_os
    check_root
    install_system_deps
    install_nodejs
    install_project_deps
    verify_installation
    show_instructions
}

# 执行主函数
main "$@"
