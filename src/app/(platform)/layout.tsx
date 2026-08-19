import { AppShell } from "@/components/app-shell";

export default function PlatformLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
