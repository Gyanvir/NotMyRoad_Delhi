import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, AlertTriangle, Building, Send, ChevronRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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

const DELHI_BOUNDS = { north: 28.88, south: 28.40, east: 77.35, west: 76.84 };

function isWithinDelhi(lat: number, lng: number) {
  return lat >= DELHI_BOUNDS.south && lat <= DELHI_BOUNDS.north &&
    lng >= DELHI_BOUNDS.west && lng <= DELHI_BOUNDS.east;
}

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
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [editingCoords, setEditingCoords] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [stepError, setStepError] = useState("");

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

  const handleCaptureLocation = () => {
    setLocationError("");
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isWithinDelhi(lat, lng)) {
          setLocationError("Your current location appears to be outside Delhi. Only issues within Delhi (not NCR) can be reported. Please adjust coordinates manually if you are in Delhi.");
          setIsLocating(false);
          return;
        }
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        setLocationCaptured(true);
        setIsLocating(false);
      },
      (err) => {
        let msg = "Could not get your location. ";
        if (err.code === 1) msg += "Permission denied — please allow location access in your browser.";
        else if (err.code === 2) msg += "Location unavailable. Try again.";
        else msg += "Request timed out. Try again.";
        setLocationError(msg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleManualCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      setLocationError("Please enter valid numeric coordinates.");
      return;
    }
    if (!isWithinDelhi(lat, lng)) {
      setLocationError("This location is outside Delhi. NotMyRoad only covers issues within Delhi (NCR is not under our jurisdiction).");
      return;
    }
    setLocationError("");
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    setLocationCaptured(true);
    setEditingCoords(false);
  };

  const handleNext = () => {
    setStepError("");
    if (step === 1) {
      if (!formData.imageUrl) { setStepError("Please upload a photo of the issue."); return; }
      if (!locationCaptured) { setStepError("Please capture your GPS location."); return; }
    }
    if (step === 2) {
      if (!formData.area.trim()) { setStepError("Please enter the area/locality."); return; }
    }
    setStep((s) => Math.min(s + 1, 4));
  };
  const handlePrev = () => { setStepError(""); setStep((s) => Math.max(s - 1, 1)); };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        setStepError("");
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
                    <label className="block text-sm font-medium text-muted-foreground">
                      Photo Evidence <span className="text-destructive">*</span>
                    </label>
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
                        <span className="text-xs text-muted-foreground mt-1">Required — photo evidence of the issue</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-muted-foreground">
                      GPS Location <span className="text-destructive">*</span>
                    </label>

                    {!locationCaptured && !editingCoords && (
                      <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-secondary/40 rounded-xl bg-secondary/5 gap-3">
                        <MapPin className="w-8 h-8 text-secondary" />
                        <div className="flex gap-3">
                          <Button onClick={handleCaptureLocation} disabled={isLocating} className="gap-2">
                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                            {isLocating ? "Fetching..." : "Get GPS Location"}
                          </Button>
                          <Button variant="outline" onClick={() => { setEditingCoords(true); setLatInput(""); setLngInput(""); }} className="text-xs">
                            Enter manually
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">Only Delhi locations are accepted</span>
                      </div>
                    )}

                    {editingCoords && !locationCaptured && (
                      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <p className="text-sm text-muted-foreground">Enter coordinates manually (Delhi only)</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Latitude (28.40–28.88)</label>
                            <input
                              className="w-full h-10 rounded-lg border border-border bg-input/50 px-3 text-foreground font-mono text-sm focus:border-primary outline-none"
                              placeholder="e.g. 28.6139"
                              value={latInput}
                              onChange={e => setLatInput(e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground mb-1 block">Longitude (76.84–77.35)</label>
                            <input
                              className="w-full h-10 rounded-lg border border-border bg-input/50 px-3 text-foreground font-mono text-sm focus:border-primary outline-none"
                              placeholder="e.g. 77.2090"
                              value={lngInput}
                              onChange={e => setLngInput(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleManualCoords}>Confirm Location</Button>
                          <Button size="sm" variant="ghost" onClick={handleCaptureLocation} disabled={isLocating} className="gap-1">
                            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                            Use GPS instead
                          </Button>
                        </div>
                      </div>
                    )}

                    {locationCaptured && (
                      <div className="bg-card border border-primary/30 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-primary">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-semibold">Location captured</span>
                          </div>
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground underline"
                            onClick={() => { setEditingCoords(true); setLocationCaptured(false); setLatInput(formData.latitude.toFixed(6)); setLngInput(formData.longitude.toFixed(6)); }}
                          >
                            Edit
                          </button>
                        </div>
                        <div className="font-mono text-sm text-foreground/80 bg-background/40 px-3 py-2 rounded-lg border border-primary/20">
                          {formData.latitude.toFixed(6)}° N, {formData.longitude.toFixed(6)}° E
                        </div>
                      </div>
                    )}

                    {locationError && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{locationError}</span>
                      </div>
                    )}
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
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Area / Locality <span className="text-destructive">*</span>
                      </label>
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
                        <div>
                          <span className="text-muted-foreground block mb-1">Location</span>
                          <span className="font-medium text-foreground">{formData.area || "Area not specified"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Coordinates</span>
                          <span className="font-mono text-xs text-foreground">{formData.latitude.toFixed(4)}°N, {formData.longitude.toFixed(4)}°E</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
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

          {stepError && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {stepError}
            </div>
          )}

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
