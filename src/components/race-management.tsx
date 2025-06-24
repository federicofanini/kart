"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Event, Race } from "@/lib/types";
import { Plus, Flag, Clock, Zap, Calendar } from "lucide-react";

interface RaceManagementProps {
  events: Event[];
  onAddEvent: (event: Event) => Promise<{ success: boolean; error?: string }>;
  onUpdateEvent: (
    event: Event
  ) => Promise<{ success: boolean; error?: string }>;
}

export function RaceManagement({
  events,
  onAddEvent,
  onUpdateEvent,
}: RaceManagementProps) {
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  const [raceForm, setRaceForm] = useState({
    driverName: "",
    position: 1,
    polePosition: false,
    fastestLap: false,
    mostConsistent: false,
    participated: true,
  });

  const createNewEvent = async () => {
    if (!newEventName || !newEventDate) return;

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: newEventName,
      date: newEventDate,
      race1Results: {},
      race2Results: {},
    };

    try {
      const result = await onAddEvent(newEvent);
      if (result.success) {
        setNewEventName("");
        setNewEventDate("");
        setIsNewEventOpen(false);
      } else {
        console.error("Failed to create event:", result.error);
        // You could show an error toast here
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const addRaceResult = async (
    eventId: string,
    raceType: "race1" | "race2"
  ) => {
    const event = events.find((e) => e.id === eventId);
    if (!event || !raceForm.driverName) return;

    const raceResult: Race = {
      id: `driver-${Date.now()}`,
      name: raceForm.driverName,
      position: raceForm.position,
      polePosition: raceForm.polePosition,
      fastestLap: raceForm.fastestLap,
      mostConsistent: raceForm.mostConsistent,
      participated: raceForm.participated,
    };

    const updatedEvent = {
      ...event,
      [raceType === "race1" ? "race1Results" : "race2Results"]: {
        ...event[raceType === "race1" ? "race1Results" : "race2Results"],
        [raceResult.id]: raceResult,
      },
    };

    try {
      const result = await onUpdateEvent(updatedEvent);
      if (result.success) {
        // Reset form
        setRaceForm({
          driverName: "",
          position: 1,
          polePosition: false,
          fastestLap: false,
          mostConsistent: false,
          participated: true,
        });
      } else {
        console.error("Failed to update event:", result.error);
        // You could show an error toast here
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Event Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="h-6 w-6 text-primary" />
            Gestione Gare
          </h2>
          <p className="text-muted-foreground">
            Aggiungi eventi e inserisci risultati
          </p>
        </div>

        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuovo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Evento</DialogTitle>
              <DialogDescription>
                Aggiungi un nuovo appuntamento al campionato
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome Evento</label>
                <Input
                  placeholder="es. GP Monza"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              <Button onClick={createNewEvent} className="w-full">
                Crea Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      <div className="grid gap-6">
        {events.map((event) => (
          <Card key={event.id} className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {event.name}
                  </CardTitle>
                  <CardDescription>{formatDate(event.date)}</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>
                    Gara 1: {Object.keys(event.race1Results).length} piloti
                  </div>
                  <div>
                    Gara 2: {Object.keys(event.race2Results).length} piloti
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="race1" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="race1">Gara 1</TabsTrigger>
                  <TabsTrigger value="race2">Gara 2</TabsTrigger>
                </TabsList>

                <TabsContent value="race1" className="space-y-4">
                  <RaceResultsForm
                    eventId={event.id}
                    raceType="race1"
                    results={Object.values(event.race1Results)}
                    raceForm={raceForm}
                    setRaceForm={setRaceForm}
                    onAddResult={addRaceResult}
                  />
                </TabsContent>

                <TabsContent value="race2" className="space-y-4">
                  <RaceResultsForm
                    eventId={event.id}
                    raceType="race2"
                    results={Object.values(event.race2Results)}
                    raceForm={raceForm}
                    setRaceForm={setRaceForm}
                    onAddResult={addRaceResult}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun evento creato</h3>
            <p className="text-muted-foreground text-center mb-4">
              Inizia creando il primo evento del campionato
            </p>
            <Button onClick={() => setIsNewEventOpen(true)}>
              Crea il primo evento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface RaceForm {
  driverName: string;
  position: number;
  polePosition: boolean;
  fastestLap: boolean;
  mostConsistent: boolean;
  participated: boolean;
}

interface RaceResultsFormProps {
  eventId: string;
  raceType: "race1" | "race2";
  results: Race[];
  raceForm: RaceForm;
  setRaceForm: (form: RaceForm) => void;
  onAddResult: (eventId: string, raceType: "race1" | "race2") => Promise<void>;
}

function RaceResultsForm({
  eventId,
  raceType,
  results,
  raceForm,
  setRaceForm,
  onAddResult,
}: RaceResultsFormProps) {
  return (
    <div className="space-y-4">
      {/* Current Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Risultati attuali:</h4>
          <div className="grid gap-2">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{result.position}</span>
                  <span>{result.name}</span>
                  <div className="flex gap-1">
                    {result.polePosition && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                        Pole
                      </span>
                    )}
                    {result.fastestLap && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">
                        FL
                      </span>
                    )}
                    {result.mostConsistent && (
                      <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                        MC
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Result Form */}
      <div className="border rounded-lg p-4 space-y-4">
        <h4 className="font-medium">Aggiungi Risultato</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nome Pilota</label>
            <Input
              placeholder="Nome del pilota"
              value={raceForm.driverName}
              onChange={(e) =>
                setRaceForm({ ...raceForm, driverName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Posizione</label>
            <Select
              value={raceForm.position.toString()}
              onValueChange={(value) =>
                setRaceForm({ ...raceForm, position: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}° posto
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`pole-${raceType}`}
              checked={raceForm.polePosition}
              onChange={(e) =>
                setRaceForm({ ...raceForm, polePosition: e.target.checked })
              }
              className="rounded"
            />
            <label
              htmlFor={`pole-${raceType}`}
              className="text-sm flex items-center gap-1"
            >
              <Flag className="h-3 w-3" />
              Pole Position
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`fastest-${raceType}`}
              checked={raceForm.fastestLap}
              onChange={(e) =>
                setRaceForm({ ...raceForm, fastestLap: e.target.checked })
              }
              className="rounded"
            />
            <label
              htmlFor={`fastest-${raceType}`}
              className="text-sm flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Giro + veloce
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`consistent-${raceType}`}
              checked={raceForm.mostConsistent}
              onChange={(e) =>
                setRaceForm({ ...raceForm, mostConsistent: e.target.checked })
              }
              className="rounded"
            />
            <label
              htmlFor={`consistent-${raceType}`}
              className="text-sm flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />+ costante
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`participated-${raceType}`}
              checked={raceForm.participated}
              onChange={(e) =>
                setRaceForm({ ...raceForm, participated: e.target.checked })
              }
              className="rounded"
            />
            <label htmlFor={`participated-${raceType}`} className="text-sm">
              Ha partecipato
            </label>
          </div>
        </div>

        <Button
          onClick={() => onAddResult(eventId, raceType)}
          disabled={!raceForm.driverName}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Risultato
        </Button>
      </div>
    </div>
  );
}
