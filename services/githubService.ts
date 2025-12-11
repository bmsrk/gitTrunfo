import { GithubRepo, GithubUser } from '../types';

const BASE_URL = 'https://api.github.com';

// DUMMY DATA FOR OFFLINE MODE
const DUMMY_USER_1: GithubUser = {
  login: "offline_hero",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=hero",
  name: "Offline Hero",
  bio: "Coding without internet",
  public_repos: 42,
  followers: 100,
  following: 10
};

const DUMMY_USER_2: GithubUser = {
  login: "offline_cpu",
  avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=cpu",
  name: "Offline CPU",
  bio: "I live in your cache",
  public_repos: 999,
  followers: 0,
  following: 0
};

const generateDummyRepos = (count: number, prefix: string): GithubRepo[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        name: `${prefix}-repo-${i}`,
        description: `A dummy repository for offline testing ${i}`,
        stargazers_count: Math.floor(Math.random() * 5000) + 100,
        forks_count: Math.floor(Math.random() * 1000),
        watchers_count: Math.floor(Math.random() * 1000),
        open_issues_count: Math.floor(Math.random() * 50),
        size: Math.floor(Math.random() * 10000),
        language: ['TypeScript', 'JavaScript', 'Rust', 'Go', 'Python'][Math.floor(Math.random() * 5)],
        html_url: '#',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));
};

export const fetchGithubUser = async (username: string): Promise<GithubUser> => {
  try {
    const response = await fetch(`${BASE_URL}/users/${username}`);
    if (!response.ok) {
        if (response.status === 403) throw new Error("RATE_LIMIT");
        if (response.status === 404) throw new Error(`User ${username} not found`);
        throw new Error('Failed to fetch user');
    }
    return response.json();
  } catch (error: any) {
    if (error.message === "RATE_LIMIT" || error.message.includes("Failed to fetch")) {
        console.warn("Using offline fallback data for user");
        // Return dummy based on requested name to simulate consistency
        const isCpu = username.toLowerCase().includes('cpu') || username.toLowerCase() === 'google';
        const dummyBase = isCpu ? DUMMY_USER_2 : DUMMY_USER_1;
        return {
             ...dummyBase,
             login: username,
             name: username === 'p2' ? 'Offline CPU' : username
        };
    }
    throw error;
  }
};

export const fetchUserRepos = async (username: string): Promise<GithubRepo[]> => {
  try {
    const response = await fetch(`${BASE_URL}/users/${username}/repos?sort=pushed&per_page=100`);
    if (!response.ok) {
        if (response.status === 403) throw new Error("RATE_LIMIT");
        throw new Error('Failed to fetch repos');
    }
    const repos: GithubRepo[] = await response.json();
    return repos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10);
  } catch (error: any) {
    if (error.message === "RATE_LIMIT" || error.message.includes("Failed to fetch")) {
         console.warn("Using offline fallback data for repos");
         return generateDummyRepos(10, username).sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    throw error;
  }
};

export const createPlayer = async (username: string, id: string, isAi: boolean = false) => {
  const user = await fetchGithubUser(username);
  const deck = await fetchUserRepos(username);
  
  if (deck.length < 3) {
    throw new Error(`${username} needs at least 3 repositories to play.`);
  }

  return {
    id,
    user,
    deck,
    score: 0,
    isAi
  };
};