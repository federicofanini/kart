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
import { Plus, Flag, Clock, Calendar, Settings, Trash2 } from "lucide-react";

interface RaceManagementProps {
  events: Event[];
  onAddEvent: (event: Event) => Promise<{ success: boolean; error?: string }>;
  onUpdateEvent: (
    event: Event
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteEvent?: (
    eventId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteRace?: (
    eventId: string,
    raceId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteDriver?: (
    eventId: string,
    raceId: string,
    driverId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function RaceManagement({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onDeleteRace,
  onDeleteDriver,
}: RaceManagementProps) {
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [isAddRaceOpen, setIsAddRaceOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newRaceName, setNewRaceName] = useState("");

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
      races: {},
      // Maintain backward compatibility
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
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const addNewRaceToEvent = async () => {
    if (!selectedEventId || !newRaceName) return;

    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return;

    const raceId = `race-${Date.now()}`;
    const updatedEvent = {
      ...event,
      races: {
        ...event.races,
        [raceId]: {},
      },
    };

    try {
      const result = await onUpdateEvent(updatedEvent);
      if (result.success) {
        setNewRaceName("");
        setSelectedEventId("");
        setIsAddRaceOpen(false);
      }
    } catch (error) {
      console.error("Error adding race:", error);
    }
  };

  const addRaceResult = async (eventId: string, raceId: string) => {
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

    // Handle new format and backward compatibility
    let updatedEvent;
    if (raceId === "race1" || raceId === "race2") {
      // Backward compatibility
      updatedEvent = {
        ...event,
        [raceId === "race1" ? "race1Results" : "race2Results"]: {
          ...event[raceId === "race1" ? "race1Results" : "race2Results"],
          [raceResult.id]: raceResult,
        },
      };
    } else {
      // New format
      updatedEvent = {
        ...event,
        races: {
          ...event.races,
          [raceId]: {
            ...event.races?.[raceId],
            [raceResult.id]: raceResult,
          },
        },
      };
    }

    try {
      const result = await onUpdateEvent(updatedEvent);
      if (result.success) {
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
      }
    } catch (error) {
      console.error("Error updating event:", error);
    }
  };

  const getRacesForEvent = (event: Event): { [raceId: string]: Race[] } => {
    const races: { [raceId: string]: Race[] } = {};

    // Handle new format
    if (event.races) {
      Object.entries(event.races).forEach(([raceId, raceData]) => {
        races[raceId] = Object.values(raceData);
      });
    }

    // Handle backward compatibility
    if (event.race1Results) {
      races["race1"] = Object.values(event.race1Results);
    }
    if (event.race2Results) {
      races["race2"] = Object.values(event.race2Results);
    }

    return races;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!onDeleteEvent) return;
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    )
      return;

    try {
      await onDeleteEvent(eventId);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDeleteRace = async (eventId: string, raceId: string) => {
    if (!onDeleteRace) return;
    if (
      !confirm(
        "Are you sure you want to delete this race? This action cannot be undone."
      )
    )
      return;

    try {
      await onDeleteRace(eventId, raceId);
    } catch (error) {
      console.error("Error deleting race:", error);
    }
  };

  const handleDeleteDriver = async (
    eventId: string,
    raceId: string,
    driverId: string
  ) => {
    if (!onDeleteDriver) return;
    if (!confirm("Are you sure you want to delete this driver result?")) return;

    try {
      await onDeleteDriver(eventId, raceId, driverId);
    } catch (error) {
      console.error("Error deleting driver:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Actions */}
      <div className="f1-card p-4 sm:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 lap-counter">
              <Flag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              RACE CONTROL CENTER
            </h2>
            <p className="text-muted-foreground telemetry-data px-2 py-1 rounded inline-block mt-2 text-sm sm:text-base">
              🏁 Manage events and race results
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
            <DialogTrigger asChild>
              <Button className="racing-button w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                NEW EVENT
              </Button>
            </DialogTrigger>
            <DialogContent className="f1-card mx-4 max-w-sm sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="lap-counter">
                  CREATE NEW EVENT
                </DialogTitle>
                <DialogDescription>
                  Add a new race weekend to the championship
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Event Name</label>
                  <Input
                    placeholder="e.g. Monaco Grand Prix"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={createNewEvent}
                  className="w-full racing-button"
                  disabled={!newEventName || !newEventDate}
                >
                  CREATE EVENT
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddRaceOpen} onOpenChange={setIsAddRaceOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-primary/50 hover:bg-primary/10 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                ADD RACE
              </Button>
            </DialogTrigger>
            <DialogContent className="f1-card mx-4 max-w-sm sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="lap-counter">
                  ADD RACE TO EVENT
                </DialogTitle>
                <DialogDescription>
                  Add additional races to an existing event
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Event</label>
                  <Select
                    value={selectedEventId}
                    onValueChange={setSelectedEventId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name} - {formatDate(event.date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Race Name</label>
                  <Input
                    placeholder="e.g. Qualifying, Sprint, Feature Race"
                    value={newRaceName}
                    onChange={(e) => setNewRaceName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={addNewRaceToEvent}
                  className="w-full racing-button"
                  disabled={!selectedEventId || !newRaceName}
                >
                  ADD RACE
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Events List */}
      <div className="grid gap-4 sm:gap-6">
        {events.map((event) => {
          const races = getRacesForEvent(event);

          return (
            <Card key={event.id} className="f1-card border-primary/30">
              <CardHeader className="racing-stripes">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl lap-counter">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      {event.name}
                    </CardTitle>
                    <CardDescription className="text-base sm:text-lg mt-1">
                      📅 {formatDate(event.date)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="telemetry-data p-2 sm:p-3 rounded text-sm">
                      {Object.keys(races).length} race
                      {Object.keys(races).length !== 1 ? "s" : ""}
                    </div>
                    {onDeleteEvent && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs
                  defaultValue={Object.keys(races)[0] || "race1"}
                  className="w-full"
                >
                  <TabsList
                    className="grid w-full f1-card overflow-x-auto"
                    style={{
                      gridTemplateColumns: `repeat(${
                        Object.keys(races).length
                      }, minmax(120px, 1fr))`,
                    }}
                  >
                    {Object.keys(races).map((raceId) => (
                      <TabsTrigger
                        key={raceId}
                        value={raceId}
                        className="capitalize data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm min-w-0"
                      >
                        <span className="truncate">
                          {raceId
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {Object.entries(races).map(([raceId, results]) => (
                    <TabsContent
                      key={raceId}
                      value={raceId}
                      className="space-y-4 mt-4 sm:mt-6"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm sm:text-base">
                          {results.length} driver
                          {results.length !== 1 ? "s" : ""} registered
                        </h4>
                        {onDeleteRace && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRace(event.id, raceId)}
                            className="h-8 text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete Race
                          </Button>
                        )}
                      </div>
                      <RaceResultsForm
                        eventId={event.id}
                        raceId={raceId}
                        results={results}
                        raceForm={raceForm}
                        setRaceForm={setRaceForm}
                        onAddResult={addRaceResult}
                        onDeleteDriver={
                          onDeleteDriver ? handleDeleteDriver : undefined
                        }
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && (
        <Card className="f1-card border-primary/30">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <Flag className="h-12 w-12 sm:h-16 sm:w-16 text-primary mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-bold mb-3 lap-counter text-center">
              NO EVENTS SCHEDULED
            </h3>
            <p className="text-muted-foreground text-center mb-4 sm:mb-6 text-sm sm:text-lg">
              Start the championship by creating your first race event
            </p>
            <div className="w-24 sm:w-32 h-2 bg-primary/30 rounded mb-4 sm:mb-6"></div>
            <Button
              onClick={() => setIsNewEventOpen(true)}
              className="racing-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              CREATE FIRST EVENT
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
  raceId: string;
  results: Race[];
  raceForm: RaceForm;
  setRaceForm: (form: RaceForm) => void;
  onAddResult: (eventId: string, raceId: string) => Promise<void>;
  onDeleteDriver?: (
    eventId: string,
    raceId: string,
    driverId: string
  ) => Promise<void>;
}

function RaceResultsForm({
  eventId,
  raceId,
  results,
  raceForm,
  setRaceForm,
  onAddResult,
  onDeleteDriver,
}: RaceResultsFormProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Results */}
      {results.length > 0 && (
        <div className="f1-card p-3 sm:p-4 rounded-lg">
          <h4 className="font-medium mb-3 sm:mb-4 lap-counter text-sm sm:text-lg">
            🏁 CURRENT RESULTS
          </h4>
          <div className="grid gap-2 sm:gap-3">
            {results
              .sort((a, b) => a.position - b.position)
              .map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-background/50 rounded border border-primary/20"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span
                      className={`race-position ${
                        result.position === 1
                          ? "p1"
                          : result.position === 2
                          ? "p2"
                          : result.position === 3
                          ? "p3"
                          : result.position <= 10
                          ? "points"
                          : "no-points"
                      }`}
                    >
                      {result.position}
                    </span>
                    <span className="font-semibold text-sm sm:text-lg truncate">
                      {result.name}
                    </span>
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      {result.polePosition && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-1 sm:px-2 py-1 rounded border border-blue-500/30">
                          🥇 POLE
                        </span>
                      )}
                      {result.fastestLap && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-1 sm:px-2 py-1 rounded border border-purple-500/30">
                          ⚡ FL
                        </span>
                      )}
                      {result.mostConsistent && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-1 sm:px-2 py-1 rounded border border-green-500/30">
                          🎯 MC
                        </span>
                      )}
                    </div>
                  </div>
                  {onDeleteDriver && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteDriver(eventId, raceId, result.id)}
                      className="h-7 w-7 p-0 ml-2 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add New Result Form */}
      <div className="f1-card border-primary/30 p-4 sm:p-6 rounded-lg">
        <h4 className="font-medium mb-4 lap-counter text-sm sm:text-lg">
          ➕ ADD DRIVER RESULT
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Driver Name
            </label>
            <Input
              placeholder="Enter driver name"
              value={raceForm.driverName}
              onChange={(e) =>
                setRaceForm({ ...raceForm, driverName: e.target.value })
              }
              className="bg-background/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Position</label>
            <Select
              value={raceForm.position.toString()}
              onValueChange={(value) =>
                setRaceForm({ ...raceForm, position: parseInt(value) })
              }
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    P{i + 1} -{" "}
                    {i + 1 <= 10
                      ? `${[20, 17, 15, 13, 11, 9, 7, 5, 3, 1][i] || 0} pts`
                      : "No points"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-primary/20 rounded">
            <input
              type="checkbox"
              id={`pole-${raceId}`}
              checked={raceForm.polePosition}
              onChange={(e) =>
                setRaceForm({ ...raceForm, polePosition: e.target.checked })
              }
              className="w-4 h-4 text-primary bg-transparent border-primary/50 rounded focus:ring-primary"
            />
            <label
              htmlFor={`pole-${raceId}`}
              className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2 font-medium"
            >
              <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
              Pole Position
            </label>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-primary/20 rounded">
            <input
              type="checkbox"
              id={`fastest-${raceId}`}
              checked={raceForm.fastestLap}
              onChange={(e) =>
                setRaceForm({ ...raceForm, fastestLap: e.target.checked })
              }
              className="w-4 h-4 text-primary bg-transparent border-primary/50 rounded focus:ring-primary"
            />
            <label
              htmlFor={`fastest-${raceId}`}
              className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2 font-medium"
            >
              ⚡ Fastest Lap
            </label>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-primary/20 rounded">
            <input
              type="checkbox"
              id={`consistent-${raceId}`}
              checked={raceForm.mostConsistent}
              onChange={(e) =>
                setRaceForm({ ...raceForm, mostConsistent: e.target.checked })
              }
              className="w-4 h-4 text-primary bg-transparent border-primary/50 rounded focus:ring-primary"
            />
            <label
              htmlFor={`consistent-${raceId}`}
              className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2 font-medium"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              Most Consistent
            </label>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border border-primary/20 rounded">
            <input
              type="checkbox"
              id={`participated-${raceId}`}
              checked={raceForm.participated}
              onChange={(e) =>
                setRaceForm({ ...raceForm, participated: e.target.checked })
              }
              className="w-4 h-4 text-primary bg-transparent border-primary/50 rounded focus:ring-primary"
            />
            <label
              htmlFor={`participated-${raceId}`}
              className="text-xs sm:text-sm font-medium"
            >
              Participated
            </label>
          </div>
        </div>

        <Button
          onClick={() => onAddResult(eventId, raceId)}
          disabled={!raceForm.driverName}
          className="w-full racing-button text-sm sm:text-lg py-2 sm:py-3"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          ADD DRIVER RESULT
        </Button>
      </div>
    </div>
  );
}
