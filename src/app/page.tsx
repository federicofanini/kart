"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipStandings } from "@/components/championship-standings";
import { RaceManagement } from "@/components/race-management";
import { LeaderAuth } from "@/components/leader-auth";
import { useLeaderAuth } from "@/hooks/use-leader-auth";
import { useChampionship } from "@/hooks/use-championship";
import { Trophy, Flag, Car, Crown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import Image from "next/image";

export default function Home() {
  const { isAuthenticated, leader, logout } = useLeaderAuth();
  const { championship, standings, loading, error, addEvent, updateEvent } =
    useChampionship({
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
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg">Caricamento campionato...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Car className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Errore di caricamento</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Ricarica pagina
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8 text-primary"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-700 bg-clip-text text-transparent tracking-tight">
                  VIBRATA GRAND PRIX
                </h1>
                <p className="text-muted-foreground font-medium tracking-wide uppercase text-sm">
                  Championship Points System with Drop Scores
                </p>
              </div>
            </div>

            {isAuthenticated && leader && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-medium">{leader.name}</span>
                  {leader.isCreator && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Creatore
                    </span>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleManageRaces}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Gestisci Gare
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Esci
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isAuthenticated ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                Benvenuto al Campionato Kart 2024
              </h2>
              <p className="text-muted-foreground mb-8">
                Per gestire eventi e risultati, devi autenticarti come leader
                del campionato
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <LeaderAuth />
              </div>

              <div className="space-y-6">
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
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger
                value="standings"
                className="flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                Classifica
              </TabsTrigger>
              <TabsTrigger
                value="management"
                className="flex items-center gap-2"
              >
                <Flag className="h-4 w-4" />
                Gestione Gare
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standings" className="space-y-6">
              <ChampionshipStandings standings={standings} />

              {/* Rules Summary */}
              <div className="mt-8 p-6 bg-card border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📋 Regolamento
                </h3>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Punteggio Posizioni:</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <div>1° posto: 20 punti</div>
                      <div>2° posto: 17 punti</div>
                      <div>3° posto: 15 punti</div>
                      <div>4° posto: 13 punti</div>
                      <div>5° posto: 11 punti</div>
                      <div>6°-10°: 9, 7, 5, 3, 1 punti</div>
                      <div>11°-15°: 0 punti</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Bonus Punti:</h4>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Partecipazione: +5 (no Max Verstappen)</div>
                      <div>Pole Position: +2</div>
                      <div>Giro più veloce: +2</div>
                      <div>Pilota più costante: +2</div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Regola Scarto:</h4>
                      <p className="text-muted-foreground">
                        Per ogni appuntamento, viene scartato automaticamente il
                        peggior risultato tra Gara 1 e Gara 2.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <RaceManagement
                events={championship?.events || []}
                onAddEvent={addEvent}
                onUpdateEvent={updateEvent}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
