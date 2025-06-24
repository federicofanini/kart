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
import { Button } from "@/components/ui/button";
import { Medal, Award, Crown, Target, Trash2, RotateCcw } from "lucide-react";

interface ChampionshipStandingsProps {
  standings: DriverStandings[];
  isLeader?: boolean;
  onDeleteDriver?: (driverId: string) => Promise<void>;
  onToggleWorstResult?: (
    driverId: string,
    eventId: string,
    raceId: string
  ) => Promise<void>;
}

export function ChampionshipStandings({
  standings,
  isLeader = false,
  onDeleteDriver,
  onToggleWorstResult,
}: ChampionshipStandingsProps) {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />;
      default:
        return (
          <Target className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
        );
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
    <Card className="w-full f1-card border-primary/30">
      <CardHeader className="f1-gradient racing-stripes">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <CardTitle className="text-xl sm:text-3xl font-bold text-white lap-counter text-center">
            CHAMPIONSHIP STANDINGS
          </CardTitle>
        </div>
        <CardDescription className="text-white/90 text-center text-sm sm:text-lg telemetry-data px-2 sm:px-4 py-1 sm:py-2 rounded">
          🏁 Live standings with automatic drop rule applied
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {standings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-16 px-4">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 lap-counter text-center">
              NO STANDINGS YET
            </h3>
            <p className="text-muted-foreground text-center text-sm sm:text-base">
              Championship standings will appear once races are completed
            </p>
            <div className="w-24 sm:w-32 h-2 bg-primary/30 rounded mt-4"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/30">
                    <TableHead className="w-20 text-center lap-counter">
                      POS
                    </TableHead>
                    <TableHead className="lap-counter">DRIVER</TableHead>
                    <TableHead className="text-center lap-counter">
                      POINTS
                    </TableHead>
                    <TableHead className="text-center lap-counter">
                      EVENTS
                    </TableHead>
                    <TableHead className="text-center lap-counter">
                      DROPPED
                    </TableHead>
                    {isLeader && (
                      <TableHead className="text-center lap-counter">
                        ACTIONS
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((standing, index) => (
                    <TableRow
                      key={standing.driver.id}
                      className={`${getPositionStyle(
                        index + 1
                      )} border-primary/20`}
                    >
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getPositionIcon(index + 1)}
                          <span className="font-bold text-lg lap-counter">
                            {index + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-base font-semibold">
                            {standing.driver.name}
                          </span>
                          {standing.driver.isMaxVerstappen && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                              🚫 NO PARTICIPATION BONUS
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-2xl font-bold text-primary lap-counter">
                          {standing.totalPoints}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="telemetry-data px-2 py-1 rounded">
                          {standing.raceResults.length}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        <div className="telemetry-data px-2 py-1 rounded">
                          {standing.raceResults.reduce(
                            (sum, result) => sum + result.discardedPoints,
                            0
                          )}
                        </div>
                      </TableCell>
                      {isLeader && (
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onDeleteDriver && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  onDeleteDriver(standing.driver.id)
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {onToggleWorstResult &&
                              standing.raceResults.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const lastResult =
                                      standing.raceResults[
                                        standing.raceResults.length - 1
                                      ];
                                    const firstRaceId = Object.keys(
                                      lastResult.racePoints
                                    )[0];
                                    onToggleWorstResult(
                                      standing.driver.id,
                                      lastResult.eventId,
                                      firstRaceId
                                    );
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden p-2 sm:p-4 space-y-3 sm:space-y-4">
              {standings.map((standing, index) => (
                <Card
                  key={standing.driver.id}
                  className={`${getPositionStyle(
                    index + 1
                  )} f1-card border-primary/30`}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        {getPositionIcon(index + 1)}
                        <div>
                          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                            <span className="font-bold text-lg sm:text-2xl lap-counter">
                              #{index + 1}
                            </span>
                            <span className="font-bold text-base sm:text-xl">
                              {standing.driver.name}
                            </span>
                          </div>
                          {standing.driver.isMaxVerstappen && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                              🚫 NO PARTICIPATION BONUS
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-2xl sm:text-4xl text-primary lap-counter">
                          {standing.totalPoints}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground telemetry-data px-2 py-1 rounded">
                          POINTS
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm mb-3 sm:mb-4">
                      <div className="telemetry-data p-2 sm:p-3 rounded text-center">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">
                          EVENTS
                        </div>
                        <div className="font-bold text-sm sm:text-lg text-primary">
                          {standing.raceResults.length}
                        </div>
                      </div>
                      <div className="telemetry-data p-2 sm:p-3 rounded text-center">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">
                          DROPPED
                        </div>
                        <div className="font-bold text-sm sm:text-lg">
                          {standing.raceResults.reduce(
                            (sum, result) => sum + result.discardedPoints,
                            0
                          )}
                        </div>
                      </div>
                      <div className="telemetry-data p-2 sm:p-3 rounded text-center col-span-2 sm:col-span-1">
                        <div className="text-muted-foreground mb-1 text-xs sm:text-sm">
                          LAST
                        </div>
                        <div className="font-bold text-sm sm:text-lg text-primary">
                          {standing.raceResults.length > 0
                            ? standing.raceResults[
                                standing.raceResults.length - 1
                              ].finalPoints
                            : 0}
                        </div>
                      </div>
                    </div>

                    {/* Leader Actions */}
                    {isLeader && (
                      <div className="flex items-center justify-center gap-2 pt-3 border-t border-primary/20">
                        {onDeleteDriver && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteDriver(standing.driver.id)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Driver
                          </Button>
                        )}
                        {onToggleWorstResult &&
                          standing.raceResults.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const lastResult =
                                  standing.raceResults[
                                    standing.raceResults.length - 1
                                  ];
                                const firstRaceId = Object.keys(
                                  lastResult.racePoints
                                )[0];
                                onToggleWorstResult(
                                  standing.driver.id,
                                  lastResult.eventId,
                                  firstRaceId
                                );
                              }}
                              className="flex items-center gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Toggle Drop
                            </Button>
                          )}
                      </div>
                    )}

                    {/* Recent Results */}
                    {standing.raceResults.length > 0 && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-primary/20">
                        <div className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">
                          🏁 RECENT RESULTS
                        </div>
                        <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                          {standing.raceResults.slice(-5).map((result, idx) => (
                            <div
                              key={idx}
                              className="telemetry-data px-2 py-1 rounded text-xs font-mono flex-shrink-0"
                            >
                              {result.finalPoints}
                            </div>
                          ))}
                          {standing.raceResults.length > 5 && (
                            <div className="text-muted-foreground text-xs self-center flex-shrink-0">
                              +{standing.raceResults.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
