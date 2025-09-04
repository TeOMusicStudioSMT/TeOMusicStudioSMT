

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
// FIX: Changed to a default import as the component is exported as default.
import HomePage from './pages/HomePage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistProfilePage from './pages/ArtistProfilePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import VIPLoungePage from './pages/VIPLoungePage';
import StudioPage from './pages/StudioPage';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import ArchivesPage from './pages/ArchivesPage';
import ConstellationPage from './pages/ConstellationPage';
import StaticPage from './pages/StaticPage';
import TottCatalogPage from './pages/TottCatalogPage';
import PlaylistsPage from './pages/PlaylistsPage';
import NewsArchivePage from './pages/NewsArchivePage';
import NewsArticlePage from './pages/NewsArticlePage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import CheckoutPage from './pages/CheckoutPage';
import TeoAppPage from './pages/TeoAppPage';
import StorePage from './pages/StorePage';
import MyProjectsPage from './pages/MyProjectsPage';
import VideosPage from './pages/VideosPage';
import MyAccountPage from './pages/MyAccountPage';
import MyPlaylistsPage from './pages/MyPlaylistsPage';
import UserPlaylistDetailPage from './pages/UserPlaylistDetailPage';


// Admin Imports
import AdminLoginPage from './pages/admin/AdminLoginPage';
import ProtectedRoute from './pages/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminArtistsListPage from './pages/admin/AdminArtistsListPage';
import AdminArtistEditPage from './pages/admin/AdminArtistEditPage';
import AdminNewsListPage from './pages/admin/AdminNewsListPage';
import AdminNewsEditPage from './pages/admin/AdminNewsEditPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminArchivesListPage from './pages/admin/AdminArchivesListPage';
import AdminArchiveEditPage from './pages/admin/AdminArchiveEditPage';
import AdminPagesListPage from './pages/admin/AdminPagesListPage';
import AdminPageEditPage from './pages/admin/AdminPageEditPage';
import AdminUsersListPage from './pages/admin/AdminUsersListPage';
import AdminUserEditPage from './pages/admin/AdminUserEditPage';
import AdminUserCreatePage from './pages/admin/AdminUserCreatePage';
import AdminCurationPage from './pages/admin/AdminCurationPage';
import AdminConstellationListPage from './pages/admin/AdminConstellationListPage';
import AdminConstellationEditPage from './pages/admin/AdminConstellationEditPage';
import AdminSpotlightPage from './pages/admin/AdminSpotlightPage';
import AdminPlaylistsListPage from './pages/admin/AdminPlaylistsListPage';
import AdminPlaylistEditPage from './pages/admin/AdminPlaylistEditPage';
import AdminAssetVaultPage from './pages/admin/AdminAssetVaultPage';
import AdminTrendingPage from './pages/admin/AdminTrendingPage';
import AdminAppsListPage from './pages/admin/AdminAppsListPage';
import AdminAppEditPage from './pages/admin/AdminAppEditPage';
import AdminFriendArtistsListPage from './pages/admin/AdminFriendArtistsListPage';
import AdminFriendArtistEditPage from './pages/admin/AdminFriendArtistEditPage';
import JasonDashboardPage from './pages/admin/JasonDashboardPage';
import AdminVideosListPage from './pages/admin/AdminVideosListPage';
import AdminVideoEditPage from './pages/admin/AdminVideoEditPage';
import AdminAccountingPage from './pages/admin/AdminAccountingPage';
import AdminPermissionsPage from './pages/admin/AdminPermissionsPage';
import AdminApiGatewayPage from './pages/admin/AdminApiGatewayPage';
import AdminFooterEditPage from './pages/admin/AdminFooterEditPage';
import AdminCodeEditorPage from './pages/admin/AdminCodeEditorPage';
import AdminContentManagerPage from './pages/admin/AdminContentManagerPage';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <ContentProvider>
        <ReactRouterDOM.HashRouter>
          <Toaster toastOptions={{
            style: {
              background: '#242038',
              color: '#F0F0F0',
            }
          }}/>
          <ReactRouterDOM.Routes>
            {/* Public Routes */}
            <ReactRouterDOM.Route path="/" element={<Layout />}>
              <ReactRouterDOM.Route index element={<HomePage />} />
              <ReactRouterDOM.Route path="artists" element={<ArtistsPage />} />
              <ReactRouterDOM.Route path="artists/:artistId" element={<ArtistProfilePage />} />
              <ReactRouterDOM.Route path="image-generator" element={<ArchivesPage />} />
              <ReactRouterDOM.Route path="constellation" element={<ConstellationPage />} />
              <ReactRouterDOM.Route path="tott-catalog" element={<TottCatalogPage />} />
              <ReactRouterDOM.Route path="playlists" element={<PlaylistsPage />} />
              <ReactRouterDOM.Route path="videos" element={<VideosPage />} />
              <ReactRouterDOM.Route path="news" element={<NewsArchivePage />} />
              <ReactRouterDOM.Route path="news/:newsIndex" element={<NewsArticlePage />} />
              <ReactRouterDOM.Route path="signin" element={<SignInPage />} />
              <ReactRouterDOM.Route path="signup" element={<SignUpPage />} />
              <ReactRouterDOM.Route path="vip-lounge" element={<VIPLoungePage />} />
              <ReactRouterDOM.Route path="studio" element={<StudioPage />} />
              <ReactRouterDOM.Route path="apps" element={<TeoAppPage />} />
              <ReactRouterDOM.Route path="chat" element={<ChatPage />} />
              <ReactRouterDOM.Route path="store" element={<StorePage />} />
              <ReactRouterDOM.Route path="my-projects" element={<MyProjectsPage />} />
              <ReactRouterDOM.Route path="my-playlists" element={<MyPlaylistsPage />} />
              <ReactRouterDOM.Route path="my-playlists/:playlistId" element={<UserPlaylistDetailPage />} />
              <ReactRouterDOM.Route path="my-account" element={<MyAccountPage />} />
              <ReactRouterDOM.Route path="subscriptions" element={<SubscriptionsPage />} />
              <ReactRouterDOM.Route path="checkout" element={<CheckoutPage />} />
              <ReactRouterDOM.Route path="about" element={<StaticPage pageId="about" />} />
              <ReactRouterDOM.Route path="support" element={<StaticPage pageId="support" />} />
              <ReactRouterDOM.Route path="press" element={<StaticPage pageId="press" />} />
              <ReactRouterDOM.Route path="privacy" element={<StaticPage pageId="privacy" />} />
              <ReactRouterDOM.Route path="terms" element={<StaticPage pageId="terms" />} />
              <ReactRouterDOM.Route path="cookies" element={<StaticPage pageId="cookies" />} />
              <ReactRouterDOM.Route path="dmca" element={<StaticPage pageId="dmca" />} />
              <ReactRouterDOM.Route path="*" element={<NotFoundPage />} />
            </ReactRouterDOM.Route>

            {/* Admin Routes */}
            <ReactRouterDOM.Route path="/admin/login" element={<AdminLoginPage />} />
            <ReactRouterDOM.Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
               <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="jason-dashboard" replace />} />
               <ReactRouterDOM.Route path="jason-dashboard" element={<JasonDashboardPage />} />
               <ReactRouterDOM.Route path="content-manager" element={<AdminContentManagerPage />} />
               <ReactRouterDOM.Route path="artists" element={<AdminArtistsListPage />} />
               <ReactRouterDOM.Route path="artists/:artistId/edit" element={<AdminArtistEditPage />} />
               <ReactRouterDOM.Route path="friends" element={<AdminFriendArtistsListPage />} />
               <ReactRouterDOM.Route path="friends/new" element={<AdminFriendArtistEditPage />} />
               <ReactRouterDOM.Route path="friends/:friendId/edit" element={<AdminFriendArtistEditPage />} />
               <ReactRouterDOM.Route path="news" element={<AdminNewsListPage />} />
               <ReactRouterDOM.Route path="news/new" element={<AdminNewsEditPage />} />
               <ReactRouterDOM.Route path="news/:newsIndex/edit" element={<AdminNewsEditPage />} />
               <ReactRouterDOM.Route path="gallery" element={<AdminArchivesListPage />} />
               <ReactRouterDOM.Route path="gallery/new" element={<AdminArchiveEditPage />} />
               <ReactRouterDOM.Route path="gallery/:archiveIndex/edit" element={<AdminArchiveEditPage />} />
               <ReactRouterDOM.Route path="constellation" element={<AdminConstellationListPage />} />
               <ReactRouterDOM.Route path="constellation/new" element={<AdminConstellationEditPage />} />
               <ReactRouterDOM.Route path="constellation/:itemId/edit" element={<AdminConstellationEditPage />} />
               <ReactRouterDOM.Route path="spotlight" element={<AdminSpotlightPage />} />
               <ReactRouterDOM.Route path="videos" element={<AdminVideosListPage />} />
               <ReactRouterDOM.Route path="videos/new" element={<AdminVideoEditPage />} />
               <ReactRouterDOM.Route path="videos/:videoId/edit" element={<AdminVideoEditPage />} />
               <ReactRouterDOM.Route path="trending" element={<AdminTrendingPage />} />
               <ReactRouterDOM.Route path="playlists" element={<AdminPlaylistsListPage />} />
               <ReactRouterDOM.Route path="playlists/new" element={<AdminPlaylistEditPage />} />
               <ReactRouterDOM.Route path="playlists/:playlistId/edit" element={<AdminPlaylistEditPage />} />
               <ReactRouterDOM.Route path="asset-vault" element={<AdminAssetVaultPage />} />
               <ReactRouterDOM.Route path="apps" element={<AdminAppsListPage />} />
               <ReactRouterDOM.Route path="apps/new" element={<AdminAppEditPage />} />
               <ReactRouterDOM.Route path="apps/:appId/edit" element={<AdminAppEditPage />} />
               <ReactRouterDOM.Route path="pages" element={<AdminPagesListPage />} />
               <ReactRouterDOM.Route path="pages/:pageId/edit" element={<AdminPageEditPage />} />
               <ReactRouterDOM.Route path="footer/edit" element={<AdminFooterEditPage />} />
               <ReactRouterDOM.Route path="users" element={<AdminUsersListPage />} />
               <ReactRouterDOM.Route path="users/new" element={<AdminUserCreatePage />} />
               <ReactRouterDOM.Route path="users/:userEmail/edit" element={<AdminUserEditPage />} />
               <ReactRouterDOM.Route path="curation" element={<AdminCurationPage />} />
               <ReactRouterDOM.Route path="accounting" element={<AdminAccountingPage />} />
               <ReactRouterDOM.Route path="settings" element={<AdminSettingsPage />} />
               <ReactRouterDOM.Route path="permissions" element={<AdminPermissionsPage />} />
               <ReactRouterDOM.Route path="api-gateway" element={<AdminApiGatewayPage />} />
               <ReactRouterDOM.Route path="code-assistant" element={<AdminCodeEditorPage />} />
            </ReactRouterDOM.Route>
          </ReactRouterDOM.Routes>
        </ReactRouterDOM.HashRouter>
      </ContentProvider>
    </AuthProvider>
  );
};

export default App;