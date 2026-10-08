/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ViewState, Participant, LocalSessionProfile } from './types';
import { testConnection } from './firebase';
import { 
  fetchParticipants, 
  subscribeParticipants,
  fetchParticipantById, 
  getLocalSession 
} from './services/participantService';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeHero } from './components/HomeHero';
import { ExploreView } from './components/ExploreView';
import { CreateProfileView } from './components/CreateProfileView';
import { ParticipantProfileView } from './components/ParticipantProfileView';
import { MyProfileView } from './components/MyProfileView';
import { QRView } from './components/QRView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'home' });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState<boolean>(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [session, setSession] = useState<LocalSessionProfile | null>(null);
  const [userProfile, setUserProfile] = useState<Participant | null>(null);

  // Parse initial view from URL
  const parseViewFromUrl = useCallback((): ViewState => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const participantParam = searchParams.get('p') || searchParams.get('participant');
      if (participantParam) {
        return { type: 'participant', profileId: participantParam };
      }

      // Check path (e.g. /participant/{id})
      const path = window.location.pathname;
      const participantMatch = path.match(/\/participant\/([a-zA-Z0-9_-]+)/);
      if (participantMatch && participantMatch[1]) {
        return { type: 'participant', profileId: participantMatch[1] };
      }

      // Check hash (e.g. #participant/xyz or #explore)
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('participant/')) {
        const id = hash.replace('participant/', '');
        if (id) return { type: 'participant', profileId: id };
      }
      if (hash === 'explore') return { type: 'explore' };
      if (hash === 'create') return { type: 'create' };
      if (hash === 'my-profile') return { type: 'my-profile' };
      if (hash === 'qr') return { type: 'qr' };

      const viewParam = searchParams.get('view');
      if (viewParam === 'explore') return { type: 'explore' };
      if (viewParam === 'create') return { type: 'create' };
      if (viewParam === 'my-profile') return { type: 'my-profile' };
      if (viewParam === 'qr') return { type: 'qr' };
    } catch (e) {
      console.warn('Error parsing URL view', e);
    }
    return { type: 'home' };
  }, []);

  // Update URL history when navigation changes
  const handleNavigate = useCallback((newView: ViewState) => {
    setCurrentView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const currentUrl = new URL(window.location.href);
      if (newView.type === 'home') {
        currentUrl.pathname = '/';
        currentUrl.search = '';
        currentUrl.hash = '';
      } else if (newView.type === 'participant') {
        currentUrl.pathname = `/participant/${newView.profileId}`;
        currentUrl.search = '';
        currentUrl.hash = '';
      } else if (newView.type === 'qr') {
        currentUrl.pathname = '/';
        currentUrl.search = newView.profileId ? `?view=qr&p=${newView.profileId}` : '?view=qr';
        currentUrl.hash = '';
      } else {
        currentUrl.pathname = '/';
        currentUrl.search = `?view=${newView.type}`;
        currentUrl.hash = '';
      }
      window.history.pushState({}, '', currentUrl.toString());
    } catch (err) {
      console.warn('Failed to push state', err);
    }
  }, []);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      setCurrentView(parseViewFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [parseViewFromUrl]);

  // Load participants from Firestore
  const loadParticipants = useCallback(async () => {
    setIsLoadingParticipants(true);
    setParticipantsError(null);
    try {
      const list = await fetchParticipants();
      setParticipants(list);
    } catch (err) {
      console.error('Failed to load participants:', err);
      setParticipantsError('Unable to connect to the participant directory. Please check network and retry.');
    } finally {
      setIsLoadingParticipants(false);
    }
  }, []);

  // Bootstrapping: Test connection, load session & subscribe to participants
  useEffect(() => {
    // 1. Validate connection to Firestore as required by Firestore skill
    testConnection();

    // 2. Set view from initial URL
    setCurrentView(parseViewFromUrl());

    // 3. Check local session profile
    const savedSession = getLocalSession();
    if (savedSession) {
      setSession(savedSession);
      fetchParticipantById(savedSession.profileId)
        .then((doc) => {
          if (doc) setUserProfile(doc);
        })
        .catch((err) => console.warn('Could not prefetch user profile', err));
    }

    // 4. Real-time subscription to participants directory
    setIsLoadingParticipants(true);
    setParticipantsError(null);
    const unsubscribe = subscribeParticipants(
      (list) => {
        setParticipants(list);
        setIsLoadingParticipants(false);
        setParticipantsError(null);
      },
      (err) => {
        console.error('Participant subscription error:', err);
        setParticipantsError('Unable to connect to the participant directory. Please check network and retry.');
        setIsLoadingParticipants(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [parseViewFromUrl]);

  // When a new profile is created
  const handleProfileCreated = (newParticipant: Participant) => {
    const newSession: LocalSessionProfile = {
      profileId: newParticipant.profileId,
      editToken: newParticipant.editToken || '',
      name: newParticipant.name,
    };
    setSession(newSession);
    setUserProfile(newParticipant);
    // Reload directory list to include the new participant
    loadParticipants();
  };

  // When profile is edited
  const handleProfileUpdated = (updatedParticipant: Participant) => {
    setUserProfile(updatedParticipant);
    if (session) {
      setSession({
        ...session,
        name: updatedParticipant.name,
      });
    }
    // Update local copy in participants list
    setParticipants((prev) =>
      prev.map((p) => (p.profileId === updatedParticipant.profileId ? updatedParticipant : p))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf8ff] text-[#161a33]">
      {/* Official Sticky Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        session={session}
        userPhotoUrl={userProfile?.photoUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20 pb-20 md:pb-0">
        {currentView.type === 'home' && (
          <HomeHero
            participants={participants}
            onNavigate={handleNavigate}
            hasProfile={Boolean(session)}
          />
        )}

        {currentView.type === 'explore' && (
          <ExploreView
            participants={participants}
            isLoading={isLoadingParticipants}
            error={participantsError}
            onNavigate={handleNavigate}
            onRetry={loadParticipants}
          />
        )}

        {currentView.type === 'create' && (
          <CreateProfileView
            onSuccess={handleProfileCreated}
            onNavigate={handleNavigate}
          />
        )}

        {currentView.type === 'participant' && (
          <ParticipantProfileView
            profileId={currentView.profileId}
            onNavigate={handleNavigate}
            currentSessionProfileId={session?.profileId}
          />
        )}

        {currentView.type === 'my-profile' && (
          <MyProfileView
            session={session}
            onNavigate={handleNavigate}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        {currentView.type === 'qr' && (
          <QRView
            session={session}
            targetProfileId={currentView.profileId}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Official Footer */}
      <Footer />
    </div>
  );
}
