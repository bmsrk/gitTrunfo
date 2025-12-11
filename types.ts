export interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  size: number; // in KB
  language: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GithubUser {
  login: string;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface Player {
  id: string;
  user: GithubUser;
  deck: GithubRepo[];
  score: number;
  isAi: boolean;
}

export type StatType = 'stargazers_count' | 'forks_count' | 'size' | 'open_issues_count' | 'watchers_count';

export const STAT_LABELS: Record<StatType, string> = {
  stargazers_count: 'Stars',
  forks_count: 'Forks',
  size: 'Size (KB)',
  open_issues_count: 'Open Issues',
  watchers_count: 'Watchers',
};

export enum GamePhase {
  SETUP,
  LOADING,
  BATTLE_START,
  TURN_PLAYER_SELECT,
  TURN_RESOLVE,
  GAME_OVER,
}

export interface BattleLogEntry {
  id: string;
  text: string;
  type: 'info' | 'commentary' | 'combat';
  timestamp: number;
}