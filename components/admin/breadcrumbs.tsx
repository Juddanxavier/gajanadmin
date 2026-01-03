'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { ChevronRight, Home } from 'lucide-react';

export function AdminBreadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean); // No longer slicing off 'admin'

    const getSegmentName = (segment: string, index: number, allSegments: string[]) => {
        // ID check (UUID or long alphanumeric)
        if (segment.length > 20 || (segment.length > 8 && /\d/.test(segment))) {
           return 'Details';
        }
        
        switch(segment) {
            case 'shipments': return 'Shipments';
            case 'leads': return 'Leads';
            case 'users': return 'Users';
            case 'settings': return 'Settings';
            case 'system': return 'System Status';
            default: return segment.charAt(0).toUpperCase() + segment.slice(1);
        }
    };

    return (
        <nav className="hidden sm:flex items-center space-x-1 text-sm text-muted-foreground">
            <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
               <Home className="h-4 w-4" />
            </Link>
            
            {segments.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}

            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const href = `/${segments.slice(0, index + 1).join('/')}`;
                const name = getSegmentName(segment, index, segments);

                return (
                    <Fragment key={href}>
                        {isLast ? (
                            <span className="font-medium text-foreground">{name}</span>
                        ) : (
                            <Link href={href} className="hover:text-foreground transition-colors">
                                {name}
                            </Link>
                        )}
                        {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
                    </Fragment>
                );
            })}
        </nav>
    );
}
