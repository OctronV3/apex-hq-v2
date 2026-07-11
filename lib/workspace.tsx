"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  role: string;
}

interface WorkspaceContextValue {
  workspaceId: string | null;
  workspaces: Workspace[];
  isLoaded: boolean;
  setWorkspaceId: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: null,
  workspaces: [],
  isLoaded: false,
  setWorkspaceId: () => {},
});

const STORAGE_KEY = "apex-workspace";

function setWorkspaceCookie(workspaceId: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${STORAGE_KEY}=${workspaceId}; path=/; max-age=31536000; SameSite=Lax`;
  localStorage.setItem(STORAGE_KEY, workspaceId);
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    isLoaded: boolean;
    workspaceId: string | null;
    workspaces: Workspace[];
  }>({ isLoaded: false, workspaceId: null, workspaces: [] });

  useEffect(() => {
    fetch("/api/workspaces")
      .then((res) => res.json())
      .then((data) => {
        const workspaces: Workspace[] = data.workspaces || [];
        const stored =
          localStorage.getItem(STORAGE_KEY) ||
          new URLSearchParams(document.cookie.replace(/; /g, "&")).get(STORAGE_KEY);

        const selected =
          workspaces.find((w) => w.id === stored)?.id || workspaces[0]?.id || null;

        if (selected) {
          setWorkspaceCookie(selected);
        }

        setState({
          isLoaded: true,
          workspaceId: selected,
          workspaces,
        });
      })
      .catch(() => {
        setState({ isLoaded: true, workspaceId: null, workspaces: [] });
      });
  }, []);

  const setWorkspaceId = useCallback((workspaceId: string) => {
    setWorkspaceCookie(workspaceId);
    setState((prev) => ({ ...prev, workspaceId }));
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceId: state.workspaceId,
      workspaces: state.workspaces,
      isLoaded: state.isLoaded,
      setWorkspaceId,
    }),
    [state, setWorkspaceId]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
