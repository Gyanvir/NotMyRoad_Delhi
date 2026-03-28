import { useState } from "react";
import { Link } from "wouter";
import { useListReports, ListReportsStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { formatReportId } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Feed() {
  const [statusFilter, setStatusFilter] = useState<"all" | ListReportsStatus>("all");
  const [search, setSearch] = useState("");

  const { data: reports, isLoading } = useListReports({ 
    status: statusFilter === "all" ? undefined : statusFilter
  });

  const filteredReports = reports?.filter(r => 
    r.area.toLowerCase().includes(search.toLowerCase()) || 
    r.issueType.toLowerCase().includes(search.toLowerCase()) ||
    r.authority.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">Community Feed</h1>
          <p className="text-muted-foreground">Public timeline of road issues across Delhi.</p>
        </div>
        
        <div className="w-full md:w-72">
          <Input 
            placeholder="Search area or issue..." 
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(["all", "pending", "in_progress", "resolved"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              statusFilter === f 
                ? "bg-primary/20 text-primary border-primary/50 neon-glow" 
                : "bg-card border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {f === "all" ? "All Reports" : f.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-card/20" />
          ))}
        </div>
      ) : filteredReports?.length === 0 ? (
        <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground">No reports match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports?.map(report => (
            <Link key={report.id} href={`/report/${report.id}`} className="block group">
              <Card className="flex flex-col sm:flex-row h-full hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/40 border-white/5">
                <div className="w-full sm:w-48 h-48 sm:h-auto overflow-hidden relative shrink-0">
                  <img 
                    src={report.imageUrl} 
                    alt={report.issueType}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-card to-transparent" />
                </div>
                <CardContent className="p-5 flex flex-col justify-between w-full relative z-10">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={report.status} className="scale-90 origin-top-left">
                        {report.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg capitalize mb-1">{report.issueType.replace('_', ' ')}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{report.area}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {report.authority}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{formatReportId(report.id)}</span>
                    </div>
                    {report.daysUnresolved > 7 && report.status !== 'resolved' && (
                      <span className="text-xs font-semibold text-destructive px-2 py-1 bg-destructive/10 rounded animate-pulse">
                        {report.daysUnresolved}d
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
