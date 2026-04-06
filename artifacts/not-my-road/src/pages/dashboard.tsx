import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useListReports, ListReportsStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { formatReportId } from "@/lib/utils";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<"all" | ListReportsStatus>("all");
  
  // We pass userId to filter for only this user's reports
  const { data: reports, isLoading: reportsLoading } = useListReports({ 
    userId: user?.id?.toString()
  }, {
    query: { enabled: !!user } as any
  });

  const filteredReports = reports?.filter(r => {
    const rStatus = r.status.toLowerCase().replace(/[- ]/g, '_');
    return filter === "all" || rStatus === filter;
  });

  const isLoading = reportsLoading;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <span className="text-primary font-bold text-2xl">NR</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h2>
          <p className="text-muted-foreground mb-6">Track all the road issues you've reported across Delhi.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setLocation("/login")}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => setLocation("/register")}
            className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:border-primary/50 transition-colors"
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">My Reports</h1>
        <p className="text-muted-foreground">Track the status of the issues you've reported.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(["all", "pending", "in_progress", "resolved"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
              filter === f 
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
          {[1,2,3].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-card/20" />
          ))}
        </div>
      ) : reports?.length === 0 ? (
        <div className="text-center py-20 bg-card/20 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">No reports found.</p>
          <Link href="/report">
            <button className="text-primary font-medium hover:underline">Submit your first report</button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports?.map(report => (
            <Link key={report.id} href={`/report/${report.id}`} className="block group">
              <Card className="h-full hover:border-primary/50 transition-colors duration-300">
                <div className="h-40 overflow-hidden relative border-b border-white/5">
                  <img 
                    src={report.imageUrl} 
                    alt={report.issueType}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={report.status.toLowerCase().replace(/[- ]/g, '_') as any}>{report.status.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-primary/70">{formatReportId(report.id)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg capitalize mb-1">{report.issueType.replace('_', ' ')}</h3>
                  <p className="text-sm text-muted-foreground truncate mb-3">{report.area}</p>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-white/5">
                    <span className="text-xs font-medium bg-secondary/10 text-secondary px-2 py-1 rounded">
                      {report.authority}
                    </span>
                    <span className="text-xs text-muted-foreground">{report.daysUnresolved} days unresolved</span>
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
