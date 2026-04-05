import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useListReports } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar, LogOut, Award, AlertCircle, CheckCircle } from "lucide-react";

export default function Profile() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: reports, isLoading: reportsLoading } = useListReports(
    { userId: user?.id?.toString() },
    { query: { enabled: !!user, queryKey: ['reports', { userId: user?.id?.toString() }] } }
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      await logout();
      setLocation("/login");
    }
  };

  const totalReports = reports?.length ?? 0;
  const resolved = reports?.filter(r => r.status === "resolved").length ?? 0;
  const pending = totalReports - resolved;
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center pt-8 pb-4">
        <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-4 bg-gradient-to-br from-primary/30 to-background">
          <span className="text-3xl font-display font-bold text-primary">{initials}</span>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight mb-2">{user.name}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center p-6 transition-all hover:bg-card">
          <span className="text-3xl font-bold font-display text-foreground mb-1">{totalReports}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports</span>
        </Card>
        <Card className="border-status-resolved/30 bg-card/60 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center p-6 transition-all hover:bg-card">
          <CheckCircle className="w-5 h-5 text-status-resolved mb-2" />
          <span className="text-3xl font-bold font-display text-status-resolved mb-1">{resolved}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</span>
        </Card>
        <Card className="border-status-pending/30 bg-card/60 backdrop-blur-sm shadow-xl flex flex-col items-center justify-center p-6 transition-all hover:bg-card">
          <AlertCircle className="w-5 h-5 text-status-pending mb-2" />
          <span className="text-3xl font-bold font-display text-status-pending mb-1">{pending}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending</span>
        </Card>
      </div>

      <Card className="border-border bg-card/60 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0">
          <div className="p-5 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Email Address</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="h-px w-full bg-border" />
          <div className="p-5 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Member Since</p>
              <p className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-primary font-bold text-lg mb-1 drop-shadow-md">Civic Champion</h3>
          <p className="text-sm text-muted-foreground leading-relaxed text-balance">
            Thank you for actively contributing to making Delhi's roads safer. Your reports directly help authorities resolve issues faster!
          </p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 group p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive font-semibold transition-all shadow-md mt-6"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Sign Out securely
      </button>

    </div>
  );
}
