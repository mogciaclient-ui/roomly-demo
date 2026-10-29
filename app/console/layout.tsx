import { ConsoleShell } from "@/components/console-shell";
import { ConsoleAuthGate } from "@/components/console-auth-gate";
export default function Layout({children}:{children:React.ReactNode}){return <ConsoleAuthGate><ConsoleShell>{children}</ConsoleShell></ConsoleAuthGate>}
