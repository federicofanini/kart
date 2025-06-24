"use client";

import { DriverStandings } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Award, Crown, Target } from "lucide-react";

interface ChampionshipStandingsProps {
  standings: DriverStandings[];
}

export function ChampionshipStandings({
  standings,
}: ChampionshipStandingsProps) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Target className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "position-1 font-bold";
      case 2:
        return "position-2 font-semibold";
      case 3:
        return "position-3 font-semibold";
      default:
        return "bg-muted/50";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center kart-gradient racing-stripes">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="h-8 w-8 text-white" />
          <CardTitle className="text-2xl font-bold text-white">
            Classifica Campionato Kart
          </CardTitle>
        </div>
        <CardDescription className="text-white/90">
          Aggiornata automaticamente con regola scarto
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Pos</TableHead>
                <TableHead>Pilota</TableHead>
                <TableHead className="text-center">Punti Totali</TableHead>
                <TableHead className="text-center">Eventi</TableHead>
                <TableHead className="text-center">Punti Scartati</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing, index) => (
                <TableRow
                  key={standing.driver.id}
                  className={`${getPositionStyle(
                    index + 1
                  )} transition-colors hover:bg-muted/80`}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getPositionIcon(index + 1)}
                      <span className="font-bold">{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {standing.driver.name}
                      {standing.driver.isMaxVerstappen && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          No bonus partecipazione
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-lg">
                    {standing.totalPoints}
                  </TableCell>
                  <TableCell className="text-center">
                    {standing.raceResults.length}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {standing.raceResults.reduce(
                      (sum, result) => sum + result.discardedPoints,
                      0
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-4">
          {standings.map((standing, index) => (
            <Card
              key={standing.driver.id}
              className={`${getPositionStyle(
                index + 1
              )} border-l-4 border-l-primary`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getPositionIcon(index + 1)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{index + 1}</span>
                        <span className="font-semibold">
                          {standing.driver.name}
                        </span>
                      </div>
                      {standing.driver.isMaxVerstappen && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-1 inline-block">
                          No bonus partecipazione
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-2xl text-primary">
                      {standing.totalPoints}
                    </div>
                    <div className="text-xs text-muted-foreground">punti</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">
                      Eventi partecipati
                    </div>
                    <div className="font-medium">
                      {standing.raceResults.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Punti scartati</div>
                    <div className="font-medium">
                      {standing.raceResults.reduce(
                        (sum, result) => sum + result.discardedPoints,
                        0
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
