import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
export const metadata={title:"Roomly.",description:"宿泊施設とお客様をつなぐコミュニケーションサービス"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body><DemoProvider>{children}</DemoProvider></body></html>}
