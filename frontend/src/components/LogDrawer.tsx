import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Image as ImageIcon } from "lucide-react";
import StackedList from "@/components/ui/stacked-list";

interface LogDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    log: any; // Type this properly in production
}

export function LogDrawer({ isOpen, onOpenChange, log }: LogDrawerProps) {
    if (!log) return null;

    const logDetails = [
        { id: 'url', title: 'Target URL', subtitle: log.url, status: 'Request', icon: AlertTriangle },
        { id: 'method', title: 'HTTP Method', subtitle: log.method || 'GET', status: 'Info', icon: AlertTriangle },
        { id: 'status', title: 'Status Code', subtitle: log.status?.toString() || 'Unknown', status: log.status === 200 ? 'Success' : 'Error', icon: AlertTriangle },
        { id: 'duration', title: 'Duration', subtitle: `${log.duration || 0}ms`, status: 'Performance', icon: AlertTriangle },
        { id: 'timestamp', title: 'Timestamp', subtitle: log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A', status: 'Time', icon: AlertTriangle },
    ];

    // Add error if present
    if (log.error) {
        logDetails.push({ id: 'error', title: 'Error Message', subtitle: log.error, status: 'Critical', icon: AlertTriangle });
    }

    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-2xl h-[80vh] flex flex-col">
                    <DrawerHeader className="border-b border-gray-100 dark:border-zinc-800 shrink-0">
                        <DrawerTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Request Details</DrawerTitle>
                        <DrawerDescription className="font-mono text-gray-500 dark:text-gray-400">{log.id}</DrawerDescription>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Use StackedList for details */}
                        <div className="mb-6">
                            {/* Temporary Import handling within component file for brevity in this specific refactor step, ideally this would be a separate component import */}
                            <StackedList
                                items={logDetails.map(d => ({
                                    ...d,
                                    active: true // Just style them all as active for visibility
                                }))}
                                title="Log Attributes"
                            />
                        </div>

                        {log.screenshot && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <ImageIcon size={16} /> Error Snapshot
                                </h4>
                                <div className="relative aspect-video bg-gray-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 flex items-center justify-center group">
                                    <span className="text-gray-400 text-sm group-hover:hidden">Screenshot Placeholder ({log.screenshot})</span>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button size="sm" variant="outline" className="text-white border-white hover:bg-white hover:text-black">View Fullscreen</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DrawerFooter className="border-t border-gray-100 dark:border-zinc-800 shrink-0">
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function DetailItem({ label, value, fullWidth }: any) {
    return (
        <div className={`flex flex-col ${fullWidth ? 'col-span-2' : ''}`}>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-200 break-all p-2 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">{value}</span>
        </div>
    );
}
