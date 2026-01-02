"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Package,
  Truck,
  Search,
  LayoutDashboard,
  Activity
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { searchGlobalAction, SearchResult } from "@/app/admin/global-search-action";
import { toast } from "sonner";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced Search
  React.useEffect(() => {
    if (query.length < 2) {
        setResults([]);
        return;
    }

    const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
            const resp = await searchGlobalAction(query);
            if (resp.success && resp.data) {
                setResults(resp.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const shipments = results.filter(r => r.type === 'shipment');
  const leads = results.filter(r => r.type === 'lead');

  return (
    <>
      <div 
        onClick={() => setOpen(true)}
        className="relative w-full cursor-pointer md:w-64 lg:w-96 text-sm text-muted-foreground bg-background border rounded-md px-3 py-2 flex items-center gap-2 hover:bg-accent/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
            placeholder="Type a command or search..." 
            value={query}
            onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {query.length < 2 && (
              <CommandGroup heading="Suggestions">
                <CommandItem onSelect={() => runCommand(() => router.push("/admin"))}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/admin/shipments"))}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>Shipments</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/admin/leads"))}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Leads</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => router.push("/admin/system"))}>
                  <Activity className="mr-2 h-4 w-4" />
                  <span>System Status</span>
                </CommandItem>
              </CommandGroup>
          )}

          {shipments.length > 0 && (
              <CommandGroup heading="Shipments">
                  {shipments.map(s => (
                    <CommandItem key={s.id} value={s.title + s.id} onSelect={() => runCommand(() => router.push(s.url))}>
                        <Truck className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                            <span>{s.title}</span>
                            <span className="text-xs text-muted-foreground">{s.subtitle}</span>
                        </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
          )}

          {leads.length > 0 && (
             <CommandGroup heading="Leads">
                  {leads.map(l => (
                    <CommandItem key={l.id} value={l.title + l.id} onSelect={() => runCommand(() => router.push(l.url))}>
                        <User className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                            <span>{l.title}</span>
                            <span className="text-xs text-muted-foreground">{l.subtitle}</span>
                        </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
          )}

        </CommandList>
      </CommandDialog>
    </>
  );
}
