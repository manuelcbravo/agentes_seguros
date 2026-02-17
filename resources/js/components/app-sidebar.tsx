import { Link } from '@inertiajs/react';
import { LayoutGrid, Settings, Users } from 'lucide-react';
import { route } from 'ziggy-js';
import { NavConfig } from '@/components/nav-config';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { dashboard } from '@/routes';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Clientes',
        href: route('clients.index'),
        icon: Users
    },
];

const configNavItems: NavItem[] = [

    {
        title: 'Configuración',
        href: route('config.users.index'),
        icon: Settings,
        children: [
            {
                title: 'Usuarios',
                href: route('config.users.index'),
            },
            {
                title: 'Roles y permisos',
                href: route('config.roles.index'),
            },
            {
                title: 'Auditoría',
                href: route('config.audits.index'),
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavConfig items={configNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
