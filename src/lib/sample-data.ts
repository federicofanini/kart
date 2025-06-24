import { Championship, Event, Race } from "./types";

export function createSampleData(): Championship {
  const createRaceResult = (
    name: string,
    position: number,
    bonuses: Partial<{
      polePosition: boolean;
      fastestLap: boolean;
      mostConsistent: boolean;
    }> = {}
  ): Race => ({
    id: `driver-${name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${Date.now()}-${Math.random()}`,
    name,
    position,
    polePosition: bonuses.polePosition || false,
    fastestLap: bonuses.fastestLap || false,
    mostConsistent: bonuses.mostConsistent || false,
    participated: true,
  });

  const event1: Event = {
    id: "gp-monza-2024",
    name: "GP Monza",
    date: "2024-01-15",
    race1Results: {
      "marco-rossi": createRaceResult("Marco Rossi", 1, { polePosition: true }),
      "luca-ferrari": createRaceResult("Luca Ferrari", 2, { fastestLap: true }),
      "alessandro-bianchi": createRaceResult("Alessandro Bianchi", 3),
      "max-verstappen": createRaceResult("Max Verstappen", 4, {
        mostConsistent: true,
      }),
      "giulia-conti": createRaceResult("Giulia Conti", 5),
      "matteo-romano": createRaceResult("Matteo Romano", 6),
      "andrea-lombardi": createRaceResult("Andrea Lombardi", 7),
      "sara-moretti": createRaceResult("Sara Moretti", 8),
    },
    race2Results: {
      "luca-ferrari": createRaceResult("Luca Ferrari", 1, {
        polePosition: true,
        fastestLap: true,
      }),
      "alessandro-bianchi": createRaceResult("Alessandro Bianchi", 2),
      "marco-rossi": createRaceResult("Marco Rossi", 3, {
        mostConsistent: true,
      }),
      "giulia-conti": createRaceResult("Giulia Conti", 4),
      "max-verstappen": createRaceResult("Max Verstappen", 5),
      "sara-moretti": createRaceResult("Sara Moretti", 6),
      "matteo-romano": createRaceResult("Matteo Romano", 7),
      "andrea-lombardi": createRaceResult("Andrea Lombardi", 8),
    },
  };

  const event2: Event = {
    id: "gp-imola-2024",
    name: "GP Imola",
    date: "2024-02-20",
    race1Results: {
      "alessandro-bianchi": createRaceResult("Alessandro Bianchi", 1, {
        polePosition: true,
        mostConsistent: true,
      }),
      "marco-rossi": createRaceResult("Marco Rossi", 2),
      "max-verstappen": createRaceResult("Max Verstappen", 3, {
        fastestLap: true,
      }),
      "luca-ferrari": createRaceResult("Luca Ferrari", 4),
      "sara-moretti": createRaceResult("Sara Moretti", 5),
      "giulia-conti": createRaceResult("Giulia Conti", 6),
      "matteo-romano": createRaceResult("Matteo Romano", 7),
      "andrea-lombardi": createRaceResult("Andrea Lombardi", 8),
    },
    race2Results: {
      "marco-rossi": createRaceResult("Marco Rossi", 1, { fastestLap: true }),
      "luca-ferrari": createRaceResult("Luca Ferrari", 2, {
        polePosition: true,
      }),
      "max-verstappen": createRaceResult("Max Verstappen", 3, {
        mostConsistent: true,
      }),
      "alessandro-bianchi": createRaceResult("Alessandro Bianchi", 4),
      "giulia-conti": createRaceResult("Giulia Conti", 5),
      "matteo-romano": createRaceResult("Matteo Romano", 6),
      "sara-moretti": createRaceResult("Sara Moretti", 7),
      "andrea-lombardi": createRaceResult("Andrea Lombardi", 8),
    },
  };

  return {
    id: "championship-2024",
    name: "Campionato Kart 2024",
    season: "2024",
    drivers: [],
    events: [event1, event2],
  };
}
