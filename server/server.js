const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const storage = require('configstore');
const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
const csvPath = 'data/destinations.csv';
const listsFilePath = path.join(__dirname, 'lists.json');  

const store = new storage('destinations-store', { destinations: [], lists: {} });


const loadData = () => {
    let destinations = [];
    let id = 0;
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
            row.id = id++;
            destinations.push(row);
        })
        .on('end', () => {
            store.set('destinations', destinations);
            console.log('Data loaded into storage');
        })
        .on('error', (error) => {
            console.error('Error reading CSV file:', error);
        });
};


const loadLists = () => {
    if (fs.existsSync(listsFilePath)) {
        const data = fs.readFileSync(listsFilePath);
        store.set('lists', JSON.parse(data));
        console.log('Lists loaded from file');
    } else {
        store.set('lists', {});
    }
};


const saveLists = () => {
    const lists = store.get('lists');
    fs.writeFileSync(listsFilePath, JSON.stringify(lists));
};


loadData();
loadLists();

app.use(express.json());
app.use('/api', router);
app.use(express.static(path.join(__dirname, '../client')));

const validateId = (id) => Number.isInteger(id) && id >= 0;
const validateLimit = (n) => !n || (Number.isInteger(n) && n > 0 && n <= 50);

router.get('/destinations/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid ID format' });

    const destinations = store.get('destinations');
    const destination = destinations.find(dest => dest.id === id);
    if (destination) {
        res.json(destination);
    } else {
        res.status(404).json({ error: `Destination with ID ${id} not found` });
    }
});

router.get('/destinations/:id/coordinates', (req, res) => {
    const id = parseInt(req.params.id);
    if (!validateId(id)) return res.status(400).json({ error: 'Invalid ID format' });
    const destinations = store.get('destinations');
    const destination = destinations.find(dest => dest.id === id);
    if (destination) {
        res.json({ Latitude: destination.Latitude, Longitude: destination.Longitude });
    } else {
        res.status(404).json({ error: `Coordinates for ID ${id} not found` });
    }
});

router.get('/countries', (req, res) => {
    const destinations = store.get('destinations');
    const countryList = [...new Set(destinations.map(destination => destination.Country))];
    res.json(countryList);
});


router.get('/search', (req, res) => {
    const { destination, region, country, n } = req.query;
    const limit = parseInt(n);
    const destinations = store.get('destinations');
    let matches = destinations.filter(dest => {
        const matchesDestination = destination ? dest.Destination.toLowerCase().includes(destination.toLowerCase()) : false;
        const matchesRegion = region ? dest.Region.toLowerCase().includes(region.toLowerCase()) : false;
        const matchesCountry = country ? dest.Country.toLowerCase().includes(country.toLowerCase()) : false;
        return matchesDestination || matchesRegion || matchesCountry;
    }).slice(0, limit);

    if (matches.length === 0) {
        return res.status(404).json({ error: 'No results found' });
    }
    res.json(matches);
});

router.post('/lists', (req, res) => {
    const listName = req.body.listName;  
    const lists = store.get('lists') || {};
    if (lists[listName]) {
        return res.status(400).json({ error: 'List name already exists' });
    }
    lists[listName] = [];
    store.set('lists', lists);
    saveLists();  
    res.status(201).json({ message: `New list successfully created` });
});

router.put('/lists/:listName', (req, res) => {
    const listName = req.params.listName;  
    const { destinationIds } = req.body;
    const lists = store.get('lists') || {};
    if (!Array.isArray(destinationIds) || !destinationIds.every(id => validateId(id))) {
        return res.status(400).json({ error: 'Invalid destination IDs' });
    }
    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found' });
    }

    lists[listName] = destinationIds;
    store.set('lists', lists);
    saveLists();  
    res.json({ message: `List '${listName}' updated successfully` });
});

router.get('/lists/:listName', (req, res) => {
    const listName = req.params.listName;  
    const lists = store.get('lists') || {};
    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found' });
    }

    res.json({ destinationIds: lists[listName] });
});

router.delete('/lists/:listName', (req, res) => {
    const listName = req.params.listName; 
    const lists = store.get('lists') || {};
    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found' });
    }
    delete lists[listName];
    store.set('lists', lists);
    saveLists();  
    res.json({ message: `List '${listName}' deleted successfully` });
});

router.get('/lists/:listName/details', (req, res) => {
    const listName = req.params.listName;  
    const lists = store.get('lists') || {};
    const destinations = store.get('destinations');
    if (!lists[listName]) {
        return res.status(404).json({ error: 'List not found' });
    }

    const destinationIds = lists[listName];
    const details = destinationIds
        .map(id => destinations.find(dest => dest.id === id))
        .map(destination => ({
            Destination: destination.Destination,
            Region: destination.Region,
            Country: destination.Country,
            Latitude: destination.Latitude,
            Longitude: destination.Longitude,
            Currency: destination.Currency,
            Language: destination.Language
        }));

    if (details.length === 0) {
        return res.status(404).json({ error: 'No destinations found in the list' });
    }
    res.json(details);
});


app.use((err, req, res, next) => {
    console.error(`Error at ${req.method} ${req.url}:`, err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

router.get('/listAll', (req, res) => {
  const lists = store.get('lists') || {};
  res.json(lists);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
