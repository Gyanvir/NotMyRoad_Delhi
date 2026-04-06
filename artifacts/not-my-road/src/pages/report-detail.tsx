import { useLocation, useParams } from "wouter";
import { useGetReport, useUpdateReportStatus, UpdateReportStatusInputStatus } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { MapPin, Calendar, Building, Copy, Twitter, AlertTriangle, ArrowLeft } from "lucide-react";
import { formatReportId } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const getRoadmapLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'Complaint Logged';
    case 'in_progress': return 'Filed at Portal';
    case 'resolved': return 'Resolved';
    default: return status.replace('_', ' ');
  }
};


export default function ReportDetail() {
  const { id } = useParams();
  const reportId = Number(id);
  const { data: report, isLoading } = useGetReport(reportId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const updateStatusMutation = useUpdateReportStatus();
  
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLoading) return <div className="p-10 text-center animate-pulse">Loading report...</div>;
  if (!report) return <div className="p-10 text-center text-destructive">Report not found</div>;

  const copyTweet = () => {
    navigator.clipboard.writeText(report.tweetDraft);
    toast({ title: "Copied!", description: "Tweet draft copied to clipboard." });
  };

  const handleUpdateStatus = async (status: UpdateReportStatusInputStatus) => {
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: reportId,
        data: { status, note: `Status updated to ${status.replace('_', ' ')}` }
      });
      toast({ title: "Status updated", description: `Report is now ${status.replace('_', ' ')}` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const isAdmin = user?.email.includes('admin'); // Very basic admin check mock

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/feed")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold capitalize">
              {report.issueType.replace('_', ' ')}
            </h1>
            <Badge variant={report.status}>{report.status.replace('_', ' ').toUpperCase()}</Badge>
          </div>
          <p className="text-muted-foreground font-mono">{formatReportId(report.id)} • Reported by {report.userName}</p>
        </div>
        
        {isAdmin && report.status !== 'resolved' && (
          <div className="flex gap-2">
            {report.status === 'pending' && (
              <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus('in_progress')} isLoading={isUpdating}>
                Mark In Progress
              </Button>
            )}
            <Button size="sm" onClick={() => handleUpdateStatus('resolved')} isLoading={isUpdating}>
              Mark Resolved
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Image & Data */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-white/5">
            <img 
              src={report.imageUrl} 
              className="w-full h-[400px] object-cover opacity-90"
              alt="Report photo"
            />
          </Card>

          <Card className="border-white/5 bg-card/40">
            <CardContent className="p-6">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-primary w-5 h-5"/> Issue Details
              </h3>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4"/> Location</span>
                  <p className="font-medium">{report.area}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><Building className="w-4 h-4"/> Authority</span>
                  <p className="font-medium text-secondary">{report.authority}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{report.roadType.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><Calendar className="w-4 h-4"/> Date Reported</span>
                  <p className="font-medium">{format(new Date(report.createdAt), "PPP")}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><Calendar className="w-4 h-4"/> Age</span>
                  <p className="font-medium text-amber-500">{report.daysUnresolved} days unresolved</p>
                </div>
              </div>

              {report.description && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <span className="text-sm text-muted-foreground block mb-2">Description</span>
                  <p className="text-foreground/90">{report.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Social Pressure Section */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-6 relative overflow-hidden">
              <Twitter className="absolute top-4 right-4 w-20 h-20 text-blue-500/10" />
              <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                <Twitter className="w-5 h-5" /> Apply Social Pressure
              </h3>
              <p className="text-sm text-foreground/90 font-medium leading-relaxed mb-4 relative z-10">
                {report.tweetDraft}
              </p>
              <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20" onClick={copyTweet}>
                <Copy className="w-4 h-4 mr-2" /> Copy Tweet
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Timeline */}
        <div className="space-y-6">
          <Card className="border-white/5 bg-card/40 h-full">
            <CardContent className="p-6">
              <h3 className="text-xl font-display font-bold mb-6">Timeline</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {report.timeline.map((event, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 neon-glow" />
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-background/50 border border-border p-3 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-primary capitalize text-sm">{getRoadmapLabel(event.status)}</span>
                        <time className="text-[10px] text-muted-foreground font-mono">{format(new Date(event.timestamp), "MMM d, HH:mm")}</time>
                      </div>
                      {event.note && <div className="text-xs text-foreground/80">{event.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
