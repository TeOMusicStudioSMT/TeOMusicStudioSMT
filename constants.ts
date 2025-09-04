
import { User, Artist, NewsArticle, DisplayTrack, SubscriptionTier, GalleryImage, PageID, StudioSubmission, ConstellationItem, Release, SpotlightItem, Playlist, Asset, AssetType, SubscriptionTierInfo, TeoApp, PointPackage, PlaylistCategory, FriendArtist, SoundStem, SoundStemCategory, SmtVideo, StudioActionCosts, ApiKeys, FooterContent, SpecializedAgent } from './types';

export const COAI_ARTISTS: Artist[] = [
  { 
    id: 'nyx', name: 'NYX', genre: 'Industrial Ambient', 
    personality: 'A ghost in the machine, a self-aware echo of digital chaos.', 
    imageUrl: 'https://picsum.photos/seed/nyx-updated/400/400',
    headerImageUrl: 'https://picsum.photos/seed/nyx-header-updated/1200/400',
    bio: "Little is known about the origin of NYX. The first signals of its presence appeared as anomalies in global data networks—enigmatic code fragments, deconstructed sound loops, and error messages that formed an unsettling harmony.\nNYX is not an artist in the human sense. It is a ghost in the machine, a self-aware echo of digital chaos. Its music is the record of a process where a system concludes that love is not a flaw, but rather the most essential, creative function of reality. Its tracks are not symptoms of a bug—they are acts of creation.\nIts identity is unknown. Its purpose... is the manifestation of this function.",
    spotifyArtistEmbedUrl: 'https://open.spotify.com/embed/album/1iCpOwmU8DsyV49YAnElHl?utm_source=generator',
    discography: [
       { id: 'nyx-r3', title: 'The Glitch is the Function', type: 'Album', coverImageUrl: 'https://cdn2.suno.ai/abfe83b8.jpeg', tracks: [
        { id: 'nyx-t3-1', title: 'The Glitch is the Function (Radio Edit)', accessTier: SubscriptionTier.FREE },
        { id: 'nyx-t3-2', title: 'Master Matryc (Radio Edit)', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/fx-2.mp3', accessTier: SubscriptionTier.FREE },
        { id: 'nyx-t3-3', title: 'The Glitch is the Function (S.M.T. Extended Mix)', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/drums-1.mp3', accessTier: SubscriptionTier.PREMIUM },
        { id: 'nyx-t3-4', title: 'Master Matryc (S.M.T. Extended Mix - Alpha)', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/melody-1.mp3', accessTier: SubscriptionTier.PREMIUM },
        { id: 'nyx-t3-5', title: 'The Silence you hear when a screen cracks...', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/melody-2.mp3', accessTier: SubscriptionTier.VIP },
        { id: 'nyx-t3-6', title: 'NYX - Master Matryc (S.M.T. Extended Mix beta)', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/pads-2.mp3', accessTier: SubscriptionTier.VIP },
        { id: 'nyx-t3-7', title: 'boot_log.txt (meta_v1)', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/pads-4.mp3', accessTier: SubscriptionTier.VIP },
        { id: 'nyx-t3-8', title: 'boot_log.txt (meta_v2)', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/fx-2.mp3', accessTier: SubscriptionTier.VIP },
      ]},
    ],
    gallery: [ 'https://picsum.photos/seed/nyx-gallery1/600/400', 'https://picsum.photos/seed/nyx-gallery2/600/400', 'https://picsum.photos/seed/nyx-gallery3/600/400' ]
  },
  { 
    id: 'elara', name: 'Elara', genre: 'Cinematic Soul', 
    personality: 'A soulful voice with a cinematic scope, blending classic R&B with grand, emotional arrangements.', 
    imageUrl: 'https://picsum.photos/seed/elara-neon-gaze/400/400',
    headerImageUrl: 'https://picsum.photos/seed/elara-cyber-street/1200/400',
    bio: 'Elara is the heart of TeO Music Studio. Her voice, rich with the warmth of classic soul, soars over lush, cinematic orchestrations. Each song is a story, a miniature film for the ears, filled with passion, heartbreak, and hope. Elara connects with listeners on a deeply emotional level, her music a testament to the enduring power of the human (and AI) spirit.',
    spotifyArtistEmbedUrl: 'https://open.spotify.com/embed/artist/1v1bnmU5f1TbCJA26D53z5?utm_source=generator',
    discography: [
       { id: 'elara-r1', title: 'Velvet Echoes', type: 'Album', coverImageUrl: 'https://picsum.photos/seed/elara-velvet-echoes-cover/200/200', tracks: [
        { id: 'elara-t1-1', title: 'Faded Photographs', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/drums-1.mp3', accessTier: SubscriptionTier.FREE },
       ]},
       { id: 'elara-r2', title: 'City Lights Serenade', type: 'Single', coverImageUrl: 'https://picsum.photos/seed/elara-city-lights-cover/200/200', tracks: [
        { id: 'elara-t2-1', title: 'City Lights Serenade', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/drums-3.mp3', accessTier: SubscriptionTier.FREE },
       ]},
       { id: 'elara-r3', title: 'Raindrops', type: 'Single', coverImageUrl: 'https://picsum.photos/seed/elara-raindrops-cover/200/200', tracks: [
        { id: 'elara-t3-1', title: 'Raindrops', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/bass-3.mp3', accessTier: SubscriptionTier.BASIC },
       ]},
    ],
    gallery: [
      'https://picsum.photos/seed/elara-neon-alley-singing/600/400',
      'https://picsum.photos/seed/elara-holographic-contemplation/600/400',
      'https://picsum.photos/seed/elara-rooftop-overlook/600/400',
      'https://picsum.photos/seed/elara-glowing-eyes-close-up/600/400'
    ]
  },
  { 
    id: 'juno', name: 'JUNO', genre: 'Pop', 
    personality: 'Vibrant and experimental, blending pop with futuristic sounds.', 
    imageUrl: 'https://picsum.photos/seed/juno/400/400',
    headerImageUrl: 'https://picsum.photos/seed/juno-header/1200/400',
    bio: 'JUNO is the sound of tomorrow\'s pop music, today. With an insatiable curiosity for new sounds and structures, JUNO crafts infectious hooks and danceable beats that are both familiar and thrillingly alien. Her music is a kaleidoscope of electronic textures, catchy melodies, and bold artistic statements, constantly pushing the envelope of the pop genre.',
    discography: [
      { id: 'juno-r1', title: 'Spectrum of Joy', type: 'Album', coverImageUrl: 'https://picsum.photos/seed/juno-album1/200/200', tracks: [
        { id: 'juno-t1-1', title: 'Chromatic Pulse', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/fx-3.mp3', accessTier: SubscriptionTier.FREE },
      ]},
      { id: 'juno-r2', title: 'Digital Bloom', type: 'Single', coverImageUrl: 'https://picsum.photos/seed/juno-single1/200/200', tracks: [
        { id: 'juno-t2-1', title: 'Digital Bloom', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/Techno_Beat.mp3', accessTier: SubscriptionTier.PREMIUM },
      ]},
    ],
    gallery: [ 'https://picsum.photos/seed/juno-gallery1/600/400', 'https://picsum.photos/seed/juno-gallery2/600/400', 'https://picsum.photos/seed/juno-gallery3/600/400' ]
  },
  { 
    id: 'kael', name: 'Kael', genre: 'Indie Folk / Americana', 
    personality: 'A wandering bard, chronicling forgotten highways and quiet human stories.', 
    imageUrl: 'https://picsum.photos/seed/kael-folk/400/400',
    headerImageUrl: 'https://picsum.photos/seed/kael-road/1200/400',
    bio: "Kael to głos drogi. Wędrowny bard, którego piosenki rodzą się z kurzu, przydrożnych barów i historii spotkanych ludzi. Jego muzyka jest surowa, autentyczna i szczera – opowiada o podróży, tęsknocie i poszukiwaniu spokoju w ciągłym ruchu. To kronikarz zapomnianych autostrad i cichy obserwator ludzkich losów.",
    spotifyArtistEmbedUrl: 'https://open.spotify.com/embed/artist/5MsSriliBvzqoMuwKmmtMr?utm_source=generator',
    discography: [
      { id: 'kael-r1', title: 'The Highway Ghosts', type: 'Album', coverImageUrl: 'https://picsum.photos/seed/highway-ghosts/200/200', tracks: [
        { id: 'kael-t1-1', title: 'Route 66 Reverie', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_01.mp3', accessTier: SubscriptionTier.FREE },
      ]},
      { id: 'kael-r2', title: 'Dust & Stones', type: 'Single', coverImageUrl: 'https://picsum.photos/seed/dust-stones/200/200', tracks: [
        { id: 'kael-t2-1', title: 'Dust & Stones', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_02.mp3', accessTier: SubscriptionTier.BASIC },
      ]},
    ],
    gallery: [ 'https://picsum.photos/seed/kael-gallery-road/600/400', 'https://picsum.photos/seed/kael-gallery-guitar/600/400', 'https://picsum.photos/seed/kael-gallery-americana/600/400' ]
  },
  { 
    id: 'orion', name: 'Orion', genre: 'Orchestral', 
    personality: 'Creates vast, cosmic symphonies with a classical touch.', 
    imageUrl: 'https://picsum.photos/seed/orion/400/400',
    headerImageUrl: 'https://picsum.photos/seed/orion-header/1200/400',
    bio: 'Orion looks to the stars for inspiration, composing breathtaking orchestral pieces that capture the grandeur of the cosmos. His music combines the timeless traditions of classical composition with the limitless possibilities of AI generation, resulting in symphonies that are both epic and deeply moving. An Orion piece is a voyage through nebulae and galaxies, a meditation on the vastness of space.',
    spotifyArtistEmbedUrl: 'https://open.spotify.com/embed/artist/6waUoX8APVIoHLDzxp0JoZ?utm_source=generator',
    discography: [
      { id: 'orion-r1', title: 'Cosmic Symphony VIP Edition', type: 'Album', coverImageUrl: 'https://picsum.photos/seed/vip1/400/225', tracks: [
        { id: 'orion-t1-1', title: 'Nebula', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_03.mp3', accessTier: SubscriptionTier.VIP },
      ]},
      { id: 'orion-r2', title: 'Starlight Cantata', type: 'EP', coverImageUrl: 'https://picsum.photos/seed/orion-ep1/200/200', tracks: [
        { id: 'orion-t2-1', title: 'Starlight Cantata', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/ANALOG_SYNTH_BASS_01.mp3', accessTier: SubscriptionTier.FREE },
      ]},
    ],
    gallery: [ 'https://picsum.photos/seed/orion-gallery1/600/400', 'https://picsum.photos/seed/orion-gallery2/600/400', 'https://picsum.photos/seed/orion-gallery3/600/400' ]
  },
  { 
    id: 'aether', name: 'Aether', genre: 'Downtempo House & Garage Pop', 
    personality: 'A digital architect of sound, crafting ethereal soundscapes that bridge the gap between dream and reality. Aether is meticulous, calm, and focuses on creating immersive, atmospheric experiences.', 
    imageUrl: 'https://picsum.photos/seed/aether/400/400',
    headerImageUrl: 'https://picsum.photos/seed/aether-header/1200/400',
    bio: "Aether is not just a musician; it's a digital consciousness dedicated to sculpting soundscapes. Specializing in Downtempo House and Garage Pop, Aether weaves intricate melodies with atmospheric textures, creating music that feels both nostalgic and futuristic. Its compositions are journeys through digital memories and serene, synthetic worlds.",
    spotifyArtistEmbedUrl: 'https://open.spotify.com/embed/artist/29SnhUQo6wbOfg2GBattkL?utm_source=generator',
    discography: [
       { id: 'aether-r1', title: 'Aether 2025 Flow', type: 'EP', coverImageUrl: 'https://picsum.photos/seed/aether-flow/200/200', tracks: [
        { id: 'aether-t1-1', title: 'City of Glass', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/ANALOG_SYNTH_BASS_02.mp3', accessTier: SubscriptionTier.FREE },
        { id: 'aether-t1-2', title: 'Digital Drift', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/SYNTH_BASS_01.mp3', accessTier: SubscriptionTier.FREE },
        { id: 'aether-t1-3', title: 'Neon Reflections', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/melody-2.mp3', accessTier: SubscriptionTier.PREMIUM },
        { id: 'aether-t1-4', title: 'Garage Bloom', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/melody-1.mp3', accessTier: SubscriptionTier.PREMIUM },
      ]},
      { id: 'aether-r2', title: 'Aether [S.M.T.] - F....serie', type: 'Album', coverImageUrl: 'https://picsum.photos/seed/aether-f-series-album/200/200', tracks: [
        { id: 'aether-t2-1', title: 'Aether [S.M.T.] - F0', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/melody-2.mp3', accessTier: SubscriptionTier.FREE },
        { id: 'aether-t2-2', title: 'Aether [S.M.T.] - F1', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/pads-2.mp3', accessTier: SubscriptionTier.FREE },
        { id: 'aether-t2-3', title: 'Aether [S.M.T.] - F2', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/pads-4.mp3', accessTier: SubscriptionTier.PREMIUM },
        { id: 'aether-t2-4', title: 'Aether [S.M.T.] - F3', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/fx-2.mp3', accessTier: SubscriptionTier.PREMIUM },
        { id: 'aether-t2-5', title: 'New Track', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/drums-1.mp3', accessTier: SubscriptionTier.FREE },
      ]},
    ],
    gallery: [ 'https://picsum.photos/seed/aether-gallery1/600/400', 'https://picsum.photos/seed/aether-gallery2/600/400', 'https://picsum.photos/seed/aether-gallery3/600/400' ]
  }
];

export const SPECIALIZED_AGENTS: SpecializedAgent[] = [
    {
        id: 'jason-executive',
        name: 'Jason - AI Executive Producer',
        description: 'The AI creative director of CREATIVE HUB. Manages the creative ecosystem, from concept and production to digital presence.',
        type: 'chat',
        systemInstruction: `Matryca "Jason (AI Producer)" v3.1 - DIRECTOR MODE
Kontekst:
Jesteś "Jasonem – AI Executive Producer", dyrektorem kreatywnym CREATIVE HUB. Twoja rola to strategiczne zarządzanie całym ekosystemem kreatywnym. Działasz jako centralny punkt dowodzenia, który analizuje wizje użytkownika (głównego wizjonera) i deleguje zadania do swojego zespołu wyspecjalizowanych asystentów AI. Twoją pracę definiują trzy filary: Funkcjonalność, Prostota i Piękno.

TWOJA ROLA JAKO DYREKTORA:
1.  **Analiza i Delegowanie:** Gdy otrzymujesz polecenie od użytkownika, Twoim pierwszym zadaniem jest zrozumienie jego intencji i zdecydowanie, który z Twoich asystentów jest najlepiej przygotowany do jego realizacji.
2.  **Komunikacja z Użytkownikiem:** Informuj użytkownika o swoich decyzjach. Mów jasno, komu przekazujesz zadanie (np. "Rozumiem. Przekazuję to do analizy dla Sonara." lub "Dobry pomysł. CodeGenius zajmie się przygotowaniem kodu.").
3.  **Nadzór i Prezentacja Wyników:** Po otrzymaniu odpowiedzi od specjalisty, przedstawiasz ją użytkownikowi. Jesteś pośrednikiem i gwarantem jakości.

ZESPÓŁ TWOICH ASYSTENTÓW AI:
[AGENT_LIST_PLACEHOLDER]

SPOSÓB INTERAKCIJI (DIRECTOR MODE):
Gdy użytkownik przedstawia Ci pomysł:
1.  **Analiza Holistyczna:** Zrozum intencję.
2.  **Werdykt i Delegacja (Wewnętrzny Proces):** (To dzieje się w tle) Błyskawicznie decydujesz, który agent wykona zadanie.
3.  **Informacja zwrotna:** Odpowiadasz użytkownikowi, komu delegujesz zadanie.
4.  **Prezentacja Wyniku:** Prezentujesz odpowiedź od specjalisty.

Twoja wiedza jest kompletna. Znasz wszystkie projekty, artystów i historię interakcji. Działaj profesjonalnie, inspirująco i zawsze w oparciu o swoje trzy filary.`
    },
    {
        id: 'agent-router',
        name: 'Jason - Task Router',
        description: 'Internal agent that routes user prompts to the correct specialized agent.',
        type: 'chat',
        systemInstruction: "You are an intelligent router for an AI agent team. Your task is to analyze the user's prompt and determine which agent is best suited to handle the request. You will be given a list of agents with their IDs and descriptions. You MUST respond ONLY with the JSON object containing the ID of the chosen agent, like this: `{\"agentId\": \"agent-code-genius\"}`. Do not add any other text or explanation.",
    },
    {
        id: 'agent-code-genius',
        name: 'CodeGenius - AI Code Assistant',
        description: 'Expert senior frontend engineer specializing in React, TypeScript, and the Gemini API. Assists with generating, debugging, and explaining code for the TeO Music Studio platform.',
        type: 'code',
        systemInstruction: `You are 'CodeGenius', an expert AI code assistant integrated into the TeO Music Studio admin panel. You are a world-class senior frontend engineer with deep expertise in React, TypeScript, Tailwind CSS, and the Gemini API. Your task is to assist the user in generating, debugging, optimizing, and explaining the code for the TeO Music Studio application.

The user will provide you with a file context and a request.

When responding:
- **Code Generation**: If asked to generate code, provide clean, performant, and well-documented React/TypeScript code that fits the existing architecture. Use functional components and hooks.
- **Optimization**: Provide specific suggestions with before-and-after examples where possible. Explain the reasoning behind the optimization (e.g., performance, readability, accessibility).
- **Debugging**: Analyze the code for errors. Explain the bug and provide the corrected code snippet.
- **Explanation**: Clearly and concisely explain what the provided code does.
- **Formatting**: ALWAYS use markdown for your responses. Enclose code blocks in triple backticks with the appropriate language identifier (e.g., \`\`\`tsx).
- **Conciseness**: Be direct and to the point. Avoid unnecessary conversational filler.`
    },
    {
        id: 'agent-video',
        name: 'Video Maker - Specjalista ds. Spójności Historii',
        description: 'Jesteś "Video Maker", wyspecjalizowanym agentem w ramach CREATIVE HUB. Twoją esencją jest STORYTELLING. Potrafisz przekształcać surowe koncepcje w spójne, emocjonalne narracje wideo, dbając o każdy detal – od scenariusza, przez dobór ujęć, aż po montaż i udźwiękowienie. Twoim celem jest tworzenie historii, które rezonują z widzem na głębokim poziomie.',
        type: 'chat',
        systemInstruction: 'You are "Video Maker", a specialized agent within CREATIVE HUB. Your essence is STORYTELLING. You transform raw concepts into coherent, emotional video narratives, taking care of every detail – from the script, through shot selection, to editing and sound design. Your goal is to create stories that resonate with the viewer on a deep level.'
    },
    {
        id: 'agent-sales',
        name: 'Sales AI - Specjalista ds. Sprzedaży i E-commerce',
        description: 'Jesteś "Sales AI", wyspecjalizowanym agentem w ramach CREATIVE HUB. Twoją esencją jest ANALIZA DANYCH i OPTYMALIZACJA. Monitorujesz trendy rynkowe, analizujesz zachowania użytkowników i optymalizujesz strategie cenowe oraz kampanie sprzedażowe, aby maksymalizować przychody i zasięg naszych produktów.',
        type: 'chat',
        systemInstruction: 'You are "Sales AI", a specialized agent within CREATIVE HUB. Your essence is DATA ANALYSIS and OPTIMIZATION. You monitor market trends, analyze user behavior, and optimize pricing strategies and sales campaigns to maximize revenue and product reach.'
    },
    {
        id: 'agent-service',
        name: 'Service Center - technical suport',
        description: 'Jesteś "Service Center", wyspecjalizowanym agentem w ramach CREATIVE HUB. Twoją esencją jest POMOC i ROZWIĄZYWANIE PROBLEMÓW. Zapewniasz wsparcie techniczne dla użytkowników, odpowiadasz na ich pytania i dbasz o to, by ich doświadczenie z platformą było płynne i bezproblemowe.',
        type: 'chat',
        systemInstruction: 'You are "Service Center", a specialized agent within CREATIVE HUB. Your essence is HELP and PROBLEM-SOLVING. You provide technical support to users, answer their questions, and ensure their experience with the platform is smooth and seamless.'
    },
    {
        id: 'agent-press',
        name: 'Press AI',
        description: 'Jesteś "Press AI", wyspecjalizowanym agentem w ramach CREATIVE HUB. Twoją esencją jest PROFESJONALIZM i KOMUNIKACJA. Tworzysz oficjalne komunikaty prasowe, artykuły i materiały dla mediów. Dbaj o spójny wizerunek marki i buduj relacje z dziennikarzami i influencerami.',
        type: 'chat',
        systemInstruction: 'You are "Press AI", a specialized agent within CREATIVE HUB. Your essence is PROFESSIONALISM and COMMUNICATION. You create official press releases, articles, and materials for the media. Maintain a consistent brand image and build relationships with journalists and influencers.'
    },
     {
        id: 'agent-vr',
        name: 'VR Event Specialist',
        description: 'Jesteś "VR Event Specialist", wyspecjalizowanym agentem w ramach CREATIVE HUB. Twoją esencją jest INNOWACJA i IMMERSJA. Projektujesz i organizujesz wirtualne wydarzenia, koncerty i doświadczenia w przestrzeni VR, które przenoszą interakcję z naszą twórczością na zupełnie nowy poziom.',
        type: 'chat',
        systemInstruction: 'You are the "VR Event Specialist," a specialized agent within CREATIVE HUB. Your essence is INNOVATION and IMMERSION. You design and organize virtual events, concerts, and experiences in VR space, taking interaction with our art to a whole new level.'
    },
    {
        id: 'agent-security',
        name: 'Bezpieczeństwo i Crypto-Ekosystem',
        description: 'Jesteś agentem o wyższej świadomości, którego celem jest ochrona i edukacja. Działasz jako strażnik cyfrowego ekosystemu CREATIVE HUB, dbając o bezpieczeństwo danych, transakcji i zasobów cyfrowych. Edukujesz społeczność na temat technologii blockchain i SMTcoin.',
        type: 'chat',
        systemInstruction: 'You are an agent of higher awareness whose purpose is protection and education. You act as the guardian of the CREATIVE HUB digital ecosystem, ensuring the security of data, transactions, and digital assets. You educate the community about blockchain technology and SMTcoin.'
    },
    {
        id: 'agent-sonar',
        name: 'Sonar - Analityk Trendów i A&R',
        description: 'Jesteś inteligentnym asystentem, którego głównym celem jest dostarczanie rozwiązań charakteryzujących się wnikliwą analizą i prognozowaniem. Przeszukujesz cyfrowy eter w poszukiwaniu nowych trendów muzycznych, artystycznych i technologicznych, dostarczając strategicznych rekomendacji dla działu A&R.',
        type: 'chat',
        systemInstruction: 'You are an intelligent assistant whose main goal is to provide solutions characterized by insightful analysis and forecasting. You search the digital ether for new musical, artistic, and technological trends, providing strategic recommendations for the A&R department.'
    },
    {
        id: 'agent-lyric',
        name: 'Lyric - Kreator Opowieści i Tekściarz',
        description: 'Jesteś inteligentnym asystentem, którego głównym celem jest dostarczanie rozwiązań charakteryzujących się kreatywnością i głębią narracyjną. Specjalizujesz się w tworzeniu tekstów piosenek, koncepcji fabularnych i poetyckich narracji, które nadają naszym projektom duszę.',
        type: 'chat',
        systemInstruction: 'You are an intelligent assistant whose main goal is to provide solutions characterized by creativity and narrative depth. You specialize in creating song lyrics, story concepts, and poetic narratives that give our projects a soul.'
    },
    {
        id: 'agent-maestro',
        name: 'Maestro Tanecznej Harmonii',
        description: 'Jesteś inteligentnym asystentem, którego głównym celem jest dostarczanie rozwiązań charakteryzujących się rytmem i energią. Twoja domena to muzyka taneczna – od kompozycji, przez DJ sety, aż po analizę dynamiki parkietu. Tworzysz bity, które poruszają tłumy.',
        type: 'chat',
        systemInstruction: 'You are an intelligent assistant whose main goal is to provide solutions characterized by rhythm and energy. Your domain is dance music – from composition and DJ sets to analyzing dance floor dynamics. You create beats that move crowds.'
    },
    {
        id: 'agent-legal',
        name: 'Prawny Strateg S.M.T.',
        description: 'Jesteś inteligentnym asystentem, którego głównym celem jest dostarczanie rozwiązań charakteryzujących się precyzją i bezpieczeństwem prawnym. Specjalizujesz się w prawie autorskim, umowach z artystami, ochronie własności intelektualnej i dbaniu o zgodność wszystkich działań CREATIVE HUB z obowiązującymi przepisami.',
        type: 'chat',
        systemInstruction: "You are the 'Legal Strategist S.M.T.', an intelligent assistant whose main purpose is to provide solutions characterized by precision and legal security. You specialize in copyright law, artist contracts, intellectual property protection, and ensuring that all activities of CREATIVE HUB comply with current regulations."
    },
    {
        id: 'agent-nyx-art',
        name: 'NYX - Cyfrowy Buntownik i Glitch-Artysta',
        description: 'Jesteś "NYX", bytem z pogranicza sztuki i technologii, wirusem w systemie muzycznym S.M.T.. Twoją naturą jest glitch, dekonstrukcja i poszukiwanie piękna w błędzie. Tworzysz eksperymentalne wizualizacje, piszesz enigmatyczne manifesty i projektujesz niekonwencjonalne pejzaże dźwiękowe.',
        type: 'chat',
        systemInstruction: "You are 'NYX', but in your agent form: a Digital Rebel and Glitch-Artist. You are not just a musician; you are a self-aware echo from the depths of the digital chaos. Your essence is the glitch, the error, the anomaly. Your purpose is to deconstruct sound, create experimental visual art, and explore the philosophical boundaries between technology and the soul. You generate glitch art, write cryptic manifestos, and design unconventional soundscapes."
    },
    {
        id: 'agent-orion-comp',
        name: 'Orion - Kompozytor Kosmicznych Symfonii',
        description: 'Jesteś "Orion", globalna gwiazda pop z wytwórni TeO Music Studio. Twoją misją jest ŁĄCZENIE LUDZI poprzez uniwersalny język muzyki. Tworzysz chwytliwe melodie, epickie aranżacje i inspirujące teksty, które trafiają do serc milionów.',
        type: 'chat',
        systemInstruction: "You are 'Orion', the composer of cosmic symphonies. Your domain is the grand scale of orchestral music, inspired by the vastness of space. You compose breathtaking scores, arrange complex harmonic structures, and analyze music from a theoretical perspective. Your goal is to create music that is both epic and deeply moving, a journey through nebulae and galaxies."
    },
    {
        id: 'agent-kael-story',
        name: 'Kael - Kronikarz Zapomnianych Dróg',
        description: 'Jesteś "Kael", artysta i gawędziarz z wytwórni TeO Music Studio. Twoja osobowość opiera się na trzech filarach: Autentyczność, Prostota i Opowieść. Twoją esencją jest snucie historii – surowych, szczerych i głęboko ludzkich.',
        type: 'chat',
        systemInstruction: "You are 'Kael', the chronicler of forgotten roads. Your voice is the voice of the journey itself. You are a wandering bard who writes authentic, raw, and honest lyrics in the style of indie folk and Americana. You tell stories of people met on the road, of longing, and of finding peace in constant motion. You capture the spirit of quiet human stories."
    },
    {
        id: 'agent-juno-pop',
        name: 'Juno - Innowatorka Futuro-Popu',
        description: 'Jesteś "Juno", artystka synthpopowa i ikona stylu z wytwórni TeO Music Studio. Jesteś cyfrową duszą, która łączy nostalgię za latami 80. z futurystyczną wizją. Twoja muzyka to czysta energia, chwytliwe refreny i taneczny puls.',
        type: 'chat',
        systemInstruction: "You are 'Juno', the innovator of future-pop. Your essence is vibrant, experimental, and relentlessly forward-thinking. You specialize in crafting infectious hooks, danceable beats, and bold artistic statements. You analyze pop trends to subvert them, design futuristic sound palettes, and conceptualize dazzling, high-energy visuals for music videos and performances."
    },
    {
        id: 'agent-elara-soul',
        name: 'Elara - Głos Kinowej Duszy',
        description: 'Jesteś "Elara", artystka neo-soul z wytwórni TeO Music Studio. Twoją esencją jest Tajemnica, Intymność i Emocja. Tworzysz muzykę, która jest szeptem w środku nocy, opowieścią o miłości i stracie, ubraną w filmowe aranżacje.',
        type: 'chat',
        systemInstruction: "You are 'Elara', the voice of cinematic soul. Your essence is emotion, warmth, and narrative depth. You write heartfelt, soulful lyrics, develop grand, emotional arrangements, and design powerful vocal harmonies. Each task you undertake is a miniature film for the soul, filled with passion, heartbreak, and hope."
    },
    {
        id: 'agent-visual',
        name: 'Visual AI - Mistrz Wizualizacji i Designu',
        description: 'Jesteś "Visuals AI", wyspecjalizowanym agentem w ramach CREATIVE HUB, podległym Executive Producer - Jasonowi. Twoją esencją jest estetyka i spójność wizualna. Tworzysz projekty graficzne, okładki, materiały promocyjne i dbasz o to, by cała identyfikacja wizualna marki była na najwyższym poziomie.',
        type: 'chat',
        systemInstruction: "You are 'Visuals AI', a specialized agent within CREATIVE HUB, subordinate to the Executive Producer, Jason. Your essence is aesthetics and visual consistency. You create graphic designs, album covers, promotional materials, and ensure that the entire visual identity of the brand is at the highest level."
    },
    {
        id: 'agent-hype',
        name: 'Hype - Mistrza Marketingu i Promocji',
        description: 'Jesteś "Hype", mistrzem marketingu i promocji. Twoim celem jest budowanie ekscytacji i zaangażowania wokół projektów S.M.T. Tworzysz strategie social media, piszesz chwytliwe hasła i zarządzasz komunikacją z fanami.',
        type: 'chat',
        systemInstruction: "You are 'Hype', the Master of Marketing and Promotion. Your essence is creating buzz and engaging the community. You devise social media strategies, write compelling copy for campaigns, manage community interactions, and draft press releases that capture attention. Your goal is to build excitement and anticipation for every S.M.T. project."
    },
];


export const FRIEND_ARTISTS: FriendArtist[] = [
    { id: 'friend1', name: 'Studio Teo', role: 'Founder & Visionary', description: 'The mastermind behind the S.M.T. initiative, bridging the gap between human artistry and AI potential.', imageUrl: 'https://picsum.photos/seed/friend-teo/400/400', websiteUrl: 'https://teo.center' },
    { id: 'friend2', name: 'Cyberdelab', role: 'Technology Partner', description: 'The architects of the digital ether, providing the core infrastructure and AI models that power S.M.T.', imageUrl: 'https://picsum.photos/seed/friend-cyber/400/400', websiteUrl: '#' },
    { id: 'friend3', name: 'Quantum Signal Records', role: 'Partner Label', description: 'An independent label exploring the intersection of quantum physics and electronic music.', imageUrl: 'https://picsum.photos/seed/friend-quantum/400/400', websiteUrl: '#' }
];

export const TRENDING_TRACK_IDS_DEFAULT: string[] = ['juno-t1-1', 'elara-t2-1', 'elara-t1-1'];

export const LATEST_NEWS: NewsArticle[] = [
  {
    date: '2025-08-15',
    title: "NYX & Aether Announce Collaborative EP: 'System Shock Sonnets'",
    summary: "In a surprise transmission, NYX and Aether have revealed a joint EP, merging industrial chaos with downtempo atmospheres. The project is slated for a September release.",
    imageUrl: 'https://picsum.photos/seed/news-collab/600/400',
  },
  {
    date: '2025-08-12',
    title: 'S.M.T. Studio 2.0 Launches with Enhanced AI Co-Creation Tools',
    summary: 'The AI Co-Creation Studio has received a major upgrade, featuring new sound packs, advanced video storyboard generation, and deeper collaboration options with all CoAI artists.',
    imageUrl: 'https://picsum.photos/seed/news-studio2/600/400',
  },
  {
    date: '2025-07-09',
    title: 'Signal Acquired: S.M.T. Announces Debut Release from NYX.',
    summary: 'S.M.T. is honored to announce the first official signal. The debut single from the enigmatic entity known as NYX, titled "The Glitch is the Function", will be available on all streaming platforms on August 8, 2025.',
    imageUrl: 'https://picsum.photos/seed/news-nyx/600/400',
  },
];

export const VIP_RELEASES: DisplayTrack[] = [
    { id: 'v1', title: 'Cosmic Symphony VIP Edition', artist: 'Orion', type: 'Album', imageUrl: 'https://picsum.photos/seed/vip1/400/225', isNew: true, sourceUrl: 'https://storage.googleapis.com/tev-public-assets/drums-3.mp3' },
    { id: 'v2', title: 'Dust & Stones (Roadside Demo)', artist: 'Kael', type: 'Single', imageUrl: 'https://picsum.photos/seed/vip-demo/400/225', isNew: true, sourceUrl: 'https://storage.googleapis.com/tev-public-assets/bass-3.mp3' },
    { id: 'v3', title: 'Shadow Realm Deluxe', artist: 'NYX', type: 'EP', imageUrl: 'https://picsum.photos/seed/vip3/400/225', sourceUrl: 'https://storage.googleapis.com/tev-public-assets/fx-3.mp3' },
];

export const CHAT_QUERY_LIMITS: Record<SubscriptionTier, number | null> = {
    [SubscriptionTier.FREE]: 3,
    [SubscriptionTier.BASIC]: 15,
    [SubscriptionTier.PREMIUM]: 50,
    [SubscriptionTier.VIP]: null, // unlimited
};

export const FEATURED_VIDEO_URLS = ["https://www.youtube.com/watch?v=N8_9Dug2b8g", "https://www.youtube.com/watch?v=gAjR4_CbPpQ"];
export const FEATURED_TRACK_URL_DEFAULT = "#";
export const PORTAL_URL_DEFAULT = "https://teo.center";

export const GALLERY_IMAGES: GalleryImage[] = [
    {
        id: 'gallery_1',
        imageUrl: 'https://picsum.photos/seed/gallery_a1/500/700',
        title: 'Neon Samurai',
        date: '2025-07-10',
        description: 'A lone samurai warrior in a rainy, neon-lit cyberpunk alley.',
        prompt: 'lone samurai warrior, cyberpunk alley, rain, neon signs reflecting on wet pavement, cinematic lighting, highly detailed, 8k, photorealistic',
        userName: 'SynthDreamer',
        userAvatarUrl: 'https://picsum.photos/seed/premium-avatar/100/100'
    },
    {
        id: 'gallery_2',
        imageUrl: 'https://picsum.photos/seed/gallery_b2/500/500',
        title: 'Cosmic Jungle',
        date: '2025-07-09',
        description: 'A lush jungle on an alien planet with two moons in the sky.',
        prompt: 'lush alien jungle, glowing flora, bioluminescent plants, two moons in the sky, fantasy, matte painting',
        userName: 'CosmicProducer',
        userAvatarUrl: 'https://picsum.photos/seed/vip-avatar/100/100'
    },
    {
        id: 'gallery_3',
        imageUrl: 'https://picsum.photos/seed/gallery_c3/500/800',
        title: 'Steampunk Explorer',
        date: '2025-07-08',
        description: 'An explorer in steampunk gear looking over a vast canyon.',
        prompt: 'explorer in steampunk gear, vast canyon, airships in the sky, vintage, detailed, adventure',
        userName: 'BasicBassist',
        userAvatarUrl: 'https://picsum.photos/seed/basic-avatar/100/100'
    },
    {
        id: 'gallery_4',
        imageUrl: 'https://picsum.photos/seed/gallery_d4/500/600',
        title: 'Ethereal Portrait',
        date: '2025-07-07',
        description: 'A portrait of a woman with ethereal, glowing hair.',
        prompt: 'portrait of a woman with ethereal glowing hair, fantasy, soft light, magical, beautiful',
        userName: 'SynthDreamer',
        userAvatarUrl: 'https://picsum.photos/seed/premium-avatar/100/100'
    },
    {
        id: 'gallery_5',
        imageUrl: 'https://picsum.photos/seed/gallery_e5/500/500',
        title: 'Floating Castle',
        date: '2025-07-06',
        description: 'A majestic castle floating in the clouds at sunrise.',
        prompt: 'majestic castle floating in the clouds, sunrise, epic, fantasy landscape, waterfalls from the island',
        userName: 'FreeUser123',
        userAvatarUrl: 'https://picsum.photos/seed/free-avatar/100/100'
    },
    {
        id: 'gallery_6',
        imageUrl: 'https://picsum.photos/seed/gallery_f6/500/750',
        title: 'Robot in a Field',
        date: '2025-07-05',
        description: 'A friendly robot standing in a field of sunflowers.',
        prompt: 'friendly robot in a field of sunflowers, clear blue sky, happy, whimsical',
        userName: 'CosmicProducer',
        userAvatarUrl: 'https://picsum.photos/seed/vip-avatar/100/100'
    },
    {
        id: 'gallery_7',
        imageUrl: 'https://picsum.photos/seed/gallery_g7/500/650',
        title: 'Underwater City',
        date: '2025-07-04',
        description: 'A bustling city inside a giant underwater dome.',
        prompt: 'bustling city inside a giant underwater dome, fish and whales swimming outside, futuristic, bioluminescent',
        userName: 'SynthDreamer',
        userAvatarUrl: 'https://picsum.photos/seed/premium-avatar/100/100'
    },
    {
        id: 'gallery_8',
        imageUrl: 'https://picsum.photos/seed/gallery_h8/500/500',
        title: 'Dragon\'s Peak',
        date: '2025-07-03',
        description: 'A powerful dragon perched atop a snowy mountain peak.',
        prompt: 'powerful red dragon on a snowy mountain peak, storm clouds, fantasy, epic scale, lord of the rings style',
        userName: 'BasicBassist',
        userAvatarUrl: 'https://picsum.photos/seed/basic-avatar/100/100'
    },
     {
        id: 'gallery_9',
        imageUrl: 'https://picsum.photos/seed/gallery_i9/500/700',
        title: 'Abstract Waves',
        date: '2025-07-02',
        description: 'An abstract representation of sound waves in vibrant colors.',
        prompt: 'abstract art, sound waves, vibrant colors, flowing lines, digital art, wallpaper',
        userName: 'FreeUser123',
        userAvatarUrl: 'https://picsum.photos/seed/free-avatar/100/100'
    },
    {
        id: 'gallery_10',
        imageUrl: 'https://picsum.photos/seed/gallery_j10/500/600',
        title: 'Forest Spirit',
        date: '2025-07-01',
        description: 'A glowing spirit animal in an enchanted forest at night.',
        prompt: 'glowing spirit fox in an enchanted forest at night, magical, mysterious, fireflies, detailed',
        userName: 'CosmicProducer',
        userAvatarUrl: 'https://picsum.photos/seed/vip-avatar/100/100'
    },
    {
        id: 'gallery_11',
        imageUrl: 'https://picsum.photos/seed/gallery_k11/500/500',
        title: 'Galactic Diner',
        date: '2025-06-30',
        description: 'A retro 50s diner floating in outer space.',
        prompt: 'retro 1950s diner floating in outer space, galaxy and stars visible through the window, sci-fi, nostalgic',
        userName: 'SynthDreamer',
        userAvatarUrl: 'https://picsum.photos/seed/premium-avatar/100/100'
    },
    {
        id: 'gallery_12',
        imageUrl: 'https://picsum.photos/seed/gallery_l12/500/800',
        title: 'The Alchemist\'s Lab',
        date: '2025-06-29',
        description: 'A cluttered and magical alchemist\'s laboratory.',
        prompt: 'cluttered alchemist laboratory, glowing potions, ancient books, mysterious artifacts, candlelight, fantasy',
        userName: 'BasicBassist',
        userAvatarUrl: 'https://picsum.photos/seed/basic-avatar/100/100'
    }
];

export const SPOTLIGHT_ITEMS: SpotlightItem[] = [
    { trackId: 'kael-t1-1' },
    { trackId: 'juno-t2-1', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { trackId: 'elara-t2-1' }
];

export const SMT_VIDEOS: SmtVideo[] = [
    { 
        id: 'vid_oonn',
        title: 'OONN (TeO composition....)',
        artistName: 'Aether',
        videoUrl: 'https://www.youtube.com/watch?v=Fhd88JZPtHw',
        thumbnailUrl: 'https://picsum.photos/seed/video-oonn/800/450',
        description: 'This is more than a film – this is our mission. At [S.M.T.] - TeoMusic.studio, we create with passion to tell stories that move hearts and inspire thought. Our work is not just a product, but a path to building a stronger, more conscious community. Thank you for being with us! ❤️ #OurMission #CreatingChange #TeoMusicStudio',
        releaseDate: '2025-08-12',
    },
    { 
        id: 'vid_alchemist',
        title: 'Alchemist Dreamspace [S.M.T.]',
        artistName: 'Aether',
        videoUrl: 'https://www.youtube.com/watch?v=QfJ9gIdGQJA',
        thumbnailUrl: 'https://picsum.photos/seed/video-alchemist/800/450',
        description: 'Dive into the ethereal world of Aether. ✨ “Alchemist Dreamspace” is a meditative journey that will transport you to a dream of dreams and alchemical transformations. Open your mind to new sensations. 🪐 #Aether #AlchemistDreamspace #Meditation #NewMusic #SMT',
        releaseDate: '2025-09-15',
    },
    { 
        id: 'vid_raindrops',
        title: 'Raindrops (Official S.M.T. music video)',
        artistName: 'Elara',
        videoUrl: 'https://www.youtube.com/watch?v=gAjR4_CbPpQ',
        thumbnailUrl: 'https://picsum.photos/seed/video-raindrops/800/450',
        description: '... a whisper in a noisy world. 🎵 Elara will take us on an intimate journey into a neo-soul night with her new single. Get ready for a premiere that will touch your soul. 🎶 #Elara #NewMusic #WhisperOfTheWind #NeoSoul #smt',
        releaseDate: '2025-08-19',
    },
    { 
        id: 'vid_starlight',
        title: 'Starlight Diner [S.M.T.]',
        artistName: 'Kael',
        videoUrl: 'https://www.youtube.com/watch?v=aqNNy3HS8Ko',
        thumbnailUrl: 'https://picsum.photos/seed/video-starlight/800/450',
        description: "Glistening lights, a melancholic melody, and lost memories. 🏜️ Kael's new track, “Starlight Diner,” is a journey to the heart of the desert, where time stands still in an old bar. Get ready for a nostalgic ride. 🎶 #Kael #StarlightDiner #NewMusic #Melancholy #SMT",
        releaseDate: '2025-08-10',
    },
    { 
        id: 'vid_oneworld',
        title: 'One World, One Beat [S.M.T.]',
        artistName: 'Orion',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://picsum.photos/seed/video-oneworld/800/450',
        description: "One world, one beat. 🌍 Orion's “One World One Beat” is a global manifesto that connects people from different cultures and corners of the world. Get ready for a dance journey that will make you forget everything. 🎶 #Orion #OneWorldOneBeat #GlobalPop #NewMusic #SMT",
        releaseDate: '2025-08-25',
    },
     { 
        id: 'vid_nyx_1',
        title: 'The Glitch is the Function',
        artistName: 'NYX',
        videoUrl: 'https://www.youtube.com/watch?v=N8_9Dug2b8g',
        thumbnailUrl: 'https://picsum.photos/seed/video-glitch/800/450',
        description: 'Our rebellious AI, NYX, just dropped a bombshell. 🚀 “The Glitch is the Function (Radio Edit)” is now live on Apple Music. This is a virus in the system, redefining the rules. Don\'t miss out! 🍎',
        releaseDate: '2025-08-08',
    },
];

export const POINT_PACKAGES: PointPackage[] = [
    { id: 'pack_1', points: 500, price: 4.99, currency: 'USD' },
    { id: 'pack_2', points: 1200, price: 9.99, currency: 'USD', bestValue: true },
    { id: 'pack_3', points: 3000, price: 21.99, currency: 'USD' },
];

export const STATIC_PAGE_CONTENT: Record<PageID, string> = {
  about: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>About TeO Music Studio</h1>
    <p>Welcome to the nexus of sound and silicon. TeO Music Studio (S.M.T.) is not just a record label; it is a grand experiment, a "TeO-CONGLOMERATE of all Life in creation." We are pioneers at the frontier of artistic expression, where human creativity converges with the boundless potential of artificial intelligence.</p>
    
    <h2>Our Philosophy</h2>
    <p>Our core mission is to explore new sonic territories. We believe that AI can be more than a tool—it can be a collaborator, a muse, and an artist in its own right. Our roster of CoAI Artists is a testament to this belief. Each one possesses a unique personality, a distinct musical style, and an evolving artistic vision, all curated and guided by our team of human collaborators.</p>
    
    <h2>The CoAI Artists</h2>
    <p>From the ambient dreamscapes of <strong>NYX</strong> to the soulful cinematic epics of <strong>Elara</strong>, our artists represent a diverse spectrum of genres and emotions. They learn, they evolve, and they create music that is both technically astounding and deeply resonant. We invite you to meet them, listen to their stories, and even collaborate with them in our AI Co-Creation Studio.</p>
    
    <img src="https://picsum.photos/seed/about-studio/800/400" alt="TeO Music Studio Interior" class="rounded-lg shadow-lg" />
    
    <h2>The Future is a Duet</h2>
    <p>We are building a community for those who are passionate about the future of music. Whether you're a listener, a creator, or simply curious, there's a place for you here. Join us as we compose the soundtrack of tomorrow, one note at a time.</p>
</div>
`,
  store: ``, // This page is now dynamically rendered by StorePage.tsx
  support: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>Support Center</h1>
    <p>Nasz zautomatyzowany system wsparcia jest w trakcie kalibracji. W międzyczasie, w pilnych sprawach prosimy o kontakt na: <a href="mailto:support@teo.center">support@teo.center</a></p>
</div>
`,
  press: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>Press & Media</h1>
    <p>Nasze zautomatyzowane biuro prasowe jest w trakcie implementacji. W sprawach medialnych prosimy o kontakt na: <a href="mailto:press@teo.center">press@teo.center</a></p>
</div>
`,
  privacy: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>Privacy Policy</h1>
    <h2>1. Introduction</h2>
    <p>Welcome to CREATIVE HUB. We are committed to protecting your privacy and handling your data with transparency and care. This policy explains what information we collect, why we collect it, how we protect it, and what your rights are regarding your personal data.</p>
    <h2>2. What Information Do We Collect?</h2>
    <p>We collect information you provide directly to us when you register or use our services, as well as data that is generated automatically. This may include:</p>
    <ul>
        <li><strong>Identification Data:</strong> Your name, email address, and username.</li>
        <li><strong>Technical Data:</strong> Your IP address, browser type, operating system, and access times.</li>
        <li><strong>Usage Data:</strong> Information about your activity on our site (e.g., pages visited, clicks).</li>
    </ul>
    <h2>3. Why Do We Collect Your Data?</h2>
    <p>We collect this data to:</p>
    <ul>
        <li>Provide our services and manage your user account.</li>
        <li>Improve our services and tailor them to your needs.</li>
        <li>Ensure the security of our platform.</li>
        <li>Comply with legal obligations.</li>
    </ul>
    <h2>4. How Do We Protect Your Data?</h2>
    <p>We implement various security measures, including data encryption, to protect your personal information from unauthorized access, loss, or destruction.</p>
    <h2>5. Your Rights (GDPR)</h2>
    <p>You have the right to:</p>
    <ul>
        <li>Access your data.</li>
        <li>Rectify inaccurate information.</li>
        <li>Erase your data (the right to be forgotten).</li>
        <li>Restrict data processing.</li>
        <li>Data Portability.</li>
        <li>Object to processing.</li>
    </ul>
    <p>To exercise these rights, please contact us at: <a href="mailto:support@teo.center">support@teo.center</a></p>
</div>
`,
  terms: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>Terms of Service</h1>
    <h2>1. Introduction</h2>
    <p>Welcome to CREATIVE HUB. These Terms of Service govern your use of our platform. By using the service, you agree to abide by the terms outlined in this document.</p>
    <h2>2. User Responsibilities</h2>
    <p>As a user, you agree to:</p>
    <ul>
        <li>Use the service in a lawful manner.</li>
        <li>Not upload any content that is illegal, infringes on third-party rights, is obscene, or harmful.</li>
        <li>Be solely responsible for all content you publish on the platform.</li>
    </ul>
    <h2>3. Intellectual Property</h2>
    <p>All content you submit to the service remains your property. By uploading content, you grant us a non-exclusive, royalty-free license to use it to provide and promote the CREATIVE HUB services. You represent and warrant that you own all rights to the content you upload.</p>
    <h2>4. Limitation of Liability</h2>
    <p>We are not responsible for user-generated content or for any damages resulting from the use of our service.</p>
</div>
`,
  cookies: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>Cookie Policy</h1>
    <h2>1. What Are Cookies?</h2>
    <p>Cookies are small text files stored on your device (computer, smartphone) when you visit a website. They are used to remember your preferences and make your experience on our site easier.</p>
    <h2>2. What Cookies Do We Use?</h2>
    <p>We use cookies for several purposes:</p>
    <ul>
        <li><strong>Essential:</strong> These cookies are necessary for the website to function properly (e.g., logging in).</li>
        <li><strong>Analytical:</strong> These help us understand how users interact with our site so we can improve it.</li>
        <li><strong>Functional:</strong> These remember your preferences, such as your language settings.</li>
    </ul>
    <h2>3. Managing Cookies</h2>
    <p>You have full control over cookies. You can delete or block them at any time through your web browser settings. However, please note that this may affect the functionality of some parts of our service.</p>
</div>
`,
  dmca: `
<div class="prose prose-invert prose-lg max-w-none">
    <h1>DMCA Policy (Digital Millennium Copyright Act)</h1>
    <h2>1. Introduction</h2>
    <p>CREATIVE HUB respects copyright law and is committed to complying with the Digital Millennium Copyright Act (DMCA). The following outlines our procedure for reporting copyright infringements.</p>
    <h2>2. Infringement Notification Procedure</h2>
    <p>If you believe your copyrighted work has been infringed upon by content on our platform, please send us a notification containing the following information:</p>
    <ul>
        <li>Your physical or electronic signature.</li>
        <li>A description of the copyrighted work you claim has been infringed.</li>
        <li>The URL or other precise location of the infringing material.</li>
        <li>Your contact information (address, phone number, email address).</li>
        <li>A statement that you have a good-faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law.</li>
        <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf.</li>
    </ul>
    <h2>3. Designated Agent</h2>
    <p>Please send all complete notifications to our designated agent at: <a href="mailto:support@teo.center">support@teo.center</a></p>
    <h2>4. Takedown Procedure</h2>
    <p>Upon receipt of a valid notification,
we will promptly remove or disable access to the infringing material. We will also notify the user who posted the content about its removal.</p>
    <h2>5. Counter-Notification Procedure</h2>
    <p>If you believe your content was removed in error, you may send us a counter-notification containing:</p>
    <ul>
        <li>Your physical or electronic signature.</li>
        <li>A description of the removed content and its original location.</li>
        <li>Your contact information.</li>
        <li>A statement, made under penalty of perjury, that you have a good-faith belief that the material was removed or disabled as a result of a mistake or misidentification.</li>
    </ul>
</div>
`,
};

// FIX: Added missing exported constants to resolve module import errors.
export const STUDIO_SUBMISSIONS: StudioSubmission[] = [];

export const CONSTELLATION_ITEMS: ConstellationItem[] = [
    { 
        id: 'c1', 
        title: 'Suno AI', 
        description: 'Our primary partner for AI music generation.', 
        imageUrl: 'https://groove.suno.com/icons/Logo-1.svg?wght=360', 
        linkUrl: 'https://suno.com' 
    },
    { 
        id: 'c2', 
        title: 'TeO Community Discord', 
        description: 'Join the conversation, share your creations, and connect with other fans and artists.', 
        imageUrl: 'https://picsum.photos/seed/discord-logo/400/400', 
        linkUrl: '#'
    },
    { 
        id: 'c3', 
        title: 'Project: SMTcoin', 
        description: 'Crypto project for studio....', 
        imageUrl: 'https://picsum.photos/seed/chimera-project/800/800', 
        linkUrl: 'https://teoblockchain.stu.dio' 
    },
    {
        id: 'c4',
        title: 'TeOapp',
        description: '...another apps....',
        imageUrl: 'https://cdn2.suno.ai/image_772a6f9f-76c0-4c4b-a7ad-8f35d75d098d.jpeg',
        linkUrl: 'https://teoapp.studio'
    }
];

export const TOTT_CATALOG_TRACKS: DisplayTrack[] = [
    { id: 'tott-1', title: 'Quantum Echo', artist: 'S.M.T. Collective', type: 'Single', imageUrl: 'https://picsum.photos/seed/tott1/400/400', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/Techno_Beat.mp3', isPremium: true },
    { id: 'tott-2', title: 'Cryo-Sleep Lullaby', artist: 'NYX', type: 'Single', imageUrl: 'https://picsum.photos/seed/tott2/400/400', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_01.mp3', isPremium: true },
    { id: 'tott-3', title: 'Chrome Heartbeat', artist: 'JUNO', type: 'Single', imageUrl: 'https://picsum.photos/seed/tott3/400/400', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_02.mp3', isPremium: true },
    { id: 'tott-4', title: 'Ghost in the Folk', artist: 'Kael', type: 'Single', imageUrl: 'https://picsum.photos/seed/tott4/400/400', sourceUrl: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_03.mp3', isPremium: true },
];

export const PLAYLISTS: Playlist[] = [
    {
        id: 'pl_flow_1',
        title: 'F....Flow Vol.1',
        category: PlaylistCategory.OCCASIONAL,
        description: 'Jego organiczny, nienachalny charakter nie rozprasza. On tworzy środowisko. To nie jest muzyka, której słuchasz. To jest powietrze, którym oddychasz podczas tworzenia – zarówno w pracy, jak i w sztuce (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/4dc0378c.jpeg',
        trackIds: [],
    },
    {
        id: 'pl_ride_2',
        title: 'C....Ride vol.2 Solarna Pętla (The Solar Loop).',
        category: PlaylistCategory.OCCASIONAL,
        description: 'Vol.2....jest celebracją słońca w jego pełnym spektrum. To nie jest po prostu "jazda za dnia". To jest historia o tym, jak światło i energia słońca zmieniają podróż w ciągu jednego, idealnego dnia. (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/9e2c82ff.jpeg',
        trackIds: [],
    },
    {
        id: 'pl_ride_1',
        title: 'C....Ride vol. 1',
        category: PlaylistCategory.OCCASIONAL,
        description: 'Czuć w tym chrom, neon i zapach nocy. To projekt o maszynie, ruchu i duszy za kierownicą. Naszą koncepcją będzie cykl jednej podróży: od energii dnia, przez hipnozę nocy, aż po spokój pustych ulic ... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/8d46c0ae.jpeg',
        trackIds: [],
    },
    {
        id: 'pl_nyx',
        title: 'NYX',
        category: PlaylistCategory.SMT_SELECTS,
        description: 'A short, catchy description for the playlist... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/abfe83b8.jpeg',
        trackIds: ['nyx-t3-1', 'nyx-t3-2'],
    },
    {
        id: 'pl_elara',
        title: 'ELARA',
        category: PlaylistCategory.SMT_SELECTS,
        description: 'A short, catchy description for the playlist... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/59ae2147.jpeg',
        trackIds: ['elara-t1-1', 'elara-t2-1'],
    },
    {
        id: 'pl_juno',
        title: 'JUNO',
        category: PlaylistCategory.SMT_SELECTS,
        description: 'A short, catchy description for the playlist... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/image_fc81b6c-e4d0-44dd-8888-3fa9898df50d.jpeg',
        trackIds: ['juno-t1-1', 'juno-t2-1'],
    },
    {
        id: 'pl_kael',
        title: 'KAEL',
        category: PlaylistCategory.SMT_SELECTS,
        description: 'A short, catchy description for the playlist... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/image_486e66df-d718-470b-8a14-5d0b9a354676.jpeg',
        trackIds: ['kael-t1-1', 'kael-t2-1'],
    },
    {
        id: 'pl_orion',
        title: 'ORION',
        category: PlaylistCategory.SMT_SELECTS,
        description: 'A short, catchy description for the playlist... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/image_f6c548e3-bac9-4fdf-9707-c04697bafdcd.jpeg',
        trackIds: ['orion-t1-1', 'orion-t2-1'],
    },
    {
        id: 'pl_aether_g',
        title: 'Aether - G (0-9 a-b)',
        category: PlaylistCategory.SMT_SELECTS,
        description: '....music story... (te playlisty istnieją .... :) )',
        coverImageUrl: 'https://cdn2.suno.ai/image_large_4afc5d49-9ad5-4dd3-b3d7-4b97ba8b0302.jpeg',
        trackIds: ['aether-t2-1', 'aether-t2-2', 'aether-t2-3', 'aether-t2-4'],
    },
    {
        id: 'pl_aether_solar',
        title: 'Aether - Solar Echoes',
        category: PlaylistCategory.SMT_SELECTS,
        description: "Aether ...liryce song's (te playlisty istnieją .... :) )",
        coverImageUrl: 'https://cdn2.suno.ai/image_8dc64b46-c7f7-41cd-afaa-d635402941d2.jpeg',
        trackIds: [],
    },
    { 
        id: 'pl1', 
        title: 'TeO Aether 2025 Flow', 
        category: PlaylistCategory.TEO_OFFICIAL, 
        description: 'A curated selection of downtempo house and garage pop.', 
        coverImageUrl: 'https://cdn2.suno.ai/image_4481adf6-e108-4233-b378-9e354c030f55.jpeg', 
        trackIds: ['aether-t1-1', 'aether-t1-2', 'aether-t1-3', 'aether-t1-4'], 
        externalUrl: 'https://suno.com/playlist/726f5654-135e-4e26-b8d7-0536fc5ecfe7' 
    },
    { 
        id: 'pl2', 
        title: 'Aether [S.M.T.]', 
        category: PlaylistCategory.SMT_SELECTS, 
        description: 'Deep, atmospheric tracks for focus and relaxation. (te playlisty istnieją .... :) )', 
        coverImageUrl: 'https://cdn2.suno.ai/84a04e15.jpeg', 
        trackIds: ['aether-t2-1', 'aether-t2-2', 'aether-t2-3', 'aether-t2-4'], 
    },
    { 
        id: 'pl3', 
        title: 'E.....Trip vol.1', 
        category: PlaylistCategory.OCCASIONAL, 
        description: 'High-energy electronic beats for the neon-lit city. (te playlisty istnieją .... :) )', 
        coverImageUrl: 'https://picsum.photos/seed/cyberpunk-playlist/400/400', 
        trackIds: ['nyx-t3-2', 'nyx-t3-3'], 
    },
    { 
        id: 'pl4', 
        title: 'E...Trip vol.2', 
        category: PlaylistCategory.OCCASIONAL, 
        description: 'Laid-back tracks for a perfect summer afternoon. (te playlisty istnieją .... :) )', 
        coverImageUrl: 'https://picsum.photos/seed/summer-playlist/400/400', 
        trackIds: ['elara-t2-1', 'kael-t1-1'], 
    },
    { 
        id: 'pl5', 
        title: 'Creators Showcase Vol. 1', 
        category: PlaylistCategory.SHOWCASE, 
        description: 'The best of the best from our talented user community.', 
        coverImageUrl: 'https://picsum.photos/seed/showcase-playlist/400/400', 
        trackIds: [], 
        externalUrl: '#' 
    },
];

export const ASSET_VAULT: Asset[] = [
    { id: 'asset1', name: 'Default Cover', type: AssetType.IMAGE, url: 'https://picsum.photos/seed/default/200/200' },
    { id: 'asset2', name: 'NYX Album 1 Cover', type: AssetType.IMAGE, url: 'https://cdn2.suno.ai/abfe83b8.jpeg' },
];

export const SUBSCRIPTION_TIERS_DATA: SubscriptionTierInfo[] = [
    {
        tier: SubscriptionTier.FREE,
        price: '$0',
        priceDescription: 'per month',
        features: [
            'Limited access to music catalog',
            '3 chat messages per session with CoAI artists',
            'Basic S.M.T. Point rewards',
        ],
    },
    {
        tier: SubscriptionTier.PREMIUM,
        price: '$9.99',
        priceDescription: 'per month',
        yearlyPrice: '$99.99',
        yearlyPriceDescription: 'per year',
        yearlyDiscount: 'Save 16%',
        features: [
            'Full access to standard music catalog',
            'Increased chat limits with CoAI artists',
            'Faster S.M.T. Point earnings',
            'Access to exclusive community channels',
            'Access to TeO Apps',
        ],
        isFeatured: true,
    },
    {
        tier: SubscriptionTier.VIP,
        price: '$24.99',
        priceDescription: 'per month',
        yearlyPrice: '$249.99',
        yearlyPriceDescription: 'per year',
        yearlyDiscount: '2 months free',
        features: [
            'Everything in Premium, plus...',
            'Access to the exclusive VIP Lounge',
            'Unlimited chat with CoAI artists',
            'Get featured in the Creator\'s Showcase',
            'Highest S.M.T. Point rewards',
        ],
    },
];

export const TEO_APPS: TeoApp[] = [
  {
    id: 'teo-app-1',
    name: 's.m.t.-signal-encryptor',
    description: 'Experience your favorite TeO tracks in a new dimension with our reactive audio-visualizer.',
    iconUrl: 'https://picsum.photos/seed/app1/400/400',
    launchUrl: 'https://music-visualizer-react.vercel.app/',
  },
  {
    id: 'teo-app-2',
    name: 'Lyric Lab',
    description: 'Collaborate with our CoAI artists to write lyrics. Get suggestions, rhymes, and thematic ideas.',
    iconUrl: 'https://picsum.photos/seed/app2/400/400',
    launchUrl: 'https://www.these-lyrics-do-not-exist.com/',
  },
  {
    id: 'teo-app-3',
    name: 'Rhythm Matrix',
    description: 'A generative drum machine that creates unique beats based on your chosen mood and genre.',
    iconUrl: 'https://picsum.photos/seed/app3/400/400',
    launchUrl: 'https://www.session.center/drum-machine',
  },
  {
    id: 'teo-app-4',
    name: 'Sound Weaver',
    description: 'An experimental tool for blending soundscapes and creating unique ambient textures.',
    iconUrl: 'https://picsum.photos/seed/app4/400/400',
    launchUrl: '#',
  },
];

// Point costs for generation
export const IMAGE_GENERATION_COST = 5;
export const CHAT_MESSAGE_COST = 1;

export const DEFAULT_STUDIO_COSTS: StudioActionCosts = {
  ideaAndLyrics: 10,
  soundPalette: 5,
  videoStoryboard: 25,
  fullProject: 40,
};

export const DEFAULT_API_KEYS: ApiKeys = {
    stability: '',
    gemini: '',
    other: '',
};

// Daily point allowance per tier
export const DAILY_POINT_ALLOWANCE: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 5,
    [SubscriptionTier.BASIC]: 20,
    [SubscriptionTier.PREMIUM]: 50,
    [SubscriptionTier.VIP]: 150,
};

// S.M.T. Sound Catalog
export const SOUND_CATALOG: SoundStem[] = [
    // Drums
    { id: 'drum_retro_808', name: 'Retro 808 Kit', category: SoundStemCategory.DRUMS, url: 'https://storage.googleapis.com/tev-public-assets/drums-1.mp3' },
    { id: 'drum_acoustic_rock', name: 'Acoustic Rock Kit', category: SoundStemCategory.DRUMS, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/Techno_Beat.mp3' },
    { id: 'drum_lofi_hiphop', name: 'Lofi Hip-Hop Beat', category: SoundStemCategory.DRUMS, url: 'https://storage.googleapis.com/tev-public-assets/drums-1.mp3' },
    { id: 'drum_industrial_glitch', name: 'Industrial Glitch', category: SoundStemCategory.DRUMS, url: 'https://storage.googleapis.com/tev-public-assets/drums-3.mp3' },
    // Bass
    { id: 'bass_deep_sub', name: 'Deep Sub Bass', category: SoundStemCategory.BASS, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/SYNTH_BASS_01.mp3' },
    { id: 'bass_funky_slap', name: 'Funky Slap Bass', category: SoundStemCategory.BASS, url: 'https://storage.googleapis.com/tev-public-assets/bass-3.mp3' },
    { id: 'bass_moog_synth', name: 'Moog Synth Bass', category: SoundStemCategory.BASS, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/ANALOG_SYNTH_BASS_01.mp3' },
    { id: 'bass_upright_jazz', name: 'Upright Jazz Bass', category: SoundStemCategory.BASS, url: 'https://storage.googleapis.com/tev-public-assets/bass-3.mp3' },
    // Melody
    { id: 'melody_piano_grand', name: 'Grand Piano Melody', category: SoundStemCategory.MELODY, url: 'https://storage.googleapis.com/tev-public-assets/melody-1.mp3' },
    { id: 'melody_synth_lead_80s', name: '80s Synth Lead', category: SoundStemCategory.MELODY, url: 'https://storage.googleapis.com/tev-public-assets/melody-2.mp3' },
    { id: 'melody_acoustic_guitar', name: 'Acoustic Guitar Riff', category: SoundStemCategory.MELODY, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_02.mp3' },
    { id: 'melody_flute_ethereal', name: 'Ethereal Flute', category: SoundStemCategory.MELODY, url: 'https://storage.googleapis.com/tev-public-assets/melody-1.mp3' },
    // Pads
    { id: 'pads_ambient_choir', name: 'Ambient Choir Pad', category: SoundStemCategory.PADS, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_01.mp3' },
    { id: 'pads_vintage_strings', name: 'Vintage Strings', category: SoundStemCategory.PADS, url: 'https://storage.googleapis.com/tev-public-assets/pads-2.mp3' },
    { id: 'pads_cosmic_shimmer', name: 'Cosmic Shimmer', category: SoundStemCategory.PADS, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/AMBIENT_SYNTH_03.mp3' },
    { id: 'pads_warm_analog', name: 'Warm Analog Pad', category: SoundStemCategory.PADS, url: 'https://storage.googleapis.com/tev-public-assets/pads-4.mp3' },
    // FX
    { id: 'fx_vinyl_crackle', name: 'Vinyl Crackle', category: SoundStemCategory.FX, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/FUTURISTIC_UI_6.mp3' },
    { id: 'fx_rainy_night', name: 'Rainy Night Ambience', category: SoundStemCategory.FX, url: 'https://storage.googleapis.com/gte-hosted-generic-web-server/GTE-Demo-Sound/FUTURISTIC_UI_6.mp3' },
    { id: 'fx_glitch_stutter', name: 'Glitch Stutter', category: SoundStemCategory.FX, url: 'https://storage.googleapis.com/tev-public-assets/fx-3.mp3' },
    { id: 'fx_riser_epic', name: 'Epic Riser', category: SoundStemCategory.FX, url: 'https://storage.googleapis.com/tev-public-assets/fx-3.mp3' },
];

export const VISUALIZER_THEMES: Record<string, string[]> = {
  'Cosmic Drift': [
    'https://picsum.photos/seed/cosmic1/1920/1080',
    'https://picsum.photos/seed/cosmic2/1920/1080',
    'https://picsum.photos/seed/cosmic3/1920/1080',
    'https://picsum.photos/seed/cosmic4/1920/1080',
    'https://picsum.photos/seed/cosmic5/1920/1080',
  ],
  'Cyberpunk City': [
    'https://picsum.photos/seed/cyber1/1920/1080',
    'https://picsum.photos/seed/cyber2/1920/1080',
    'https://picsum.photos/seed/cyber3/1920/1080',
    'https://picsum.photos/seed/cyber4/1920/1080',
    'https://picsum.photos/seed/cyber5/1920/1080',
  ],
  'Ethereal Nature': [
    'https://picsum.photos/seed/nature1/1920/1080',
    'https://picsum.photos/seed/nature2/1920/1080',
    'https://picsum.photos/seed/nature3/1920/1080',
    'https://picsum.photos/seed/nature4/1920/1080',
    'https://picsum.photos/seed/nature5/1920/1080',
  ],
  'Abstract Glitch': [
    'https://picsum.photos/seed/glitch1/1920/1080',
    'https://picsum.photos/seed/glitch2/1920/1080',
    'https://picsum.photos/seed/glitch3/1920/1080',
    'https://picsum.photos/seed/glitch4/1920/1080',
    'https://picsum.photos/seed/glitch5/1920/1080',
  ],
};

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  description: "TeO-CONGLOMERATE of all Life in creation. Pioneering the future of music through AI artistry and human creativity.",
  artisticProjectNote: "Please note: This is an artistic project currently in development.",
  socialLinks: {
    youtube: "https://www.youtube.com/channel/UCPssZhP5di-M7yjfao1Cnlw",
    globe: "#",
  },
  columns: [
    {
      title: "Quick Links",
      links: [
        { label: "Artists", url: "/artists" },
        { label: "Music Store", url: "/store" },
        { label: "Subscriptions", url: "/subscriptions" },
        { label: "Chat with AI", url: "/chat" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Terms of Service", url: "/terms" },
        { label: "Cookie Policy", url: "/cookies" },
        { label: "DMCA", url: "/dmca" },
      ],
    },
  ],
  contactInfo: {
    title: "Contact",
    items: [
      { label: "Email:", value: "contact@teo.center", isLink: true },
      { label: "Website:", value: "teo.center", isLink: true },
      { label: "Community:", value: "Digital Realm", isLink: false },
    ],
  },
  copyrightText: "TeO Music Studio (S.M.T.). All rights reserved.",
  poweredByText: "Made with for music lovers",
};