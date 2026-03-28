import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, AlertTriangle, Building, Send, ChevronRight, CheckCircle2 } from "lucide-react";
import { useCreateReport, CreateReportInputIssueType, CreateReportInputRoadType, CreateReportInputAuthority } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { id: 1, title: "Location & Photo", icon: Camera },
  { id: 2, title: "Issue Details", icon: AlertTriangle },
  { id: 3, title: "Authority", icon: Building },
  { id: 4, title: "Review", icon: Send },
];

export default function ReportWizard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const createReportMutation = useCreateReport();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    imageUrl: "",
    latitude: 0,
    longitude: 0,
    area: "",
    issueType: "pothole" as keyof typeof CreateReportInputIssueType,
    roadType: "main_road" as keyof typeof CreateReportInputRoadType,
    description: "",
    authority: "MCD" as keyof typeof CreateReportInputAuthority,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleCaptureLocation = () => {
    // Mock location
    setFormData(prev => ({ ...prev, latitude: 28.6139, longitude: 77.2090 }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await createReportMutation.mutateAsync({
        data: {
          userId: user.id,
          userName: user.name,
          ...formData
        }
      });
      setLocation(`/report/${res.id}`);
    } catch (error) {
      console.error("Failed to submit report", error);
    }
  };

  const tweetText = `🚨 Road issue reported in ${formData.area}, Delhi! ${formData.issueType.replace('_', ' ')} on ${formData.roadType.replace('_', ' ')}. Authority: @${formData.authority}. This needs urgent attention! #Delhi #NotMyRoad`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between relative z-10">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                step >= s.id ? "bg-primary text-primary-foreground neon-glow" : "bg-card border border-border text-muted-foreground"
              }`}>
                {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-xs font-medium ${step >= s.id ? "text-primary" : "text-muted-foreground"}`}>{s.title}</span>
            </div>
          ))}
          {/* Connecting lines */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300 -z-10" 
            style={{ width: `${((step - 1) / 3) * 100}%` }} 
          />
        </div>
      </div>

      <Card className="border-primary/20 overflow-visible">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-display font-bold">Capture the Issue</h2>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-muted-foreground">Photo Evidence</label>
                    {formData.imageUrl ? (
                      <div className="relative rounded-xl overflow-hidden h-48 border border-white/10">
                        <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                        <Button 
                          variant="destructive" size="sm" className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/50 rounded-xl cursor-pointer bg-primary/5 hover:bg-primary/10 transition-colors">
                        <Camera className="w-10 h-10 text-primary mb-2" />
                        <span className="text-primary font-medium">Click to upload photo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-muted-foreground">Location</label>
                    <div className="relative rounded-xl overflow-hidden h-48 border border-white/10 bg-card">
                      <img src={`${import.meta.env.BASE_URL}images/mock-map.png`} className="w-full h-full object-cover opacity-60" alt="Map" />
                      <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                        {formData.latitude ? (
                          <div className="text-center">
                            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                            <div className="bg-black/50 px-4 py-2 rounded-lg font-mono text-sm border border-primary/30">
                              Lat: {formData.latitude.toFixed(4)}, Lng: {formData.longitude.toFixed(4)}
                            </div>
                          </div>
                        ) : (
                          <Button onClick={handleCaptureLocation} className="gap-2">
                            <MapPin className="w-4 h-4" /> Get GPS Location
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-display font-bold">Issue Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Issue Type</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.values(CreateReportInputIssueType).map(type => (
                          <button
                            key={type}
                            onClick={() => setFormData(prev => ({ ...prev, issueType: type }))}
                            className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                              formData.issueType === type 
                                ? 'bg-primary/20 border-primary text-primary neon-glow' 
                                : 'bg-card border-border text-muted-foreground hover:border-primary/50'
                            }`}
                          >
                            {type.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Road Type</label>
                      <select 
                        className="w-full h-12 rounded-xl border border-border bg-input/50 px-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={formData.roadType}
                        onChange={(e) => setFormData(prev => ({ ...prev, roadType: e.target.value as any }))}
                      >
                        <option value="main_road">Main Road</option>
                        <option value="internal_road">Internal Road/Colony</option>
                        <option value="highway">Highway</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Area / Locality</label>
                      <Input 
                        placeholder="e.g. Connaught Place, Block A" 
                        value={formData.area}
                        onChange={e => setFormData(prev => ({ ...prev, area: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Description (Optional)</label>
                      <textarea 
                        className="w-full h-24 rounded-xl border border-border bg-input/50 p-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                        placeholder="Add any additional details..."
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-display font-bold">Assign Authority</h2>
                  
                  <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-xl">
                    <h4 className="font-semibold text-secondary flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Quick Guide
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>MCD:</strong> Colony roads, streets narrower than 60ft</li>
                      <li>• <strong>PWD:</strong> Main roads, wider than 60ft</li>
                      <li>• <strong>NDMC:</strong> Lutyens Delhi / Central Delhi area</li>
                      <li>• <strong>NHAI:</strong> National Highways</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.values(CreateReportInputAuthority).map(auth => (
                      <button
                        key={auth}
                        onClick={() => setFormData(prev => ({ ...prev, authority: auth }))}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          formData.authority === auth 
                            ? 'bg-secondary/20 border-secondary text-secondary cyan-glow' 
                            : 'bg-card border-border text-muted-foreground hover:border-secondary/50'
                        }`}
                      >
                        <div className="font-display font-bold text-xl mb-1">{auth}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-display font-bold">Review & Submit</h2>
                  
                  <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
                    <img src={formData.imageUrl || `${import.meta.env.BASE_URL}images/hero-bg.png`} className="w-full h-40 object-cover opacity-80" alt="Report visual" />
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground block mb-1">Issue</span>
                          <span className="font-semibold capitalize text-foreground">{formData.issueType.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Authority</span>
                          <span className="font-semibold text-primary">{formData.authority}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground block mb-1">Location</span>
                          <span className="font-medium text-foreground">{formData.area || "Area not specified"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    </div>
                    <h4 className="font-semibold text-blue-400 mb-2">Auto-generated Tweet</h4>
                    <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                      {tweetText}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-border flex justify-between">
            <Button 
              variant="ghost" 
              onClick={handlePrev} 
              disabled={step === 1}
              className="px-0 hover:bg-transparent"
            >
              Back
            </Button>

            {step < 4 ? (
              <Button onClick={handleNext} className="gap-2 w-32">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                isLoading={createReportMutation.isPending}
                className="gap-2 w-40"
              >
                Submit <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
