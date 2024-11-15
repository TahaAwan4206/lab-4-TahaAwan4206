document.addEventListener("DOMContentLoaded", () => {
    let currentPage = 1;
    let resultsPerPage = 5;
    let allResults = [];
    let map;

    const searchBtn = document.getElementById("search-btn");
    const createListBtn = document.getElementById("create-list-btn");
    const listsOutput = document.getElementById("lists-output");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");

    searchBtn.addEventListener("click", searchDestinations);
    createListBtn.addEventListener("click", createList);
    prevPageBtn.addEventListener("click", () => changePage(-1));
    nextPageBtn.addEventListener("click", () => changePage(1));

    initializeMap();
    fetchAndDisplayLists();

    function fetchAndDisplayLists() {
        fetch('/api/listAll')
            .then(response => response.json())
            .then(lists => {
                listsOutput.innerHTML = ""; 
    
                Object.keys(lists).forEach(listName => {
                    const listCard = createListCard(listName);
                    listsOutput.appendChild(listCard);
                });
            })
            .catch(() => alert("Unable to retrieve favorite lists. Please try again later."));
    }

    function initializeMap() {
        map = L.map('map').setView([51.505, -0.09], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }

    function sanitizeInput(input) {
        const regex = /^[A-Za-z\s]+$/;
        return regex.test(input) ? input : null;
    }

    function searchDestinations() {
        const query = document.getElementById("search-input").value.trim();
        const sanitizedQuery = sanitizeInput(query);
        resultsPerPage = parseInt(document.getElementById("results-limit").value) || 5; 
        const totalLimit = parseInt(document.getElementById("total-results-limit").value) || resultsPerPage * 10; 
    
        if (!sanitizedQuery) {
            alert("Enter a valid search term containing letters only.");
            return;
        }
    
        fetchResults(sanitizedQuery, resultsPerPage, totalLimit);
    }
    
    
    function fetchResults(query, resultsPerPage, totalLimit) {
        const searchParams = new URLSearchParams({
            destination: query,
            region: query,
            country: query,
            n: totalLimit 
        });
    
        fetch(`/api/search?${searchParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    alert("No results found.");
                    return;
                }
                allResults = data;
                currentPage = 1;
                updatePage();
            })
            .catch(error => console.error("Error fetching results:", error));
    }

    function updatePage() {
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const pageResults = allResults.slice(startIndex, endIndex);
        displayResults(pageResults, "results");
        updatePagination();
        updateMapMarkers(pageResults);
    }
    

    function displayResults(data, targetId) {
        const target = document.getElementById(targetId);
        target.innerHTML = ""; 
        data.forEach(item => {
            const resultItem = document.createElement("div");
            resultItem.classList.add("result-item");
    
            const resultContent = document.createElement("span");
            resultContent.classList.add("result-item-content");
            const sanitizedText = document.createTextNode(`Destination: ${item.Destination}, Region: ${item.Region}, Country: ${item.Country}`);
            resultContent.appendChild(sanitizedText);
    
            resultItem.addEventListener("click", () => {
                const allDetails = `
                    Destination: ${item.Destination}
                    Region: ${item.Region}
                    Country: ${item.Country}
                    Latitude: ${item.Latitude}
                    Longitude: ${item.Longitude}
                    Currency: ${item.Currency}
                    Language: ${item.Language}
                `;
                alert(allDetails);
            });
            const addToListBtn = document.createElement("button");
            addToListBtn.classList.add("add-to-list-btn");
            addToListBtn.textContent = "Add to List";
            addToListBtn.addEventListener("click", (e) => {
                e.stopPropagation(); 
                addToFavorites(item.id);
            });
    
            resultItem.appendChild(resultContent);
            resultItem.appendChild(addToListBtn);
            target.appendChild(resultItem);
        });
    }
    

    function createList() {
        const listNameInput = document.getElementById("list-name-input").value.trim();
        const listName = sanitizeInput(listNameInput);
        if (!listName) {
            alert("Please enter a valid list name containing letters only.");
            return;
        }

        fetch('/api/lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listName })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                const listCard = createListCard(listName);
                listsOutput.appendChild(listCard);
            } else if (data.error) {
                alert(`Error: ${data.error}`);
            }
        })
        .catch(error => console.error("Error creating list:", error));
    }


    function sortDestinations(details, criterion) {
        return details.sort((a, b) => {
            const aValue = a[criterion] ? a[criterion].toLowerCase() : '';
            const bValue = b[criterion] ? b[criterion].toLowerCase() : '';
            return aValue.localeCompare(bValue);
        });
    }


    function createListCard(listName) {
        const listCard = document.createElement("div");
        listCard.classList.add("list-card");
        listCard.dataset.listName = listName;
        
        const title = document.createElement("h3");
        title.classList.add("list-title");
        title.textContent = listName;
        listCard.appendChild(title);
        
        const contents = document.createElement("div");
        contents.classList.add("list-contents");

        fetch(`/api/lists/${listName}/details`)
            .then(response => response.json())
            .then(details => {
        
                const sortOption = document.getElementById("sort-options").value.toLowerCase();
                const sortedDetails = sortDestinations(details, sortOption === 'destination' ? 'Destination' : sortOption === 'country' ? 'Country' : 'Region');

                sortedDetails.forEach(detail => {
                    const detailDiv = document.createElement("div");
                    detailDiv.classList.add("destination-detail");

                    detailDiv.innerHTML = `
                        <p><strong>Destination:</strong> ${detail.Destination}</p>
                        <p><strong>Region:</strong> ${detail.Region}</p>
                        <p><strong>Country:</strong> ${detail.Country}</p>
                        <p><strong>Latitude:</strong> ${detail.Latitude}</p>
                        <p><strong>Longitude:</strong> ${detail.Longitude}</p>
                        <p><strong>Currency:</strong> ${detail.Currency}</p>
                        <p><strong>Language:</strong> ${detail.Language}</p>
                    `;

                    contents.appendChild(detailDiv);
                });
            })
            .catch(error => console.error("Error fetching destination details:", error));
        
        listCard.appendChild(contents);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete List";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => deleteList(listName, listCard));
        listCard.appendChild(deleteBtn);
    
        return listCard;
    }

    document.getElementById("sort-btn").addEventListener("click", () => {
        fetchAndDisplayLists();
    });

    function addToFavorites(destinationId) {
        const listName = prompt("Enter the list name to add this destination:");
        const sanitizedListName = sanitizeInput(listName);
        if (!sanitizedListName) {
            alert("Please enter a valid list name containing letters only.");
            return;
        }

        fetch(`/api/destinations/${destinationId}`)
            .then(response => response.json())
            .then(destination => {
                if (!destination || destination.error) {
                    alert(`Error: Destination not found`);
                    return;
                }

                fetch(`/api/lists/${sanitizedListName}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error("List does not exist");
                        }
                        return response.json();
                    })
                    .then(data => {
                        const existingDestinationIds = data.destinationIds || [];
    
                        if (!existingDestinationIds.includes(destinationId)) {
                            existingDestinationIds.push(destinationId);

                            return fetch(`/api/lists/${sanitizedListName}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ destinationIds: existingDestinationIds })
                            });
                        } else {
                            alert("This destination is already in the list.");
                            throw new Error("Duplicate destination");
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        const listCard = document.querySelector(`.list-card[data-list-name="${sanitizedListName}"] .list-contents`);
                        if (listCard) {
                            const destinationItem = document.createElement("div");
                            destinationItem.innerHTML = 
                            `<p><strong>Destination:</strong> ${destination.Destination}</p>
                            <p><strong>Region:</strong> ${destination.Region}</p>
                            <p><strong>Country:</strong> ${destination.Country}</p>
                        `;
                        listCard.appendChild(destinationItem);
                    }
                    fetchAndDisplayLists();
                })
                .catch(error => {
                    if (error.message !== "Duplicate destination") {
                        alert("No list of given name found");
                    }
                });
        })
        .catch(error => console.error("Error fetching destination details:", error));
}

function deleteList(listName, listCard) {
    const sanitizedListName = sanitizeInput(listName);
    if (!sanitizedListName) {
        alert("Please enter a valid list name containing letters only.");
        return;
    }

    fetch(`/api/lists/${encodeURIComponent(sanitizedListName)}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            listCard.remove(); 
        } else if (data.error) {
            alert(`Error: ${data.error}`);
        }
    })
    .catch(error => console.error("Error deleting list:", error));
}

function updatePagination() {
    const totalPages = Math.ceil(allResults.length / resultsPerPage);
    const pageInfo = document.getElementById("page-info");
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

function updateMapMarkers(destinations) {
    if (!map) return;
    if (map.hasLayer(map.markersLayer)) map.removeLayer(map.markersLayer);

    map.markersLayer = L.layerGroup().addTo(map);
    destinations.forEach(dest => {
        if (dest.Latitude && dest.Longitude) {
            const marker = L.marker([dest.Latitude, dest.Longitude])
                .bindPopup(`<b>${dest.Destination}</b><br>${dest.Region}, ${dest.Country}`);
            map.markersLayer.addLayer(marker);
        }
    });
}

function changePage(direction) {
    currentPage += direction;
    updatePage();
}
});

