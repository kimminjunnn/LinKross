"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const SIDEBAR_STORAGE_KEY = "linkross:company-sidebar-collapsed:v1";
const SIDEBAR_CHANGE_EVENT = "linkross:sidebar-change";

type SidebarState = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarStateContext = createContext<SidebarState | null>(null);

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

export function SidebarStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggleSidebar = useCallback(() => {
    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      String(!getSnapshot()),
    );
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ isCollapsed, toggleSidebar }),
    [isCollapsed, toggleSidebar],
  );

  return (
    <SidebarStateContext.Provider value={value}>
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebarState() {
  const value = useContext(SidebarStateContext);

  if (!value) {
    throw new Error("useSidebarState must be used within SidebarStateProvider");
  }

  return value;
}
