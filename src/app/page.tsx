"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipStandings } from "@/components/championship-standings";
import { RaceManagement } from "@/components/race-management";
import { Championship, Event } from "@/lib/types";
import { calculateChampionshipStandings } from "@/lib/championship";
import { createSampleData } from "@/lib/sample-data";
import { Button } from "@/components/ui/button";
import { Trophy, Flag, Car, Database } from "lucide-react";

export default function Home() {
  const [championship, setChampionship] = useState<Championship>({
    id: "championship-2024",
    name: "Campionato Kart 2024",
    season: "2024",
    drivers: [],
    events: [],
  });

  const [standings, setStandings] = useState(
    calculateChampionshipStandings(championship)
  );

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedChampionship = localStorage.getItem("kart-championship");
    if (savedChampionship) {
      try {
        const parsedChampionship = JSON.parse(savedChampionship);
        setChampionship(parsedChampionship);
      } catch (error) {
        console.error("Error loading championship data:", error);
      }
    }
  }, []);

  // Save to localStorage and recalculate standings when championship changes
  useEffect(() => {
    localStorage.setItem("kart-championship", JSON.stringify(championship));
    setStandings(calculateChampionshipStandings(championship));
  }, [championship]);

  const handleAddEvent = (event: Event) => {
    setChampionship((prev) => ({
      ...prev,
      events: [...prev.events, event],
    }));
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setChampionship((prev) => ({
      ...prev,
      events: prev.events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      ),
    }));
  };

  const loadSampleData = () => {
    const sampleChampionship = createSampleData();
    setChampionship(sampleChampionship);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Campionato Kart 2024
            </h1>
            <Car className="h-8 w-8 text-primary scale-x-[-1]" />
          </div>
          <p className="text-center text-muted-foreground">
            Sistema di punteggio con regola scarto automatica
          </p>
          {championship.events.length === 0 && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={loadSampleData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Carica Dati di Esempio
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="standings" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Classifica
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
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
              events={championship.events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
          <p>
            Campionato Kart 2024 - Sistema di gestione classifica automatico
          </p>
        </div>
      </footer>
    </div>
  );
}
