import { AppShell } from "@/components/app-shell";
import { AutomationProvider } from "@/components/automation-provider";
import { WorkspaceProvider } from "@/components/workspace-provider";

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return (
    <WorkspaceProvider>
      <AutomationProvider>
        <AppShell>{children}</AppShell>
      </AutomationProvider>
    </WorkspaceProvider>
  );
}
