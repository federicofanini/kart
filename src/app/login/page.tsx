"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeaderAuth } from "@/components/leader-auth";
import { useLeaderAuth } from "@/hooks/use-leader-auth";
import { Footer } from "@/components/footer";
import { Car, Crown } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { isAuthenticated } = useLeaderAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
          <div className="lap-counter text-2xl mb-2">REDIRECTING...</div>
          <div className="speed-lines w-32 h-1 mx-auto bg-primary/30 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card f1-gradient racing-stripes">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/logo.PNG"
              alt="Logo"
              width={40}
              height={40}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-primary flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight lap-counter truncate">
                VIBRATA GRAND PRIX
              </h1>
              <p className="text-white/90 font-medium tracking-wide uppercase text-xs sm:text-sm telemetry-data px-2 py-1 rounded mt-1">
                🏁 Leader Access Portal
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <div className="text-center f1-card p-6 sm:p-8 rounded-lg">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="h-8 w-8 text-primary" />
              <h2 className="text-2xl sm:text-3xl font-bold lap-counter">
                RACE CONTROL ACCESS
              </h2>
            </div>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
              Sign in or register as a leader to manage race events and results
            </p>
            <div className="w-48 sm:w-64 h-2 mx-auto bg-primary/30 rounded"></div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <LeaderAuth />
            </div>
          </div>

          {/* Info Section */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <div className="f1-card p-4 sm:p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                LEADER PRIVILEGES
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manage race events and sessions</li>
                <li>• Add and edit race results</li>
                <li>• Manage driver registrations</li>
                <li>• Control championship settings</li>
              </ul>
            </div>

            <div className="f1-card p-4 sm:p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                RACE DIRECTOR
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  First registered leader becomes the Race Director with full
                  administrative access.
                </p>
                <p className="text-xs opacity-75">
                  Additional leaders can be granted management permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
