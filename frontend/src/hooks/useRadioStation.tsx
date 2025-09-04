// src/hooks/useRadioStation.ts

import { useState } from 'react';
import { useContent } from './useContent';
import toast from 'react-hot-toast';
import { CurrentlyPlayingTrack } from '../types';

const BUCKET_URL = "https://storage.googleapis.com/ai-studio-bucket-457528627948-us-west1/RADIO/";

export const useRadioStation = () => {
    // FIX: Replaced non-existent 'setCurrentTrack' with 'playPlaylist' to correctly interact with the audio player context.
    const { playPlaylist } = useContent(); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAndPlayRadio = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${BUCKET_URL}?prefix=`, {
                headers: {
                    'Content-Type': 'application/xml',
                }
            });

            if (!response.ok) {
                throw new Error(`Kosmiczna komunikacja zawiodła: ${response.statusText}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const contents = xmlDoc.getElementsByTagName('Contents');
            
            const tracks: CurrentlyPlayingTrack[] = [];
            
            Array.from(contents).forEach(content => {
                const key = content.getElementsByTagName('Key')[0]?.textContent;
                
                if (key && (key.endsWith('.mp3') || key.endsWith('.wav'))) {
                    tracks.push({
                        id: `radio_${key.replace(/[^a-zA-Z0-9]/g, "")}`,
                        title: key.replace('.mp3', '').replace('.wav', ''),
                        sourceUrl: `${BUCKET_URL}${key}`,
                        artistName: 'S.M.T. RADIO',
                        releaseTitle: 'Live Transmission',
                        coverImageUrl: 'https://storage.googleapis.com/ai-studio-bucket-457528627948-us-west1/RADIO/radio-cover.jpg',
                    });
                }
            });
            
            if (tracks.length > 0) {
                const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5);
                // FIX: Replaced non-existent 'setCurrentTrack' with 'playPlaylist' to correctly start playback.
                playPlaylist(shuffledTracks);
                toast.success("Połączono z S.M.T. RADIO. Rozpoczynamy transmisję!");
            } else {
                toast.error("W kosmosie panuje cisza. Żadnych utworów do odtworzenia.");
            }

        } catch (e: any) {
            setError(e.message);
            toast.error(`Błąd: ${e.message}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return { fetchAndPlayRadio, isLoading, error };
};