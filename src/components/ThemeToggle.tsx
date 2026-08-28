"use client";

import { useSyncExternalStore } from "react";

const THEME_EVENT = "apis-spotlight-theme-change";

function subscribe(callback: () => void) {
  const listener = () => callback();
  window.addEventListener(THEME_EVENT, listener);
  return () => window.removeEventListener(THEME_EVENT, listener);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export default function ThemeToggle() {
  // 服务端快照固定，客户端挂载后同步首屏脚本设置的主题，避免 hydration mismatch。
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.dispatchEvent(new Event(THEME_EVENT));
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
