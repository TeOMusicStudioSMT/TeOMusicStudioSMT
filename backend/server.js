

const express = require('express');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '..', 'frontend/build')));

// --- ADRES BUKETU DOSTOSOWANY DO TWOICH PLIKÓW ---
//...
// FIX: Added quotes to make the bucket name a valid string.
const BUCKET_NAME = process.env.BUCKET_NAME || 'ai-studio-bucket-457528627948-us-west1';
//...
const FOLDER_PREFIX = process.env.FOLDER_PREFIX || 'services/backend';

const storage = new Storage();

// Endpoint do pobierania listy utworów z danego folderu
app.get('/api/playlist', async (req, res) => {
    try {
        const { folder } = req.query;
        if (!folder) {
            return res.status(400).send('Brak nazwy folderu (playlisty).');
        }

        const [files] = await storage.bucket(BUCKET_NAME).getFiles({ prefix: `${folder}/` });

        const tracks = files.filter(file => file.name.endsWith('.mp3')).map(file => ({
            name: file.name.split('/').pop(),
            url: `https://storage.googleapis.com/${BUCKET_NAME}/${file.name}`
        }));

        res.status(200).json(tracks);
    } catch (error) {
        console.error('Błąd pobierania listy plików:', error);
        res.status(500).send('Wystąpił błąd serwera.');
    }
});

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file. This is essential for client-side routing.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend/build/index.html'));
});


// Nasłuchiwanie na porcie, który dostarcza Cloud Run
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Serwer nasłuchuje na porcie ${PORT}`);
});
