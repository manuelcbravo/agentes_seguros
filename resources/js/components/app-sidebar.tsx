import { Link } from '@inertiajs/react';
import {
    BookCopy,
    BriefcaseBusiness,
    CalendarDays,
    IdCard,
    LayoutGrid,
    Settings,
    Users,
    Contact,
    ShieldCheck
} from 'lucide-react';
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
        icon: Users,
    },
    {
        title: 'Agentes',
        href: route('agents.index'),
        icon: BriefcaseBusiness,
    },
    {
        title: 'Calendario',
        href: route('google-calendar.index'),
        icon: CalendarDays,
    },
    {
        title: 'Leads',
        href: route('leads.index'),
        icon: Contact,
        children: [
            {
                title: 'Listado',
                href: route('leads.index'),
            },
            {
                title: 'Kanban',
                href: route('leads.kanban'),
            },
            {
                title: 'Ganados',
                href: route('leads.ganados'),
            },
            {
                title: 'No interesados',
                href: route('leads.no-interesados'),
            },
            {
                title: 'Archivados',
                href: route('leads.archived.index'),
            },
        ],
    },
    {
        title: 'Pólizas',
        href: route('polizas.index'),
        icon: ShieldCheck,
        children: [
            {
                title: 'Pólizas',
                href: route('polizas.index'),
            },
            {
                title: 'Asegurados',
                href: route('asegurados.index'),
            },
            {
                title: 'Beneficiarios',
                href: route('beneficiarios.index'),
            },
        ],
    },

    {
        title: 'Seguimiento',
        href: route('tracking.pendientes'),
        icon: CalendarDays,
        children: [
            {
                title: 'Pendientes',
                href: route('tracking.pendientes'),
            },
        ],
    },
];

const configNavItems: NavItem[] = [
    {
        title: 'Agente',
        href: route('agent-licenses.index'),
        icon: IdCard,
        children: [
            {
                title: 'Licencias',
                href: route('agent-licenses.index'),
            }
        ],
    },
    {
        title: 'Catalogos',
        href: route('catalogs.currencies.index'),
        icon: BookCopy,
        children: [
            {
                title: 'Monedas',
                href: route('catalogs.currencies.index'),
            },
            {
                title: 'Estados civiles',
                href: route('catalogs.marital-statuses.index'),
            },
            {
                title: 'Sexos',
                href: route('catalogs.sexes.index'),
            },
            {
                title: 'Parentescos',
                href: route('catalogs.relationships.index'),
            },
            {
                title: 'Aseguradoras',
                href: route('catalogs.insurance-companies.index'),
            },
            {
                title: 'Tipos de producto',
                href: route('catalogs.product-types.index'),
            },
            {
                title: 'Productos',
                href: route('catalogs.products.index'),
            },
        ],
    },
    {
        title: 'Configuracion',
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
                title: 'Auditoria',
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
