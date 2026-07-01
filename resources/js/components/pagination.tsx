import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    currentPage: number;
    lastPage: number;
    className?: string;
}

function stripHtmlEntities(label: string): string {
    return label
        .replace(/&laquo;/g, '')
        .replace(/&raquo;/g, '')
        .trim();
}

export function Pagination({
    links,
    from,
    to,
    total,
    currentPage,
    lastPage,
    className,
}: PaginationProps) {
    if (lastPage <= 1) {
        return null;
    }

    const prevLink = links[0];
    const nextLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row',
                className,
            )}
        >
            <div className="font-mono text-xs text-muted-foreground">
                Showing{' '}
                <span className="font-semibold text-foreground">{from ?? 0}</span>
                {' '}to{' '}
                <span className="font-semibold text-foreground">{to ?? 0}</span>
                {' '}of{' '}
                <span className="font-semibold text-foreground">{total}</span>
                {' '}entries
            </div>

            <nav
                aria-label="Pagination"
                className="flex items-center gap-1"
            >
                {/* First page */}
                {currentPage > 2 && (
                    <PaginationButton
                        url={links[1]?.url ?? null}
                        ariaLabel="First page"
                    >
                        <ChevronsLeft aria-hidden className="size-3.5" />
                    </PaginationButton>
                )}

                {/* Previous */}
                <PaginationButton
                    url={prevLink?.url ?? null}
                    ariaLabel="Previous page"
                >
                    <ChevronLeft aria-hidden className="size-3.5" />
                </PaginationButton>

                {/* Page numbers */}
                {pageLinks.map((link, i) => {
                    const label = stripHtmlEntities(link.label);

                    if (label === '...') {
                        return (
                            <span
                                key={`ellipsis-${i}`}
                                className="flex size-8 items-center justify-center font-mono text-xs text-muted-foreground"
                            >
                                …
                            </span>
                        );
                    }

                    return (
                        <PaginationButton
                            key={`page-${label}`}
                            url={link.url}
                            ariaLabel={`Page ${label}`}
                            active={link.active}
                        >
                            {label}
                        </PaginationButton>
                    );
                })}

                {/* Next */}
                <PaginationButton
                    url={nextLink?.url ?? null}
                    ariaLabel="Next page"
                >
                    <ChevronRight aria-hidden className="size-3.5" />
                </PaginationButton>

                {/* Last page */}
                {currentPage < lastPage - 1 && (
                    <PaginationButton
                        url={links[links.length - 2]?.url ?? null}
                        ariaLabel="Last page"
                    >
                        <ChevronsRight aria-hidden className="size-3.5" />
                    </PaginationButton>
                )}
            </nav>
        </div>
    );
}

interface PaginationButtonProps {
    url: string | null;
    ariaLabel: string;
    active?: boolean;
    children: React.ReactNode;
}

function PaginationButton({
    url,
    ariaLabel,
    active = false,
    children,
}: PaginationButtonProps) {
    const baseClasses =
        'flex size-8 items-center justify-center rounded-lg font-mono text-xs transition-all duration-200';

    if (!url) {
        return (
            <span
                aria-label={ariaLabel}
                className={cn(
                    baseClasses,
                    'cursor-not-allowed text-muted-foreground/40',
                )}
            >
                {children}
            </span>
        );
    }

    if (active) {
        return (
            <span
                aria-current="page"
                aria-label={ariaLabel}
                className={cn(
                    baseClasses,
                    'border border-primary/40 bg-primary/15 font-semibold text-primary shadow-[0_0_8px_rgba(31,230,208,0.12)]',
                )}
            >
                {children}
            </span>
        );
    }

    return (
        <Link
            href={url}
            aria-label={ariaLabel}
            preserveState
            className={cn(
                baseClasses,
                'border border-transparent text-muted-foreground hover:border-border/40 hover:bg-background/60 hover:text-foreground',
            )}
        >
            {children}
        </Link>
    );
}
