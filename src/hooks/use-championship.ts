"use client";

import { useState, useEffect } from "react";
import { Championship, Event } from "@/lib/types";
import { calculateChampionshipStandings } from "@/lib/championship";

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
    refetch: fetchChampionship,
  };
}
