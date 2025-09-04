

export enum SubscriptionTier {
  FREE = 'Free',
  BASIC = 'Basic',
  PREMIUM = 'Premium',
  VIP = 'VIP',
}

export enum UserProjectType {
    SAVED_IMAGE = 'Saved Image',
    STUDIO_PROJECT = 'Studio Project',
}

export interface UserProject {
    id: string;
    type: UserProjectType;
    title: string;
    description: string;
    timestamp: string;
    content: {
        imageUrl?: string;
        prompt?: string;
        submissionId?: string;
        projectData?: Omit<StudioSubmission, 'id' | 'userEmail' | 'userName' | 'status' | 'curatorComment' | 'curatorRating'>;
        artistName?: string;
    };
}

export interface UserPlaylist {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
}

export interface User {
  name: string;
  vanityName?: string;
  email: string;
  avatarInitial: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  points: number;
  memberSince: string;
  lastLogin?: string;
  projects: UserProject[];
  playlists?: UserPlaylist[];
}

export interface Track {
  id: string;
  title: string;
  sourceUrl?: string;
  accessTier?: SubscriptionTier;
  description?: string;
}

export interface Release {
  id: string;
  title: string;
  type: 'Album' | 'EP' | 'Single';
  coverImageUrl: string;
  tracks: Track[];
}

export interface Artist {
  id:string;
  name: string;
  genre: string;
  personality: string;
  imageUrl: string;
  headerImageUrl: string;
  bio: string;
  discography: Release[];
  gallery: string[];
  spotifyArtistEmbedUrl?: string;
}

export interface FriendArtist {
  id: string;
  name: string;
  role: string;
  description?: string;
  imageUrl: string;
  websiteUrl: string;
}

// This is a display-oriented type, enriched with artist info for convenience
export interface DisplayTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  type: 'Album' | 'Single' | 'EP';
  imageUrl: string;
  isNew?: boolean;
  isPremium?: boolean;
  externalUrl?: string;
  sourceUrl?: string;
}


export interface NewsArticle {
  date: string;
  title: string;
  summary: string;
  imageUrl: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  artist?: Artist;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  title: string;
  date: string;
  description: string;
  prompt: string;
  userName: string;
  userAvatarUrl?: string;
}

export type PageID = 'about' | 'store' | 'support' | 'press' | 'privacy' | 'terms' | 'cookies' | 'dmca';

export enum SubmissionStatus {
  PENDING = 'Pending',
  SHOWCASED = 'Showcased',
}

export enum SoundStemCategory {
    DRUMS = 'Drums',
    BASS = 'Bass',
    MELODY = 'Melody',
    PADS = 'Pads',
    FX = 'FX',
}

export interface SoundStem {
    id: string;
    name: string;
    category: SoundStemCategory;
    url: string;
}

export interface VideoStoryboardEntry {
    scene: number;
    description: string;
    generatedImagePrompt_entry: string;
    generatedImagePrompt_exit: string;
    stillUrl_entry?: string;
    stillUrl_exit?: string;
}

export interface StudioSubmission {
  id: string;
  userEmail: string;
  userName: string;
  prompt: string;
  selectedCoAiArtistId: string;
  generatedIdea: string; // This is now the 'Creative Direction'
  lyrics: string;
  soundPalette: {
      category: SoundStemCategory;
      stemId: string;
  }[];
  videoStoryboard: VideoStoryboardEntry[];
  status: SubmissionStatus;
  curatorComment?: string;
  curatorRating?: number; // Rating from 0 to 100
  // New fields for Suno integration
  sunoTitle?: string;
  sunoStyle?: string;
  sunoTags?: string[];
  weirdness?: number; // 0-100
  styleInfluence?: number; // 0-100
  audioInfluence?: number; // 0-100
}


export interface ConstellationItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

export interface SpotlightItem {
  trackId: string | null;
  videoUrl?: string;
}

export enum PlaylistCategory {
    TEO_OFFICIAL = 'TeO Official',
    SMT_SELECTS = 'S.M.T. Selects',
    SHOWCASE = 'Showcase Winners',
    OCCASIONAL = 'Occasional',
    USER_PLAYLISTS = 'User Playlists'
}

export interface Playlist {
    id: string;
    title: string;
    description: string;
    coverImageUrl: string;
    trackIds: string[];
    category: PlaylistCategory;
    externalUrl?: string;
}


export interface CurrentlyPlayingTrack extends Track {
    artistName: string;
    releaseTitle: string;
    coverImageUrl: string;
    duration?: number;
}

export enum AssetType {
    IMAGE = 'Image',
    AUDIO = 'Audio',
    VIDEO = 'Video',
}

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    url: string;
    category?: SoundStemCategory;
}

export interface SubscriptionTierInfo {
    tier: SubscriptionTier;
    price: string;
    priceDescription: string;
    yearlyPrice?: string;
    yearlyPriceDescription?: string;
    yearlyDiscount?: string;
    features: string[];
    isFeatured?: boolean;
}

export interface TeoApp {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  launchUrl: string;
}

export interface PointPackage {
  id: string;
  points: number;
  price: number;
  currency: 'USD';
  bestValue?: boolean;
}

export interface SmtVideo {
  id: string;
  title: string;
  artistName: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  releaseDate: string;
}

export interface StudioActionCosts {
  ideaAndLyrics: number;
  soundPalette: number;
  videoStoryboard: number;
  fullProject: number;
}

export interface ApiKeys {
    stability: string;
    gemini: string;
    other: string;
}

export interface FooterLinkItem {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterContactItem {
  label: string;
  value: string;
  isLink: boolean;
}

export interface FooterContent {
  description: string;
  artisticProjectNote: string;
  socialLinks: {
    youtube: string;
    globe: string;
  };
  columns: FooterColumn[];
  contactInfo: {
    title: string;
    items: FooterContactItem[];
  };
  copyrightText: string;
  poweredByText: string;
}

export interface SpecializedAgent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  type?: 'chat' | 'code';
}

export interface JasonChatMessage {
  sender: 'user' | 'jason';
  text: string;
}