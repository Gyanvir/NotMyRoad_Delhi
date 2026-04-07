import { useState } from "react";
import { Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateCurrentUser } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";

export function CompleteProfileModal() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateProfile = useUpdateCurrentUser();
  const queryClient = useQueryClient();

  // Show modal if user is logged in, but doesn't have a phone number.
  // Note: We check user.id to be safe that the object exists.
  const isOpen = !!user?.id && !user.phoneNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Please enter a valid phone number.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        data: { phoneNumber },
      });
      // Force a manual refetch so the local auth state reflects the new number
      await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    } catch (err: any) {
      setError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      {/* We purposefully don't provide an onOpenChange close handler 
          so the user cannot dismiss the modal without filling it out. */}
      <DialogContent className="sm:max-w-md [&>button]:hidden pointer-events-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Complete Your Profile</DialogTitle>
          <DialogDescription>
            A mobile number is required to submit road issue reports to civic authorities. Please provide one to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Input
              type="tel"
              placeholder="Mobile Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              icon={<Phone className="w-5 h-5" />}
              autoComplete="tel"
              required
            />
          </div>

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Save and Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
