"use client";

import { useState, useEffect } from "react";
import { ChampionshipLeader } from "@/lib/types";

interface LeaderAuth {
  leader: ChampionshipLeader | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export function useLeaderAuth(): LeaderAuth {
  const [leader, setLeader] = useState<ChampionshipLeader | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const savedToken = localStorage.getItem("leader-token");
    const savedLeader = localStorage.getItem("leader-data");

    if (savedToken && savedLeader) {
      try {
        setToken(savedToken);
        setLeader(JSON.parse(savedLeader));
      } catch (error) {
        console.error("Error loading leader auth:", error);
        logout();
      }
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/leaders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setLeader(data.leader);
      setToken(data.token);

      localStorage.setItem("leader-token", data.token);
      localStorage.setItem("leader-data", JSON.stringify(data.leader));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/leaders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setLeader(data.leader);
      setToken(data.token);

      localStorage.setItem("leader-token", data.token);
      localStorage.setItem("leader-data", JSON.stringify(data.leader));

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    setLeader(null);
    setToken(null);
    localStorage.removeItem("leader-token");
    localStorage.removeItem("leader-data");
  };

  return {
    leader,
    token,
    isAuthenticated: !!leader && !!token,
    login,
    register,
    logout,
  };
}
