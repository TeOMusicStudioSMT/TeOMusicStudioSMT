

import React, { createContext, useState, ReactNode, useEffect, useMemo, useRef } from 'react';
import { Artist, NewsArticle, DisplayTrack, GalleryImage, PageID, StudioSubmission, SubmissionStatus, ConstellationItem, Release, Track, SpotlightItem, Playlist, CurrentlyPlayingTrack, Asset, TeoApp, FriendArtist, PlaylistCategory, SmtVideo, StudioActionCosts, ApiKeys, FooterContent, SpecializedAgent, JasonChatMessage } from '../types';
import { 
  COAI_ARTISTS, LATEST_NEWS, FEATURED_VIDEO_URLS, GALLERY_IMAGES, 
  STATIC_PAGE_CONTENT, STUDIO_SUBMISSIONS, CONSTELLATION_ITEMS, SPOTLIGHT_ITEMS, 
  PLAYLISTS, ASSET_VAULT, TRENDING_TRACK_IDS_DEFAULT, FEATURED_TRACK_URL_DEFAULT,
  TEO_APPS, FRIEND_ARTISTS, SMT_VIDEOS, PORTAL_URL_DEFAULT, DEFAULT_STUDIO_COSTS,
  DEFAULT_API_KEYS, DEFAULT_FOOTER_CONTENT, SPECIALIZED_AGENTS
} from '../constants';
import toast from 'react-hot-toast';
import { Chat } from '@google/genai';

// Define the shape of the state that IS persisted to localStorage
interface PersistedState {
  artists: Artist[];
  friendArtists: FriendArtist[];
  news: NewsArticle[];
  featuredVideoUrls: string[];
  featuredTrackUrl: string;
  pageContents: Record<PageID, string>;
  constellationItems: ConstellationItem[];
  spotlightItems: SpotlightItem[];
  playlists: Playlist[];
  assetVault: Asset[];
  showTottCatalog: boolean;
  trendingTrackIds: string[];
  teoApps: TeoApp[];
  heroBackgroundImage: string;
  smtVideos: SmtVideo[];
  portalUrl: string;
  studioCosts: StudioActionCosts;
  apiKeys: ApiKeys;
  footerContent: FooterContent;
  specializedAgents: SpecializedAgent[];
}

// Define the shape of the state that is NOT persisted (volatile)
interface VolatileState {
  galleryImages: GalleryImage[];
  studioSubmissions: StudioSubmission[];
  specializedAgentChats: Record<string, JasonChatMessage[]>;
}

// The full state is a combination of both
interface ContentState extends PersistedState, VolatileState {}

interface ContentContextType extends ContentState {
  allTracksMap: Map<string, CurrentlyPlayingTrack>;
  currentTrack: CurrentlyPlayingTrack | null;
  currentPlaylist: CurrentlyPlayingTrack[] | null;
  currentTrackIndex: number;
  trendingTracks: CurrentlyPlayingTrack[];
  addArtist: (newArtist: Artist) => void;
  updateArtist: (updatedArtist: Artist) => void;
  updateNewsArticle: (updatedArticle: NewsArticle, index: number) => void;
  addNewsArticle: (newArticle: NewsArticle) => void;
  deleteNewsArticle: (index: number) => void;
  updateFeaturedVideoUrls: (urls: string[]) => void;
  updateFeaturedTrackUrl: (url: string) => void;
  addGalleryImage: (newImage: GalleryImage) => void;
  updateGalleryImage: (updatedImage: GalleryImage, index: number) => void;
  deleteGalleryImage: (index: number) => void;
  updatePageContent: (pageId: PageID, content: string) => void;
  addStudioSubmission: (submission: Omit<StudioSubmission, 'id' | 'status'>) => void;
  showcaseSubmission: (submissionId: string, curatorComment: string, rating: number) => void;
  updateConstellationOrder: (items: ConstellationItem[]) => void;
  addConstellationItem: (item: ConstellationItem) => void;
  updateConstellationItem: (item: ConstellationItem) => void;
  deleteConstellationItem: (itemId: string) => void;
  updateSpotlightItems: (items: SpotlightItem[]) => void;
  setShowTottCatalog: (show: boolean) => void;
  playTrack: (track: Track, release: Release, artist: Artist) => void;
  playPlaylist: (tracks: CurrentlyPlayingTrack[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearCurrentTrack: () => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (playlist: Playlist) => void;
  deletePlaylist: (playlistId: string) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (assetId: string) => void;
  updateTrendingTrackIds: (ids: string[]) => void;
  addTeoApp: (app: TeoApp) => void;
  updateTeoApp: (app: TeoApp) => void;
  deleteTeoApp: (appId: string) => void;
  addFriendArtist: (friend: FriendArtist) => void;
  updateFriendArtist: (friend: FriendArtist) => void;
  deleteFriendArtist: (friendId: string) => void;
  updateHeroBackgroundImage: (newUrl: string) => void;
  addSmtVideo: (video: SmtVideo) => void;
  updateSmtVideo: (video: SmtVideo) => void;
  deleteSmtVideo: (videoId: string) => void;
  updatePortalUrl: (newUrl: string) => void;
  updateStudioCosts: (newCosts: StudioActionCosts) => void;
  updateApiKeys: (keys: ApiKeys) => void;
  updateFooterContent: (newContent: FooterContent) => void;
  setSpecializedAgentChats: React.Dispatch<React.SetStateAction<Record<string, JasonChatMessage[]>>>;
  specializedAgentSessions: React.MutableRefObject<Record<string, Chat | null>>;
}

export const ContentContext = createContext<ContentContextType | undefined>(undefined);

interface ContentProviderProps {
  children: ReactNode;
}

const CONTENT_STORAGE_KEY = 'smt-content-data-v13'; // Version incremented for agents

// Function to get initial PERSISTED state from localStorage or constants
const getInitialPersistedState = (): PersistedState => {
    try {
        const storedContent = localStorage.getItem(CONTENT_STORAGE_KEY);
        if (storedContent) {
            const parsed = JSON.parse(storedContent);
            // Check for essential persisted properties to ensure data validity
            if (parsed.artists && parsed.pageContents && parsed.footerContent && parsed.specializedAgents) {
               return parsed;
            }
        }
    } catch (error) {
        console.error("Failed to parse content from localStorage", error);
    }
    // Fallback to initial constants for persisted data
    return {
        artists: COAI_ARTISTS,
        friendArtists: FRIEND_ARTISTS,
        news: LATEST_NEWS,
        featuredVideoUrls: FEATURED_VIDEO_URLS,
        featuredTrackUrl: FEATURED_TRACK_URL_DEFAULT,
        pageContents: STATIC_PAGE_CONTENT,
        constellationItems: CONSTELLATION_ITEMS,
        spotlightItems: SPOTLIGHT_ITEMS,
        playlists: PLAYLISTS,
        assetVault: ASSET_VAULT,
        showTottCatalog: false,
        trendingTrackIds: TRENDING_TRACK_IDS_DEFAULT,
        teoApps: TEO_APPS,
        heroBackgroundImage: 'https://images.unsplash.com/photo-1536965764833-5971e0ab3dd5?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Default background reflecting the studio's soul
        smtVideos: SMT_VIDEOS,
        portalUrl: PORTAL_URL_DEFAULT,
        studioCosts: DEFAULT_STUDIO_COSTS,
        apiKeys: DEFAULT_API_KEYS,
        footerContent: DEFAULT_FOOTER_CONTENT,
        specializedAgents: SPECIALIZED_AGENTS,
    };
};

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [state, setState] = useState<ContentState>({
      ...getInitialPersistedState(),
      // Initialize volatile state separately. It will be empty on page load.
      galleryImages: GALLERY_IMAGES, 
      studioSubmissions: STUDIO_SUBMISSIONS,
      specializedAgentChats: {},
  });
  
  const [currentPlaylist, setCurrentPlaylist] = useState<CurrentlyPlayingTrack[] | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [specializedAgentChats, setSpecializedAgentChats] = useState<Record<string, JasonChatMessage[]>>({});
  const specializedAgentSessions = useRef<Record<string, Chat | null>>({});

  const currentTrack = useMemo(() => {
    return currentPlaylist ? currentPlaylist[currentTrackIndex] : null;
  }, [currentPlaylist, currentTrackIndex]);

  const allTracksMap = useMemo(() => {
    const map = new Map<string, CurrentlyPlayingTrack>();
    state.artists.forEach(artist => {
        artist.discography.forEach(release => {
            release.tracks.forEach(track => {
                map.set(track.id, {
                    ...track,
                    artistName: artist.name,
                    releaseTitle: release.title,
                    coverImageUrl: release.coverImageUrl
                });
            });
        });
    });
    return map;
  }, [state.artists]);

  const trendingTracks: CurrentlyPlayingTrack[] = useMemo(() => {
    return state.trendingTrackIds
      .map(trackId => allTracksMap.get(trackId))
      .filter((t): t is CurrentlyPlayingTrack => t !== undefined);
  }, [state.trendingTrackIds, allTracksMap]);


  // Effect to persist ONLY the non-volatile state to localStorage
  useEffect(() => {
    try {
        const { galleryImages, studioSubmissions, specializedAgentChats: _, ...persistedState } = state;
        localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
        console.error("Failed to save content to localStorage:", error);
        // Inform user if storage fails, might happen in private browsing or if full
        toast.error("Could not save session data. Changes may not be saved across reloads.", {id: 'storage-error'});
    }
  }, [state]);

  const addArtist = (newArtist: Artist) => {
    setState(prevState => {
        if (prevState.artists.some(a => a.id.toLowerCase() === newArtist.id.toLowerCase())) {
            toast.error(`An artist with ID '${newArtist.id}' already exists.`);
            return prevState;
        }
        return { ...prevState, artists: [...prevState.artists, newArtist] };
    });
  };

  const updateArtist = (updatedArtist: Artist) => {
    setState(prevState => ({
      ...prevState,
      artists: prevState.artists.map(artist => artist.id === updatedArtist.id ? updatedArtist : artist)
    }));
  };

  const updateNewsArticle = (updatedArticle: NewsArticle, index: number) => {
    setState(prevState => ({
      ...prevState,
      news: prevState.news.map((article, i) => i === index ? updatedArticle : article)
    }));
  };

  const addNewsArticle = (newArticle: NewsArticle) => {
    setState(prevState => ({ ...prevState, news: [newArticle, ...prevState.news] }));
  };
  
  const deleteNewsArticle = (index: number) => {
    setState(prevState => ({ ...prevState, news: prevState.news.filter((_, i) => i !== index) }));
  };

  const updateFeaturedVideoUrls = (urls: string[]) => {
    setState(prevState => ({ ...prevState, featuredVideoUrls: urls }));
  };
  
  const updateFeaturedTrackUrl = (url: string) => {
    setState(prevState => ({ ...prevState, featuredTrackUrl: url }));
  }

  const addGalleryImage = (newImage: GalleryImage) => {
    setState(prevState => ({ ...prevState, galleryImages: [newImage, ...prevState.galleryImages] }));
  };

  const updateGalleryImage = (updatedImage: GalleryImage, index: number) => {
    setState(prevState => ({
      ...prevState,
      galleryImages: prevState.galleryImages.map((image, i) => i === index ? updatedImage : image)
    }));
  };
  
  const deleteGalleryImage = (index: number) => {
    setState(prevState => ({ ...prevState, galleryImages: prevState.galleryImages.filter((_, i) => i !== index) }));
  };
  
  const updatePageContent = (pageId: PageID, content: string) => {
    setState(prevState => ({
      ...prevState,
      pageContents: { ...prevState.pageContents, [pageId]: content }
    }));
  };
  
  const addStudioSubmission = (submission: Omit<StudioSubmission, 'id' | 'status'>) => {
    const newSubmission: StudioSubmission = {
      ...submission,
      id: `sub_${Date.now()}`,
      status: SubmissionStatus.PENDING,
    };
    setState(prevState => ({ ...prevState, studioSubmissions: [newSubmission, ...prevState.studioSubmissions] }));
  };
  
  const showcaseSubmission = (submissionId: string, curatorComment: string, rating: number) => {
    setState(prevState => {
        const newSubmissions = prevState.studioSubmissions.map(sub => 
            sub.id === submissionId 
              ? { ...sub, status: SubmissionStatus.SHOWCASED, curatorComment, curatorRating: rating }
              : sub
        );

        const newPlaylists = prevState.playlists.map(p => {
            if (p.category === PlaylistCategory.SHOWCASE) {
                // Avoid adding duplicates
                if (!p.trackIds.includes(submissionId)) {
                    return { ...p, trackIds: [...p.trackIds, submissionId] };
                }
            }
            return p;
        });

        return {
            ...prevState,
            studioSubmissions: newSubmissions,
            playlists: newPlaylists,
        };
    });
  };

  const updateConstellationOrder = (items: ConstellationItem[]) => {
    setState(prevState => ({ ...prevState, constellationItems: items }));
  };

  const addConstellationItem = (item: ConstellationItem) => {
    setState(prevState => ({ ...prevState, constellationItems: [...prevState.constellationItems, item] }));
  };

  const updateConstellationItem = (item: ConstellationItem) => {
    setState(prevState => ({
      ...prevState,
      constellationItems: prevState.constellationItems.map(i => i.id === item.id ? item : i)
    }));
  };

  const deleteConstellationItem = (itemId: string) => {
    setState(prevState => ({ ...prevState, constellationItems: prevState.constellationItems.filter(i => i.id !== itemId) }));
  };
  
  const updateSpotlightItems = (items: SpotlightItem[]) => {
    setState(prevState => ({ ...prevState, spotlightItems: items }));
  }

  const setShowTottCatalog = (show: boolean) => {
    setState(prevState => ({ ...prevState, showTottCatalog: show }));
  };

  const playTrack = (track: Track, release: Release, artist: Artist) => {
      const trackToPlay: CurrentlyPlayingTrack = {
          ...track,
          artistName: artist.name,
          releaseTitle: release.title,
          coverImageUrl: release.coverImageUrl
      };
      setCurrentPlaylist([trackToPlay]);
      setCurrentTrackIndex(0);
  };

  const playPlaylist = (tracks: CurrentlyPlayingTrack[]) => {
      if (tracks.length > 0) {
        setCurrentPlaylist(tracks);
        setCurrentTrackIndex(0);
      }
  };

  const playNext = () => {
    if (currentPlaylist) {
        setCurrentTrackIndex(prevIndex => (prevIndex + 1) % currentPlaylist.length);
    }
  };

  const playPrevious = () => {
    if (currentPlaylist) {
        setCurrentTrackIndex(prevIndex => (prevIndex - 1 + currentPlaylist.length) % currentPlaylist.length);
    }
  };

  const clearCurrentTrack = () => {
      setCurrentPlaylist(null);
  };
  
  const addPlaylist = (playlist: Playlist) => {
      setState(prevState => ({ ...prevState, playlists: [playlist, ...prevState.playlists] }));
  };
  
  const updatePlaylist = (playlist: Playlist) => {
       setState(prevState => ({
          ...prevState,
          playlists: prevState.playlists.map(p => p.id === playlist.id ? playlist : p)
      }));
  };

  const deletePlaylist = (playlistId: string) => {
      setState(prevState => ({ ...prevState, playlists: prevState.playlists.filter(p => p.id !== playlistId) }));
  };
  
  const addAsset = (asset: Asset) => {
      setState(prevState => ({ ...prevState, assetVault: [asset, ...prevState.assetVault] }));
  };

  const updateAsset = (asset: Asset) => {
       setState(prevState => ({
          ...prevState,
          assetVault: prevState.assetVault.map(a => a.id === asset.id ? asset : a)
      }));
  };

  const deleteAsset = (assetId: string) => {
      setState(prevState => ({ ...prevState, assetVault: prevState.assetVault.filter(a => a.id !== assetId) }));
  };

  const updateTrendingTrackIds = (ids: string[]) => {
      setState(prevState => ({ ...prevState, trendingTrackIds: ids }));
  }

  const addTeoApp = (app: TeoApp) => {
      setState(prevState => ({ ...prevState, teoApps: [app, ...prevState.teoApps] }));
  };
  
  const updateTeoApp = (app: TeoApp) => {
       setState(prevState => ({
          ...prevState,
          teoApps: prevState.teoApps.map(p => p.id === app.id ? app : p)
      }));
  };

  const deleteTeoApp = (appId: string) => {
      setState(prevState => ({ ...prevState, teoApps: prevState.teoApps.filter(p => p.id !== appId) }));
  };

  const addFriendArtist = (friend: FriendArtist) => {
    setState(prevState => ({ ...prevState, friendArtists: [friend, ...prevState.friendArtists]}));
  };

  const updateFriendArtist = (friend: FriendArtist) => {
    setState(prevState => ({ ...prevState, friendArtists: prevState.friendArtists.map(f => f.id === friend.id ? friend : f) }));
  };

  const deleteFriendArtist = (friendId: string) => {
    setState(prevState => ({...prevState, friendArtists: prevState.friendArtists.filter(f => f.id !== friendId)}));
  };
  
  const updateHeroBackgroundImage = (newUrl: string) => {
    setState(prevState => ({ ...prevState, heroBackgroundImage: newUrl }));
  };

  const addSmtVideo = (video: SmtVideo) => {
      setState(prevState => ({ ...prevState, smtVideos: [video, ...prevState.smtVideos] }));
  };

  const updateSmtVideo = (video: SmtVideo) => {
       setState(prevState => ({
          ...prevState,
          smtVideos: prevState.smtVideos.map(v => v.id === video.id ? video : v)
      }));
  };

  const deleteSmtVideo = (videoId: string) => {
      setState(prevState => ({ ...prevState, smtVideos: prevState.smtVideos.filter(v => v.id !== videoId) }));
  };

  const updatePortalUrl = (newUrl: string) => {
      setState(prevState => ({ ...prevState, portalUrl: newUrl }));
  };

  const updateStudioCosts = (newCosts: StudioActionCosts) => {
    setState(prevState => ({ ...prevState, studioCosts: newCosts }));
  };

  const updateApiKeys = (keys: ApiKeys) => {
      setState(prevState => ({ ...prevState, apiKeys: keys }));
  };

  const updateFooterContent = (newContent: FooterContent) => {
      setState(prevState => ({ ...prevState, footerContent: newContent }));
  };

  return (
    <ContentContext.Provider value={{ 
        ...state,
        specializedAgentChats,
        allTracksMap,
        currentTrack,
        currentPlaylist,
        currentTrackIndex,
        trendingTracks,
        addArtist,
        updateArtist, 
        updateNewsArticle, 
        addNewsArticle, 
        deleteNewsArticle,
        updateFeaturedVideoUrls,
        updateFeaturedTrackUrl,
        addGalleryImage, 
        updateGalleryImage, 
        deleteGalleryImage,
        updatePageContent, 
        addStudioSubmission, 
        showcaseSubmission,
        updateConstellationOrder, 
        addConstellationItem, 
        updateConstellationItem, 
        deleteConstellationItem,
        updateSpotlightItems,
        setShowTottCatalog,
        playTrack,
        playPlaylist,
        playNext,
        playPrevious,
        clearCurrentTrack,
        addPlaylist,
        updatePlaylist,
        deletePlaylist,
        addAsset,
        updateAsset,
        deleteAsset,
        updateTrendingTrackIds,
        addTeoApp,
        updateTeoApp,
        deleteTeoApp,
        addFriendArtist,
        updateFriendArtist,
        deleteFriendArtist,
        updateHeroBackgroundImage,
        addSmtVideo,
        updateSmtVideo,
        deleteSmtVideo,
        updatePortalUrl,
        updateStudioCosts,
        updateApiKeys,
        updateFooterContent,
        setSpecializedAgentChats,
        specializedAgentSessions,
    }}>
      {children}
    </ContentContext.Provider>
  );
};