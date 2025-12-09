
import { AgentState, WorldData } from '../types';
import { toast } from 'react-hot-toast';

// Interface defining the contract for our Music Agent
export interface MusicAgent {
    generateStream(context: string, mood: string): Promise<Partial<AgentState>>;
    syncWithUniverse(worldData: WorldData): Partial<AgentState>;
    injectPrompt(prompt: string): Promise<string>;
}

// The TeO Music Agent Implementation
class TeOMusicAgent implements MusicAgent {
    private _state: AgentState = {
        isActive: false,
        currentMood: 'Neutral',
        lastPrompt: '',
        generationStatus: 'idle',
        parameters: {
            tempo: 120,
            complexity: 50,
            instruments: ['Synth']
        }
    };

    // Simulates the AI "thinking" and generating audio parameters based on text
    async generateStream(context: string, mood: string): Promise<Partial<AgentState>> {
        // In a real scenario, this would call a Generative Audio API (Suno/Stable Audio/MusicLM)
        // For now, we simulate the "Brain" calculation.
        
        console.log(`[MusicAgent] Analyzing context: "${context}" with mood: "${mood}"`);
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const newParams = {
                    tempo: mood === 'High Energy' ? 140 : mood === 'Chill' ? 80 : 110,
                    complexity: Math.floor(Math.random() * 100),
                    instruments: ['Neural Synth', 'Quantum Bass', 'Glitch Percussion']
                };
                
                this._state = {
                    ...this._state,
                    currentMood: mood,
                    parameters: newParams,
                    generationStatus: 'streaming'
                };
                
                resolve(this._state);
            }, 1500); // Simulate processing latency
        });
    }

    // The Bridge: Translates RPG World Data into Music Parameters
    syncWithUniverse(worldData: WorldData): Partial<AgentState> {
        console.log(`[MusicAgent] Syncing with universe location: ${worldData.location}`);
        
        let derivedMood = 'Neutral';
        let instruments = ['Synth'];
        let tempo = 100;

        switch (worldData.location) {
            case 'Crystal Caves':
                derivedMood = 'Ethereal';
                instruments = ['Crystalline Chimes', 'Reverb Pad', 'Sub-Bass'];
                tempo = 70;
                break;
            case 'Neon Slums':
                derivedMood = 'Gritty Industrial';
                instruments = ['Distorted 808', 'Sawtooth Lead', 'Metallic Clangs'];
                tempo = 128;
                break;
            case 'Void Edge':
                derivedMood = 'Dark Ambient';
                instruments = ['Drone', 'Whispers', 'Glitch FX'];
                tempo = 60;
                break;
            default:
                derivedMood = 'Exploratory';
                instruments = ['Arpeggiator', 'Pad'];
        }

        if (worldData.magicDensity === 'High') {
            instruments.push('Magic Sparkle FX');
        }

        return {
            currentMood: derivedMood,
            parameters: {
                tempo,
                complexity: worldData.dangerLevel ? worldData.dangerLevel * 10 : 50,
                instruments
            }
        };
    }

    async injectPrompt(prompt: string): Promise<string> {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(`Understood. Mutating stream based on: "${prompt}". Adjusting oscillators...`);
            }, 800);
        });
    }
}

export const musicAgent = new TeOMusicAgent();
