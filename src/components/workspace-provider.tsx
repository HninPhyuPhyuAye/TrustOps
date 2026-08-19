"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  workspaceOrganizations,
  workspaceOrganizationSummaries,
  workspacePortfolioSummary,
  workspaceSnapshots,
} from "@/data/workspace-data";
import type { OrganizationSummary } from "@/domain/dashboard";
import type { Organization } from "@/domain/schemas";
import type { OrganizationSnapshot } from "@/domain/tenant-repository";

export type WorkspaceSelection = "portfolio" | string;

type WorkspaceContextValue = {
  selection: WorkspaceSelection;
  selectWorkspace: (selection: WorkspaceSelection) => void;
  organizations: Organization[];
  selectedOrganization: Organization | null;
  selectedSnapshot: OrganizationSnapshot | null;
  visibleSnapshots: OrganizationSnapshot[];
  organizationSummaries: OrganizationSummary[];
  visibleOrganizationSummaries: OrganizationSummary[];
  portfolioSummary: typeof workspacePortfolioSummary;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const storageKey = "trustops-active-workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<WorkspaceSelection>("portfolio");
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    const restorePreference = window.setTimeout(() => {
      const storedSelection = window.localStorage.getItem(storageKey);
      const isValid =
        storedSelection === "portfolio" ||
        workspaceOrganizations.some(
          (organization) => organization.id === storedSelection,
        );

      if (storedSelection && isValid) {
        setSelection(storedSelection);
      }
      setHasLoadedPreference(true);
    }, 0);

    return () => window.clearTimeout(restorePreference);
  }, []);

  useEffect(() => {
    if (hasLoadedPreference) {
      window.localStorage.setItem(storageKey, selection);
    }
  }, [hasLoadedPreference, selection]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const selectedOrganization =
      selection === "portfolio"
        ? null
        : (workspaceOrganizations.find(
            (organization) => organization.id === selection,
          ) ?? null);
    const selectedSnapshot =
      selection === "portfolio" ? null : (workspaceSnapshots.get(selection) ?? null);
    const visibleOrganizationSummaries =
      selection === "portfolio"
        ? workspaceOrganizationSummaries
        : workspaceOrganizationSummaries.filter(
            (organization) => organization.organizationId === selection,
          );
    const visibleSnapshots =
      selection === "portfolio"
        ? workspaceOrganizations.flatMap((organization) => {
            const snapshot = workspaceSnapshots.get(organization.id);
            return snapshot ? [snapshot] : [];
          })
        : selectedSnapshot
          ? [selectedSnapshot]
          : [];

    return {
      selection,
      selectWorkspace: setSelection,
      organizations: workspaceOrganizations,
      selectedOrganization,
      selectedSnapshot,
      visibleSnapshots,
      organizationSummaries: workspaceOrganizationSummaries,
      visibleOrganizationSummaries,
      portfolioSummary: workspacePortfolioSummary,
    };
  }, [selection]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }

  return context;
}
