"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipStandings } from "@/components/championship-standings";
import { RaceManagement } from "@/components/race-management";
import { LeaderAuth } from "@/components/leader-auth";
import { useLeaderAuth } from "@/hooks/use-leader-auth";
import { useChampionship } from "@/hooks/use-championship";
import { Trophy, Flag, Car, Crown, LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import Image from "next/image";

export default function Home() {
  const { isAuthenticated, leader, logout } = useLeaderAuth();
  const {
    championship,
    standings,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    deleteRace,
    deleteDriverFromRace,
    deleteDriverFromChampionship,
    toggleWorstResultForDriver,
  } = useChampionship({
    leaderToken: isAuthenticated ? leader?.token : null,
  });
  const [currentTab, setCurrentTab] = useState("standings");

  const handleManageRaces = () => {
    setCurrentTab("management");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
          <div className="lap-counter text-2xl mb-2">LOADING...</div>
          <div className="speed-lines w-32 h-1 mx-auto bg-primary/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md f1-card p-8 rounded-lg">
          <Car className="h-12 w-12 text-destructive mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            SYSTEM ERROR
          </h2>
          <p className="text-muted-foreground mb-4 telemetry-data p-2 rounded text-sm">
            {error}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="racing-button"
          >
            <Zap className="h-4 w-4 mr-2" />
            RESTART SYSTEM
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card f1-gradient racing-stripes">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                  🏁 Championship Points System with Drop Scores
                </p>
              </div>
            </div>

            {isAuthenticated && leader && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 text-sm f1-card px-3 py-2 rounded">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-medium text-white">{leader.name}</span>
                  {leader.isCreator && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded border border-primary/40">
                      RACE DIRECTOR
                    </span>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleManageRaces}
                    className="racing-button flex-1 sm:flex-none"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    RACE CONTROL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="border-primary/50 hover:bg-primary/10 flex-1 sm:flex-none"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    LOGOUT
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {!isAuthenticated ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center f1-card p-6 sm:p-8 rounded-lg">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 lap-counter">
                🏎️ WELCOME TO THE RACE
              </h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
                Access race control to manage events and results
              </p>
              <div className="w-48 sm:w-64 h-2 mx-auto bg-primary/30 rounded mb-6 sm:mb-8"></div>
            </div>

            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
              <div className="f1-card p-4 sm:p-6 rounded-lg">
                <LeaderAuth />
              </div>

              <div className="space-y-4 sm:space-y-6">
                <ChampionshipStandings standings={standings} />
              </div>
            </div>
          </div>
        ) : (
          <Tabs
            value={currentTab}
            onValueChange={setCurrentTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 sm:mb-8 f1-card">
              <TabsTrigger
                value="standings"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Trophy className="h-4 w-4" />
                CHAMPIONSHIP
              </TabsTrigger>
              <TabsTrigger
                value="management"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                <Flag className="h-4 w-4" />
                RACE CONTROL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standings" className="space-y-4 sm:space-y-6">
              <ChampionshipStandings
                standings={standings}
                isLeader={isAuthenticated && !!leader}
                onDeleteDriver={async (driverId) => {
                  const result = await deleteDriverFromChampionship(driverId);
                  if (!result.success) {
                    console.error("Failed to delete driver:", result.error);
                  }
                }}
                onToggleWorstResult={async (driverId, eventId, raceId) => {
                  const result = await toggleWorstResultForDriver(
                    driverId,
                    eventId,
                    raceId
                  );
                  if (!result.success) {
                    console.error(
                      "Failed to toggle worst result:",
                      result.error
                    );
                  }
                }}
              />

              {/* Rules Summary */}
              <div className="mt-6 sm:mt-8 f1-card p-4 sm:p-6 rounded-lg">
                <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  📋 RACE REGULATIONS
                </h3>
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 text-sm">
                  <div className="telemetry-data p-3 sm:p-4 rounded">
                    <h4 className="font-medium mb-3 text-primary text-sm sm:text-base">
                      📊 POSITION POINTS:
                    </h4>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex justify-between">
                        <span className="race-position p1">1</span>
                        <span>20 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="race-position p2">2</span>
                        <span>17 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="race-position p3">3</span>
                        <span>15 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="race-position points">4-5</span>
                        <span>13, 11 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="race-position points">6-10</span>
                        <span>9, 7, 5, 3, 1 points</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="race-position no-points">11-15</span>
                        <span>0 points</span>
                      </div>
                    </div>
                  </div>
                  <div className="telemetry-data p-3 sm:p-4 rounded">
                    <h4 className="font-medium mb-3 text-primary text-sm sm:text-base">
                      🏆 BONUS POINTS:
                    </h4>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>🏁 Participation</span>
                        <span>+5 (not for Max)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🥇 Pole Position</span>
                        <span>+2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⚡ Fastest Lap</span>
                        <span>+2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🎯 Most Consistent</span>
                        <span>+2</span>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary/30">
                      <h4 className="font-medium mb-2 text-primary text-sm sm:text-base">
                        ⚙️ DROP RULE:
                      </h4>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        Worst result per event is automatically discarded
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-4 sm:space-y-6">
              <RaceManagement
                events={championship?.events || []}
                onAddEvent={addEvent}
                onUpdateEvent={updateEvent}
                onDeleteEvent={async (eventId) => {
                  const result = await deleteEvent(eventId);
                  if (!result.success) {
                    console.error("Failed to delete event:", result.error);
                  }
                  return result;
                }}
                onDeleteRace={async (eventId, raceId) => {
                  const result = await deleteRace(eventId, raceId);
                  if (!result.success) {
                    console.error("Failed to delete race:", result.error);
                  }
                  return result;
                }}
                onDeleteDriver={async (eventId, raceId, driverId) => {
                  const result = await deleteDriverFromRace(
                    eventId,
                    raceId,
                    driverId
                  );
                  if (!result.success) {
                    console.error(
                      "Failed to delete driver from race:",
                      result.error
                    );
                  }
                  return result;
                }}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <Footer />
    </div>
  );
}
