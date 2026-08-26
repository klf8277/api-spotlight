"use client";

import { useState } from "react";

export default function ThemeToggle() {
  // 惰性初始化：直接读 DOM class（首屏内联脚本已设置）；SSR 安全（document 未定义时返回 false）
  const [dark, setDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // 隐私模式下 localStorage 可能不可用，忽略即可
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换暗色 / 亮色主题"
      title="切换暗色 / 亮色主题"
      className="ml-1 rounded-md border border-foreground/10 p-1.5 text-sm leading-none hover:bg-foreground/5"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
