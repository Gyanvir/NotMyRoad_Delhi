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
    <>
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

        {/* What is NMR Section */}
        <section className="relative mt-12 px-6 py-16 md:py-24 rounded-3xl overflow-hidden border border-white/5 bg-card/20 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="text-primary border-primary/30 mb-2">ABOUT THE INITIATIVE</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">What is Not My Road?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed text-left md:text-center">
              Not My Road (NMR) is a civic action platform designed to bridge the gap between citizens and local authorities like MCD, PWD, and NDMC.
              We empower you to take ownership of your city's infrastructure by reporting issues directly, tracking their resolution, and holding the system accountable.
              Because when a road is broken, it's not just "their" road—it's <em className="text-primary">our</em> city.
            </p>
          </div>
        </section>

        {/* How to Use Section */}
        <section className="space-y-12 py-12">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-secondary border-secondary/30">USER FLOW</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How to Use the App</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to make your voice heard and get issues fixed in your neighborhood.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-12">
            {/* Step 1 */}
            <div className="space-y-6 group">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[9/16] shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <img src={`${import.meta.env.BASE_URL}images/step1.jpg`} alt="Report Issue UI" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-[0_0_15px_rgba(var(--primary),0.5)]">1</div>
                  <h3 className="text-xl font-bold mb-2">Snap & Report</h3>
                  <p className="text-sm text-white drop-shadow-md font-medium">Click a photo, grab your GPS location, and report it on Not My Road.</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-6 group md:translate-y-8">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[9/16] shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <img src={`${import.meta.env.BASE_URL}images/step2.jpg`} alt="Feed UI" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-secondary text-secondary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-[0_0_15px_rgba(var(--secondary),0.5)]">2</div>
                  <h3 className="text-xl font-bold mb-2">Community Feed</h3>
                  <p className="text-sm text-white drop-shadow-md font-medium">See it pop up on our community feed and official X (Twitter) account.</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-6 group md:translate-y-16">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[9/16] shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                <img src={`${import.meta.env.BASE_URL}images/step3.jpg`} alt="Resolution Timeline UI" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-amber-500 text-amber-950 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-[0_0_15px_rgba(245,158,11,0.5)]">3</div>
                  <h3 className="text-xl font-bold mb-2">Track Progress</h3>
                  <p className="text-sm text-white drop-shadow-md font-medium">Track its progress by clicking on your report or via updates on X.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support CTA */}
        <section className="relative mt-8 md:mt-16 rounded-3xl overflow-hidden border border-primary/20 bg-primary/5 p-8 md:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-50" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">Join the Movement</h2>
            <p className="text-lg text-muted-foreground">
              We are looking for passionate individuals to support this social cause. Whether you can help spread awareness, assist in marketing, or contribute your tech skills to improve the platform—your help matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a href="mailto:gyanvirsingh09@gmail.com">
                <Button size="lg" className="h-14 px-8 w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                  Volunteer with Us
                </Button>
              </a>
              <a
                href="https://x.com/intent/tweet?text=Join%20me%20in%20making%20our%20city%20better%21%20Report%20civic%20issues%20directly%20to%20authorities%20with%20%40notmyroad.%20Let%27s%20fix%20our%20roads%20together%21%20%23NotMyRoad"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="h-14 px-8 w-full sm:w-auto border-primary/30 hover:bg-primary/10">
                  Share the App
                </Button>
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer & About Section */}
      <footer className="mt-24 pt-16 pb-8 border-t border-white/10 bg-background/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">NotMyRoad.</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
              Built as a project by <strong className="text-foreground">Gyanvir Singh</strong>.
              NMR started from a personal frustration—the stress of navigating civic complaints and wondering how to get things fixed in Delhi.
              It is a continuous work in progress, and many more features are planned to be added to make civic reporting stress-free for everyone.
            </p>
          </div>

          <div className="flex flex-col md:items-end space-y-4">
            <h4 className="font-bold text-lg">Quick Links</h4>
            <nav className="flex flex-col space-y-2 text-sm text-muted-foreground md:text-right">
              <Link href="/report" className="hover:text-primary transition-colors">Report an Issue</Link>
              <Link href="/feed" className="hover:text-primary transition-colors">Live Feed</Link>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Not My Road. All rights reserved.</p>
          <p className="text-xs text-muted-foreground flex items-center">
            Designed for absolute change
          </p>
        </div>
      </footer>
    </>
  );
}
