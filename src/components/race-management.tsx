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
import {
  Event,
  Race,
  Driver,
  POSITION_POINTS,
  BONUS_POINTS,
} from "@/lib/types";
import { calculateRacePoints } from "@/lib/championship";
import { Plus, Flag, Clock, Calendar, Trash2, Info } from "lucide-react";

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

  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  // Enhanced race form with validation
  const [raceForm, setRaceForm] = useState({
    driverName: "",
    position: 1,
    polePosition: false,
    fastestLap: false,
    mostConsistent: false,
    participated: true,
  });

  // Validate race form
  const validateRaceForm = (): boolean => {
    let isValid = true;

    if (!raceForm.driverName.trim()) {
      isValid = false;
    }

    if (raceForm.position < 1 || raceForm.position > 15) {
      isValid = false;
    }

    return isValid;
  };

  // Calculate points preview for current form
  const calculatePointsPreview = (): number => {
    if (!raceForm.driverName.trim()) return 0;

    const mockDriver: Driver = {
      id: "preview",
      name: raceForm.driverName,
      isMaxVerstappen: raceForm.driverName
        .toLowerCase()
        .includes("max verstappen"),
    };

    const mockRace: Race = {
      id: "preview",
      name: raceForm.driverName,
      position: raceForm.position,
      polePosition: raceForm.polePosition,
      fastestLap: raceForm.fastestLap,
      mostConsistent: raceForm.mostConsistent,
      participated: raceForm.participated,
    };

    return calculateRacePoints(mockRace, mockDriver);
  };

  const createNewEvent = async () => {
    if (!newEventName.trim() || !newEventDate) {
      console.error("Event name and date are required");
      return;
    }

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: newEventName.trim(),
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
        console.log("Event created successfully:", newEvent.name);
      } else {
        console.error("Failed to create event:", result.error);
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const addRaceResult = async (eventId: string, raceId: string) => {
    if (!validateRaceForm()) {
      console.error("Form validation failed");
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) {
      console.error("Event not found");
      return;
    }

    const raceResult: Race = {
      id: `driver-${Date.now()}`,
      name: raceForm.driverName.trim(),
      position: raceForm.position,
      polePosition: raceForm.polePosition,
      fastestLap: raceForm.fastestLap,
      mostConsistent: raceForm.mostConsistent,
      participated: raceForm.participated,
    };

    // Check for duplicate driver in the same race
    let existingDrivers: Race[] = [];
    if (raceId === "race1" || raceId === "race2") {
      // Backward compatibility
      const raceResults =
        event[raceId === "race1" ? "race1Results" : "race2Results"];
      if (raceResults) {
        existingDrivers = Object.values(raceResults);
      }
    } else {
      // New format
      if (event.races && event.races[raceId]) {
        existingDrivers = Object.values(event.races[raceId]);
      }
    }

    // Check for duplicate driver name
    const duplicateDriver = existingDrivers.find(
      (driver) => driver.name.toLowerCase() === raceResult.name.toLowerCase()
    );
    if (duplicateDriver) {
      console.error("Driver already exists in this race");
      return;
    }

    // Check for duplicate position (only if driver participated)
    if (
      raceResult.participated &&
      raceResult.position >= 1 &&
      raceResult.position <= 15
    ) {
      const duplicatePosition = existingDrivers.find(
        (driver) =>
          driver.participated && driver.position === raceResult.position
      );
      if (duplicatePosition) {
        console.error(
          `Position ${raceResult.position} is already taken by ${duplicatePosition.name}`
        );
        return;
      }
    }

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

        // Calculate and log points for feedback
        const points = calculatePointsPreview();
        console.log(`Driver ${raceResult.name} added with ${points} points`);
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
    try {
      return new Date(dateString).toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!onDeleteEvent) return;

    try {
      const result = await onDeleteEvent(eventId);
      if (result.success) {
        console.log("Event deleted successfully");
      } else {
        console.error("Failed to delete event:", result.error);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleDeleteRace = async (eventId: string, raceId: string) => {
    if (!onDeleteRace) return;

    try {
      const result = await onDeleteRace(eventId, raceId);
      if (result.success) {
        console.log("Race deleted successfully");
      } else {
        console.error("Failed to delete race:", result.error);
      }
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

    try {
      const result = await onDeleteDriver(eventId, raceId, driverId);
      if (result.success) {
        console.log("Driver deleted successfully");
      } else {
        console.error("Failed to delete driver:", result.error);
      }
    } catch (error) {
      console.error("Error deleting driver:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Championship Points System Card - F1 Style */}
      <Card className="f1-card border-primary/30">
        <CardHeader className="racing-stripes">
          <div className="flex items-center gap-3">
            <Info className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="lap-counter text-xl">
                🏁 CHAMPIONSHIP POINTS SYSTEM
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Official Kart Racing Points Structure
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="telemetry-data p-4 rounded">
              <h4 className="font-bold mb-4 lap-counter text-lg">
                🏆 POSITION POINTS
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(POSITION_POINTS)
                  .filter(([, points]) => points > 0)
                  .map(([position, points]) => (
                    <div
                      key={position}
                      className={`flex justify-between p-2 rounded border ${
                        position === "1"
                          ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                          : position === "2"
                          ? "bg-gray-400/20 border-gray-400/50 text-gray-300"
                          : position === "3"
                          ? "bg-orange-600/20 border-orange-600/50 text-orange-300"
                          : parseInt(position) <= 10
                          ? "bg-primary/20 border-primary/50"
                          : "bg-muted/50 border-muted"
                      }`}
                    >
                      <span className="font-semibold">P{position}</span>
                      <span className="font-mono font-bold">{points} PTS</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="telemetry-data p-4 rounded">
              <h4 className="font-bold mb-4 lap-counter text-lg">
                ⚡ BONUS POINTS
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-500/20 border border-green-500/50 rounded">
                  <span className="flex items-center gap-2">
                    <span>🎯</span>
                    <span className="font-semibold">PARTICIPATION</span>
                  </span>
                  <span className="font-mono font-bold text-green-300">
                    +{BONUS_POINTS.PARTICIPATION} PTS
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-500/20 border border-blue-500/50 rounded">
                  <span className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    <span className="font-semibold">POLE POSITION</span>
                  </span>
                  <span className="font-mono font-bold text-blue-300">
                    +{BONUS_POINTS.POLE_POSITION} PTS
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/20 border border-purple-500/50 rounded">
                  <span className="flex items-center gap-2">
                    <span>⚡</span>
                    <span className="font-semibold">FASTEST LAP</span>
                  </span>
                  <span className="font-mono font-bold text-purple-300">
                    +{BONUS_POINTS.FASTEST_LAP} PTS
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-500/20 border border-orange-500/50 rounded">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-semibold">MOST CONSISTENT</span>
                  </span>
                  <span className="font-mono font-bold text-orange-300">
                    +{BONUS_POINTS.MOST_CONSISTENT} PTS
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="racing-stripes p-4 rounded border border-primary/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-primary">
                  🏎️ CHAMPIONSHIP REGULATIONS
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • <strong>Max Verstappen</strong> does not receive
                    participation bonus points
                  </li>
                  <li>
                    • <strong>Drop Rule:</strong> Worst result from each event
                    is automatically discarded
                  </li>
                  <li>
                    • <strong>Points Limit:</strong> Only positions 1-10 earn
                    championship points
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold lap-counter">
            Race Control Center
          </h2>
          <p className="text-muted-foreground">
            Manage events, races, and driver results
          </p>
        </div>
        <Dialog open={isNewEventOpen} onOpenChange={setIsNewEventOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new racing event to the championship
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Event Name</label>
                <Input
                  placeholder="e.g., Gara di Monza"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              <Button onClick={createNewEvent} className="w-full">
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
