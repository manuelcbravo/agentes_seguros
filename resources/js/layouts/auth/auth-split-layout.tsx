import { Link } from '@inertiajs/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { home } from '@/routes';

export default function AuthSplitLayout({
    title,
    description,
    name,
    headerContent,
    children,
}: PropsWithChildren<{
    title: string;
    description: string;
    name?: string;
    headerContent?: ReactNode;
}>) {
    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-[65%_35%] lg:px-0">
            <div className="relative hidden h-full flex-col overflow-hidden p-10 text-white lg:flex dark:border-r">
                <img
                    src="/assets/images/background/background_1.png"
                    alt="Ilustracion del panel de acceso"
                    className="absolute inset-0 h-full w-full object-cover dark:hidden"
                />
                <img
                    src="/assets/images/background/background_3.png"
                    alt="Ilustracion del panel de acceso"
                    className="absolute inset-0 hidden h-full w-full object-cover dark:block"
                />
                <div className="absolute inset-0 bg-slate-950/45" />

                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium"
                >
                    <img
                        src="/assets/images/logos/logo.png"
                        alt="Logo"
                        className="mr-2 h-10 w-auto"
                    />
                    {name}
                </Link>
            </div>

            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full max-w-md flex-col justify-center space-y-6">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <img
                            src="/assets/images/logos/logo.png"
                            alt="Logo"
                            className="h-10 w-auto sm:h-12"
                        />
                    </Link>

                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        {headerContent}
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
