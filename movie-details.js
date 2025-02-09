const TMDbApiKey = "1e5c887ac7be4b36ac76920b6fe50cc2";
const OMDB_API_KEY = "621ae8cf";

// get movie details from url params
const urlParams = new URLSearchParams(window.location.search);
const movieTitle = urlParams.get('movie');

// load everything when page loads
window.onload = async () => {
    if (movieTitle) {
        await fetchMovieDetails(movieTitle);
    } else {
        showError('No movie selected');
    }
};

async function fetchMovieDetails(title) {
    try {
        //first search tmdb
        const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDbApiKey}&query=${encodeURIComponent(title)}`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (!data.results?.length) {
            throw new Error('Movie not found');
        }

        const movie = data.results[0]; // get first match
        //console.log('found movie:', movie)

        // get full movie details
        const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDbApiKey}&append_to_response=videos,credits`;
        const detailsResponse = await fetch(detailsUrl);
        const movieDetails = await detailsResponse.json();

        // get omdb stuff too
        const omdbData = await getOMDBDetails(title);
        //console.log('omdb data:', omdbData)

        displayMovieDetails(movieDetails, omdbData);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
}

// get extra details from omdb
async function getOMDBDetails(title) {
    try {
        const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();
        return data.Response === "True" ? data : null;
    } catch (error) {
        console.error('Error getting OMDB data:', error);
        return null; // dont break if omdb fails
    }
}

function displayMovieDetails(movie, omdbData = null) {
    const container = document.getElementById('movie-details');
    
    // find trailer if there is one
    const trailerKey = movie.videos?.results?.find(video => video.type === "Trailer")?.key;
    const trailerLink = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : '#';

    // get top 6 cast members
    const topCast = movie.credits?.cast?.slice(0, 6) || [];
    const castHTML = topCast.map(actor => `
        <div class="cast-member">
            <img src="${actor.profile_path ? 'https://image.tmdb.org/t/p/w185' + actor.profile_path : 'https://via.placeholder.com/185x278?text=No+Image'}" 
                 alt="${actor.name}">
            <h3>${actor.name}</h3>
            <p>${actor.character}</p>
        </div>
    `).join('');

    // add ratings if we have omdb data
    const ratingsHTML = omdbData?.Ratings ? `
        <div class="ratings-section">
            <h3 class="oswald-heading">Ratings</h3>
            <div class="ratings-container">
                ${omdbData.Ratings.map(rating => `
                    <div class="rating-item">
                        <span class="rating-source">${rating.Source}</span>
                        <span class="rating-value">${rating.Value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    // extra info from omdb
    const additionalInfoHTML = omdbData ? `
        <div class="additional-info">
            ${omdbData.Awards ? `<p><strong>Awards:</strong> ${omdbData.Awards}</p>` : ''}
            ${omdbData.Director ? `<p><strong>Director:</strong> ${omdbData.Director}</p>` : ''}
            ${omdbData.Writer ? `<p><strong>Writer:</strong> ${omdbData.Writer}</p>` : ''}
            ${omdbData.BoxOffice ? `<p><strong>Box Office:</strong> ${omdbData.BoxOffice}</p>` : ''}
            ${omdbData.Runtime ? `<p><strong>Runtime:</strong> ${omdbData.Runtime}</p>` : ''}
        </div>
    ` : '';

    // put it all together
    container.innerHTML = `
        <div class="movie-details-card">
            <h1 class="oswald-heading">${movie.title}</h1>
            <div class="movie-content">
                <img class="movie-image" src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                <div class="movie-info">
                    <p>${movie.overview}</p>
                    ${additionalInfoHTML}
                    ${ratingsHTML}
                    <div class="button-group">
                        ${trailerKey ? `<button onclick="window.open('${trailerLink}', '_blank')" class="trailer-button">Watch Trailer</button>` : ''}
                        <button onclick="fetchRecommendations(${movie.id})">Get Recommendations</button>
                    </div>
                </div>
            </div>
            <div class="cast-section">
                <h2 class="oswald-heading">Cast</h2>
                <div class="cast-container">
                    ${castHTML}
                </div>
            </div>
        </div>
    `;
}

// get movie recommendations
async function fetchRecommendations(movieId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/recommendations?api_key=${TMDbApiKey}`);
        const data = await response.json();
        
        if (data.results?.length) {
            displayRecommendations(data.results);
        }
    } catch (error) {
        console.error('Error getting recommendations:', error);
    }
}

// show recommendations in a grid
function displayRecommendations(movies) {
    // remove old recommendations first
    const existingRecs = document.querySelector('.recommendations-section');
    if (existingRecs) {
        existingRecs.remove();
    }

    const container = document.getElementById('movie-details');
    const recommendationsSection = document.createElement('div');
    recommendationsSection.className = 'recommendations-section';
    recommendationsSection.innerHTML = `
        <h2 class="oswald-heading">Recommended Movies</h2>
        <div class="recommendations-grid">
            ${movies.slice(0, 6).map(movie => `
                <div class="recommendation-card" onclick="window.location.href='movie-details.html?movie=${encodeURIComponent(movie.title)}'">
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                    <h3>${movie.title}</h3>
                    <p>${movie.overview.substring(0, 100)}...</p>
                    <p>Rating: ${movie.vote_average.toFixed(1)}/10</p>
                </div>
            `).join('')}
        </div>
    `;
    container.appendChild(recommendationsSection);
}

function showError(message) {
    const container = document.getElementById('movie-details');
    container.innerHTML = `
        <div class="error-message">
            <h2 class="oswald-heading">Error Loading Movie</h2>
            <p>${message || 'Something went wrong :('}</p>
            <button onclick="window.location.href='index.html'">Go Home</button>
        </div>
    `;
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
            data.results.slice(0, 5).forEach(movie => {
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

// hide suggestions if click outside
document.addEventListener('click', (event) => {
    const suggestionsContainer = document.getElementById('search-suggestions');
    const searchInput = document.getElementById('movie-search');
    
    if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== searchInput) {
        hideSearchSuggestions();
    }
}); 