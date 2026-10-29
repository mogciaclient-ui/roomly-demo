import "./globals.css";
import { DemoProvider } from "@/components/demo-provider";
export const metadata={title:"Roomly | デジタルコンシェルジュ",description:"小規模宿泊施設のためのデジタルコンシェルジュ"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ja"><body><DemoProvider>{children}</DemoProvider></body></html>}
