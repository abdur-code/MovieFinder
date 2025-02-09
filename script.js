// api keys - dont share!!
const TMDbApiKey = "1e5c887ac7be4b36ac76920b6fe50cc2"
const TMDB_API_URL = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDbApiKey}`;

async function fetchMovies() {
    try {
        const response = await fetch(TMDB_API_URL);
        const data = await response.json();
        displayMovies(data.results.slice(0,5));  // show first 5 movies only
        //console.log('movies loaded:', data.results);
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
}

function displayMovies(movies) {
    const container = document.getElementById("movies-container");
    container.innerHTML = '';  //clear old movies
    
    movies.forEach(movie => {
        const movieElement = document.createElement("div");
        movieElement.classList.add("movie-card");
        // todo: maybe add hover effect later
        movieElement.innerHTML = `
            <h3>${movie.title}</h3>
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <p>Rating: ${movie.vote_average}</p>
            <button onclick="window.location.href='movie-details.html?movie=${encodeURIComponent(movie.title)}'">View Details</button>
        `;
        container.appendChild(movieElement);
    });
}

// todo: maybe add more api keys later
const tastediveApiKey = "1045748-MoviFind-FC7E21AD";

async function fetchRecommendations(movieTitle) {
    try {
        //first get movie id
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDbApiKey}&query=${encodeURIComponent(movieTitle)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.results || searchData.results.length === 0) {
            console.error('No movie found with that title');
            return;
        }

        const movieId = searchData.results[0].id;

        // get recommendations
        const recommendationsUrl = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDbApiKey}`;
        const recommendationsResponse = await fetch(recommendationsUrl);
        const recommendationsData = await recommendationsResponse.json();

        if (!recommendationsData.results || recommendationsData.results.length === 0) {
            console.error('No recommendations found');
            return;
        }

        displayRecommendations(recommendationsData.results, movieTitle);

    } catch (error) {
        console.error('Error fetching recommendations:', error);
    }
}

// displays movie recommendations in a grid
function displayRecommendations(movies, originalTitle) {
    let container = document.createElement('div');
    container.id = 'recommendations-container';
    
    const existingContainer = document.getElementById('recommendations-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    document.querySelector('.container').appendChild(container);

    container.innerHTML = `
        <h2 class="recommendations-heading oswald-heading">Recommended Movies for "${originalTitle}"</h2>
        <div class="recommendations-grid"></div>
    `;

    const recommendationsGrid = container.querySelector('.recommendations-grid');

    // show only 8 recommendations max
    movies.slice(0,8).forEach(movie => {
        if (movie.poster_path) {
            const recommendationElement = document.createElement("div");
            recommendationElement.classList.add("recommendation-card");
            recommendationElement.onclick = () => {
                window.location.href = `movie-details.html?movie=${encodeURIComponent(movie.title)}`;
            };
            recommendationElement.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <p>${movie.overview.length > 150 ? movie.overview.substring(0,150) + '...' : movie.overview}</p>
                <p>Rating: ${movie.vote_average.toFixed(1)}/10</p>
            `;
            recommendationsGrid.appendChild(recommendationElement);
        }
    });
}

// search stuff
async function showSearchSuggestions(searchTerm) {
    if (!searchTerm.trim()) {
        hideSearchSuggestions();
        return;
    }

    try {
        const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDbApiKey}&query=${encodeURIComponent(searchTerm)}&page=1`
        );
        const data = await response.json();
        
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;

        if (data.results && data.results.length > 0) {
            let suggestionsHtml = '';
            data.results.slice(0,5).forEach(movie => {
                suggestionsHtml += `
                    <div class='suggestion-item' onclick="selectSuggestion('${movie.title.replace(/'/g, "\\'")}')">
                        <img src="${movie.poster_path ? 'https://image.tmdb.org/t/p/w92'+movie.poster_path : 'https://via.placeholder.com/92x138?text=No+Image'}" alt="${movie.title}">
                        <div class="suggestion-info">
                            <div class="suggestion-title">${movie.title}</div>
                            <div class="suggestion-year">${movie.release_date ? '('+movie.release_date.split('-')[0] + ')' : ''}</div>
                        </div>
                    </div>`;
            });
            suggestionsContainer.innerHTML = suggestionsHtml;
            suggestionsContainer.style.display = 'block';
        } else {
            hideSearchSuggestions();
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
}

function selectSuggestion(movieTitle) {
    window.location.href = `movie-details.html?movie=${encodeURIComponent(movieTitle)}`;
}

function searchMovie() {
    const searchTerm = document.getElementById('movie-search').value;
    if (searchTerm.trim()) {
        hideSearchSuggestions();
        window.location.href = `movie-details.html?movie=${encodeURIComponent(searchTerm)}`;
    }
}

// hide suggestions when clicking outside
document.addEventListener('click', (event) => {
    const suggestionsContainer = document.getElementById('search-suggestions');
    const searchInput = document.getElementById('movie-search');
    
    if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== searchInput) {
        hideSearchSuggestions();
    }
});

// load movies when page loads
window.onload = fetchMovies;

