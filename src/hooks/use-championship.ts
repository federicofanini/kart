"use client";

import { useState, useEffect } from "react";
import { Championship, Event } from "@/lib/types";
import {
  calculateChampionshipStandings,
  toggleWorstResult,
} from "@/lib/championship";

interface UseChampionshipProps {
  leaderToken?: string | null;
}

export function useChampionship({ leaderToken }: UseChampionshipProps = {}) {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const standings = championship
    ? calculateChampionshipStandings(championship)
    : [];

  const fetchChampionship = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/championship");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch championship");
      }

      setChampionship(data);
    } catch (err) {
      console.error("Error fetching championship:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const updateChampionship = async (updatedChampionship: Championship) => {
    try {
      setError(null);

      const response = await fetch("/api/championship", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          championship: updatedChampionship,
          leaderToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update championship");
      }

      setChampionship(data);
      return { success: true };
    } catch (err) {
      console.error("Error updating championship:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const addEvent = async (event: Event) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    const updatedChampionship = {
      ...championship,
      events: [...championship.events, event],
    };

    return updateChampionship(updatedChampionship);
  };

  const updateEvent = async (updatedEvent: Event) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    const updatedChampionship = {
      ...championship,
      events: championship.events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      ),
    };

    return updateChampionship(updatedChampionship);
  };

  const deleteEvent = async (eventId: string) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    const updatedChampionship = {
      ...championship,
      events: championship.events.filter((event) => event.id !== eventId),
    };

    return updateChampionship(updatedChampionship);
  };

  const deleteRace = async (eventId: string, raceId: string) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    const event = championship.events.find((e) => e.id === eventId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    let updatedEvent;
    if (raceId === "race1" || raceId === "race2") {
      // Backward compatibility
      updatedEvent = {
        ...event,
        [raceId === "race1" ? "race1Results" : "race2Results"]: undefined,
      };
    } else {
      // New format
      const newRaces = { ...event.races };
      delete newRaces[raceId];
      updatedEvent = {
        ...event,
        races: newRaces,
      };
    }

    return updateEvent(updatedEvent);
  };

  const deleteDriverFromRace = async (
    eventId: string,
    raceId: string,
    driverId: string
  ) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    const event = championship.events.find((e) => e.id === eventId);
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    let updatedEvent;
    if (raceId === "race1" || raceId === "race2") {
      // Backward compatibility
      const raceResults =
        event[raceId === "race1" ? "race1Results" : "race2Results"];
      if (raceResults) {
        const newResults = { ...raceResults };
        delete newResults[driverId];
        updatedEvent = {
          ...event,
          [raceId === "race1" ? "race1Results" : "race2Results"]: newResults,
        };
      } else {
        return { success: false, error: "Race not found" };
      }
    } else {
      // New format
      if (event.races && event.races[raceId]) {
        const newRaceData = { ...event.races[raceId] };
        delete newRaceData[driverId];
        updatedEvent = {
          ...event,
          races: {
            ...event.races,
            [raceId]: newRaceData,
          },
        };
      } else {
        return { success: false, error: "Race not found" };
      }
    }

    return updateEvent(updatedEvent);
  };

  const deleteDriverFromChampionship = async (driverId: string) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    // Remove driver from all events
    const updatedEvents = championship.events.map((event) => {
      const updatedEvent = { ...event };

      // Remove from new format races
      if (event.races) {
        const newRaces: typeof event.races = {};
        Object.entries(event.races).forEach(([raceId, raceData]) => {
          const newRaceData = { ...raceData };
          delete newRaceData[driverId];
          newRaces[raceId] = newRaceData;
        });
        updatedEvent.races = newRaces;
      }

      // Remove from backward compatibility format
      if (event.race1Results) {
        const newRace1Results = { ...event.race1Results };
        delete newRace1Results[driverId];
        updatedEvent.race1Results = newRace1Results;
      }

      if (event.race2Results) {
        const newRace2Results = { ...event.race2Results };
        delete newRace2Results[driverId];
        updatedEvent.race2Results = newRace2Results;
      }

      return updatedEvent;
    });

    const updatedChampionship = {
      ...championship,
      events: updatedEvents,
    };

    return updateChampionship(updatedChampionship);
  };

  const toggleWorstResultForDriver = async (
    driverId: string,
    eventId: string,
    raceId: string
  ) => {
    if (!championship)
      return { success: false, error: "No championship loaded" };

    const updatedChampionship = toggleWorstResult(
      championship,
      driverId,
      eventId,
      raceId
    );
    return updateChampionship(updatedChampionship);
  };

  useEffect(() => {
    fetchChampionship();
  }, []);

  return {
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
    refetch: fetchChampionship,
  };
}
