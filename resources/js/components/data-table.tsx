import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    emptyMessage?: string;
}

export function DataTable<TData>({
    columns,
    data,
    emptyMessage = 'No data available.',
}: DataTableProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-background/25">
            <Table className="min-w-[720px]">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                            key={headerGroup.id}
                            className="border-border bg-background/40 hover:bg-background/40"
                        >
                            {headerGroup.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="h-9 text-xs text-muted-foreground"
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext(),
                                          )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="border-border/70 hover:bg-primary/5"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className="h-11 text-sm"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
