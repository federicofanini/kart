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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderAuth } from "@/hooks/use-leader-auth";
import { Crown, LogIn, UserPlus, Shield, Users } from "lucide-react";

export function LeaderAuth() {
  const { login, register, isAuthenticated, leader } = useLeaderAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  if (isAuthenticated && leader) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl">Leader Autenticato</CardTitle>
          </div>
          <CardDescription>Benvenuto, {leader.name}!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {leader.isCreator ? (
              <Shield className="h-5 w-5 text-yellow-500" />
            ) : (
              <Users className="h-5 w-5 text-blue-500" />
            )}
            <div>
              <p className="font-medium">
                {leader.isCreator ? "Creatore Campionato" : "Leader Campionato"}
              </p>
              <p className="text-sm text-muted-foreground">{leader.email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Ora puoi gestire eventi e risultati delle gare
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsLoading(true);
    setError(null);

    const result = await login(loginEmail, loginPassword);

    if (!result.success) {
      setError(result.error || "Errore durante il login");
    } else {
      setLoginEmail("");
      setLoginPassword("");
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerEmail || !registerPassword) return;

    setIsLoading(true);
    setError(null);

    const result = await register(
      registerName,
      registerEmail,
      registerPassword
    );

    if (!result.success) {
      setError(result.error || "Errore durante la registrazione");
    } else {
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Accesso Leader</CardTitle>
        </div>
        <CardDescription>
          Accedi o registrati come leader per gestire il campionato
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Accedi
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Registrati
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md mt-4 text-sm">
              {error}
            </div>
          )}

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="la-tua-email@esempio.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="La tua password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  type="text"
                  placeholder="Il tuo nome"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="la-tua-email@esempio.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Crea una password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Registrazione in corso..."
                  : "Registrati come Leader"}
              </Button>
            </form>

            <div className="text-xs text-muted-foreground text-center">
              Il primo leader diventa automaticamente il creatore del campionato
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
