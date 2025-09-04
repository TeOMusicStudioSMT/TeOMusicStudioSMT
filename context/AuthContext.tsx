

import React, { createContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { User, SubscriptionTier, UserProject, UserPlaylist } from '../types';
import { DAILY_POINT_ALLOWANCE } from '../constants';
import toast from 'react-hot-toast';

// Add types for Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  login: () => void;
  logout: () => void;
  createUser: (newUser: Omit<User, 'projects' | 'memberSince' | 'avatarInitial' | 'playlists'>) => boolean;
  updateUser: (updatedUser: User) => void;
  deleteUser: (email: string) => void;
  addUserProject: (project: UserProject) => void;
  isAdmin: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  changeAdminPassword: (current: string, newPass: string) => boolean;
  isGoogleReady: boolean;
  createUserPlaylist: (title: string, description: string) => void;
  deleteUserPlaylist: (playlistId: string) => void;
  updateUserPlaylist: (playlistId: string, updates: Partial<UserPlaylist>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const ADMIN_PASSWORD_KEY = "smt-admin-password";
const ADMIN_SESSION_KEY = "smt-admin-session";
const ALL_USERS_STORAGE_KEY = "smt-all-users-data";
const ALL_PROJECTS_STORAGE_KEY = "smt-all-projects-data";
const CURRENT_USER_EMAIL_KEY = "smt-current-user-email";

const getInitialUsers = (): User[] => {
    try {
        const storedUsersData = localStorage.getItem(ALL_USERS_STORAGE_KEY);
        const storedProjectsData = localStorage.getItem(ALL_PROJECTS_STORAGE_KEY);
        const allProjects: Record<string, UserProject[]> = storedProjectsData ? JSON.parse(storedProjectsData) : {};

        if (storedUsersData) {
            const users: Omit<User, 'projects'>[] = JSON.parse(storedUsersData);
            return users.map(u => ({
                ...u,
                projects: allProjects[u.email] || [],
                playlists: u.playlists || [],
            }));
        }
    } catch (error) {
        console.error("Failed to parse data from localStorage", error);
    }
    return [];
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(getInitialUsers);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('password');
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleInitialized = useRef(false);

  const updateUser = (updatedUser: User) => {
    setAllUsers(prevAllUsers => prevAllUsers.map(u => u.email === updatedUser.email ? updatedUser : u));
    setUser(prevUser => (prevUser && prevUser.email === updatedUser.email) ? updatedUser : prevUser);
  };
  
  const processDailyPoints = (targetUser: User) => {
      const today = new Date().toISOString().split('T')[0];
      if (targetUser.lastLogin !== today) {
          const pointsToAdd = DAILY_POINT_ALLOWANCE[targetUser.tier] || 0;
          const updatedUser = { 
              ...targetUser, 
              points: targetUser.points + pointsToAdd,
              lastLogin: today 
          };
          updateUser(updatedUser);
          if (pointsToAdd > 0) {
              toast.success(`+${pointsToAdd} daily SMT Points!`);
          }
          return updatedUser;
      }
      return targetUser;
  };

  useEffect(() => {
    const currentUserEmail = sessionStorage.getItem(CURRENT_USER_EMAIL_KEY);
    if(currentUserEmail) {
        const rehydratedUser = allUsers.find(u => u.email === currentUserEmail);
        if (rehydratedUser) {
           const finalUser = processDailyPoints(rehydratedUser);
           setUser(finalUser);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
        const usersToPersist = allUsers.map(({ projects, ...rest }) => rest);
        localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(usersToPersist));

        const projectsToPersist = allUsers.reduce((acc, currentUser) => {
            if (currentUser.projects && currentUser.projects.length > 0) {
                acc[currentUser.email] = currentUser.projects;
            }
            return acc;
        }, {} as Record<string, UserProject[]>);
        localStorage.setItem(ALL_PROJECTS_STORAGE_KEY, JSON.stringify(projectsToPersist));

    } catch (error) {
        console.error("Failed to save data to localStorage", error);
        if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
             toast.error("Local storage is full. Unable to save new project data.", { duration: 5000 });
        }
    }
  }, [allUsers]);

  useEffect(() => {
    const activeSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (activeSession === 'true') {
      setIsAdmin(true);
    }
    const storedPassword = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    if (storedPassword) {
        setAdminPassword(storedPassword);
    }
  }, []);

  const handleCredentialResponse = useCallback((response: any) => {
    try {
        const idTokenFromGoogle = response.credential;
        sessionStorage.setItem('smt-id-token', idTokenFromGoogle);
        const profile = JSON.parse(atob(idTokenFromGoogle.split('.')[1]));
        
        setAllUsers(currentAllUsers => {
            let userToLogin = currentAllUsers.find(u => u.email === profile.email);
            let updatedAllUsers = currentAllUsers;

            if (!userToLogin) {
                const newUser: User = {
                    name: profile.name,
                    email: profile.email,
                    avatarInitial: profile.name.charAt(0).toUpperCase(),
                    avatarUrl: profile.picture,
                    tier: SubscriptionTier.FREE,
                    points: 100, // Starting points for new users
                    memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    lastLogin: '',
                    projects: [],
                    playlists: [],
                };
                updatedAllUsers = [...currentAllUsers, newUser];
                userToLogin = newUser;
            }

            const today = new Date().toISOString().split('T')[0];
            let finalUser = userToLogin;

            if (userToLogin.lastLogin !== today) {
                const pointsToAdd = DAILY_POINT_ALLOWANCE[userToLogin.tier] || 0;
                finalUser = { 
                    ...userToLogin, 
                    points: userToLogin.points + pointsToAdd,
                    lastLogin: today 
                };
                
                updatedAllUsers = updatedAllUsers.map(u => u.email === finalUser.email ? finalUser : u);
                
                if (pointsToAdd > 0) {
                    toast.success(`+${pointsToAdd} daily SMT Points!`);
                }
            }

            setUser(finalUser);
            sessionStorage.setItem(CURRENT_USER_EMAIL_KEY, finalUser.email);
            toast.success(`Welcome back, ${finalUser.name}!`);
            
            return updatedAllUsers;
        });

    } catch (error) {
        console.error("Error handling Google Sign-In:", error);
        toast.error("Could not sign in with Google.");
    }
  }, []);

  useEffect(() => {
    if (googleInitialized.current) return;

    const checkGoogle = () => {
        if (window.google && window.google.accounts) {
// FIX: Environment variables in Create React App must be prefixed with REACT_APP_.
             if (!process.env.REACT_APP_GOOGLE_CLIENT_ID) {
                console.warn("REACT_APP_GOOGLE_CLIENT_ID environment variable not set. Google Sign-In will not work.");
                toast.error("Google Sign-In is not configured by the administrator.", { duration: 6000 });
                return;
            }
            window.google.accounts.id.initialize({
                client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });
            setIsGoogleReady(true);
            googleInitialized.current = true;
        } else {
            setTimeout(checkGoogle, 100); // Poll for GSI client
        }
    };
    checkGoogle();
  }, [handleCredentialResponse]);

  const login = () => {
// FIX: Environment variables in Create React App must be prefixed with REACT_APP_.
    if (!isGoogleReady || !process.env.REACT_APP_GOOGLE_CLIENT_ID) {
        toast.error("Google Sign-In is not configured or ready yet.");
        return;
    }
    window.google.accounts.id.prompt();
  };
  
  const logout = () => {
    if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    sessionStorage.removeItem(CURRENT_USER_EMAIL_KEY);
    sessionStorage.removeItem('smt-id-token');
  };
  
  const createUser = (newUser: Omit<User, 'projects' | 'memberSince' | 'avatarInitial' | 'playlists'>): boolean => {
      if (allUsers.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
          toast.error("An account with this email already exists.");
          return false;
      }
      
      const userToAdd: User = {
          ...newUser,
          avatarInitial: newUser.name.charAt(0).toUpperCase(),
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          projects: [],
          playlists: [],
      };
      setAllUsers(prev => [...prev, userToAdd]);
      return true;
  }

  const deleteUser = (email: string) => {
      if (user?.email === email) {
          logout();
      }
      setAllUsers(prev => prev.filter(u => u.email !== email));
  };

  const addUserProject = (project: UserProject) => {
    if (!user) {
        toast.error("You must be logged in to save projects.");
        return;
    }
    const updatedUser = {
        ...user,
        projects: [project, ...(user.projects || [])]
    };
    updateUser(updatedUser);
    toast.success(`'${project.title}' saved to My Projects!`);
  };

  const createUserPlaylist = (title: string, description: string) => {
    if (!user) {
      toast.error("You must be logged in to create a playlist.");
      return;
    }
    const newPlaylist: UserPlaylist = { id: `user_pl_${Date.now()}`, title, description, trackIds: [] };
    const updatedUser = { ...user, playlists: [...(user.playlists || []), newPlaylist] };
    updateUser(updatedUser);
    toast.success(`Playlist "${title}" created!`);
  };

  const deleteUserPlaylist = (playlistId: string) => {
    if (!user) return;
    const updatedPlaylists = (user.playlists || []).filter(p => p.id !== playlistId);
    const updatedUser = { ...user, playlists: updatedPlaylists };
    updateUser(updatedUser);
    toast.success("Playlist deleted.");
  };

  const updateUserPlaylist = (playlistId: string, updates: Partial<UserPlaylist>) => {
    if (!user) return;
    const updatedPlaylists = (user.playlists || []).map(p =>
      p.id === playlistId ? { ...p, ...updates } : p
    );
    const updatedUser = { ...user, playlists: updatedPlaylists };
    updateUser(updatedUser);
  };
  
  const adminLogin = (password: string): boolean => {
    if (password === adminPassword) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdmin(false);
  };
  
  const changeAdminPassword = (current: string, newPass: string): boolean => {
      if (current === adminPassword) {
          setAdminPassword(newPass);
          sessionStorage.setItem(ADMIN_PASSWORD_KEY, newPass);
          return true;
      }
      return false;
  }

  return (
    <AuthContext.Provider value={{ user, allUsers, login, logout, createUser, updateUser, deleteUser, addUserProject, isAdmin, adminLogin, adminLogout, changeAdminPassword, isGoogleReady, createUserPlaylist, deleteUserPlaylist, updateUserPlaylist }}>
      {children}
    </AuthContext.Provider>
  );
};