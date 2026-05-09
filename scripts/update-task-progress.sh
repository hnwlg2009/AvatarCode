#!/bin/bash

echo "🔍 正在扫描所有模块的任务状态..."
echo ""

total_tasks=0
completed_tasks=0

for dir in /workspace/.monkeycode/specs/*/; do
  name=$(basename "$dir")
  tasklist="$dir/tasklist.md"
  
  if [ -f "$tasklist" ]; then
    done_tasks=$(grep -c "^\- \[x\]" "$tasklist" 2>/dev/null || echo 0)
    all_tasks=$(grep -c "^\- \[ \]" "$tasklist" 2>/dev/null || echo 0)
    module_total=$((all_tasks + done_tasks))
    
    if [ $module_total -gt 0 ]; then
      percentage=$((done_tasks * 100 / module_total))
    else
      percentage=0
    fi
    
    total_tasks=$((total_tasks + module_total))
    completed_tasks=$((completed_tasks + done_tasks))
    
    if [ $percentage -eq 100 ]; then
      icon="✅"
    elif [ $percentage -gt 0 ]; then
      icon="🔄"
    else
      icon="⏳"
    fi
    
    printf "%-25s | %s %3d%% | %3d/%3d\n" "$name" "$icon" "$percentage" "$done_tasks" "$module_total"
  fi
done

echo ""
echo "═══════════════════════════════════"
if [ $total_tasks -gt 0 ]; then
  overall=$((completed_tasks * 100 / total_tasks))
else
  overall=0
fi
echo "总计：$overall% ($completed_tasks/$total_tasks tasks)"
echo "═══════════════════════════════════"
