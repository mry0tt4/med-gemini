import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="min-h-screen bg-background">
                <Sidebar />
                <div className="lg:ml-64 flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 p-4 lg:p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
