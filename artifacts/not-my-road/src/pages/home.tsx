import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { useGetStats, useListReports } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: recentReports } = useListReports({ limit: 3 });

  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden min-h-[60vh] flex flex-col justify-center items-center text-center p-6 md:p-12 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Dark urban street"
            className="w-full h-full object-cover opacity-50 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-primary/20 text-primary text-sm px-4 py-2 border-primary/30">
              FOR A SAFER CAPITAL
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Fix Your City. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-glow">
                Report The Road.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Not My Road connects citizens directly with MCD, PWD, and NDMC.
              Snap a photo, grab GPS, and hold authorities accountable.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/report">
              <Button size="lg" className="w-full sm:w-auto h-14 text-lg px-8">
                Report an Issue <AlertTriangle className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 text-lg px-8">
                View Live Feed
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-primary/20">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-2">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary mb-2">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-display font-bold">{stats?.totalReports || 0}</h3>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Total Reports</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-secondary/20">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-2">
            <div className="p-4 rounded-2xl bg-secondary/10 text-secondary mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-display font-bold">{stats?.resolvedPercentage || 0}%</h3>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Resolution Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-amber-500/20">
          <CardContent className="p-8 flex flex-col items-center text-center space-y-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-4xl font-display font-bold">{stats?.pendingReports || 0}</h3>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-sm">Pending Action</p>
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-bold">Recent Activity</h2>
          <Link href="/feed" className="text-primary hover:text-primary/80 flex items-center font-medium">
            View All <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentReports?.map((report) => (
            <Link key={report.id} href={`/report/${report.id}`} className="block group">
              <Card className="h-full hover:border-primary/50 transition-colors duration-300">
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={report.imageUrl}
                    alt={report.issueType}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <Badge variant={report.status.toLowerCase().replace(/[- ]/g, '_') as any}>{report.status.replace('_', ' ').toUpperCase()}</Badge>
                  </div>
                </div>
                <CardContent className="p-5 space-y-2">
                  <div className="flex justify-between items-start text-xs text-muted-foreground mb-2">
                    <span>{formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}</span>
                    <span className="font-semibold text-primary/80">{report.authority}</span>
                  </div>
                  <h3 className="font-bold text-lg capitalize">{report.issueType.replace('_', ' ')}</h3>
                  <p className="text-sm text-muted-foreground truncate">{report.area}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
