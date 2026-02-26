import { Globe, Database, Server, Activity } from "lucide-react";

export function TenantStats({
  totalActiveTenants,
}: {
  totalActiveTenants: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      <div className="bg-card border p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-colors shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Globe className="w-24 h-24 text-primary" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Total Active Tenants
          </p>
          <h2 className="text-4xl font-bold">{totalActiveTenants}</h2>
          <div className="flex items-center gap-2 mt-4 text-sm text-emerald-500 dark:text-emerald-400 font-medium">
            <Activity className="w-4 h-4" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      <div className="bg-card border p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Database className="w-24 h-24 text-purple-500" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Database Queries / sec
          </p>
          <h2 className="text-4xl font-bold">45.2k</h2>
          <div className="w-full bg-muted h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-purple-500 w-[65%] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="bg-card border p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <Server className="w-24 h-24 text-emerald-500" />
        </div>
        <div className="relative z-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Server Health
          </p>
          <h2 className="text-4xl font-bold">99.9%</h2>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm ${i === 10 ? "bg-yellow-500" : "bg-emerald-500"}`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
