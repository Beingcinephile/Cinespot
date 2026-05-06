// Main application logic
let allMovies = [];
let categories = [];
let currentUser = null;
let favorites = [];
let currentCategory = 'all';
let autoPlayInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    loadCategories();
    loadUserSession();
    setupEventListeners();
    setupBottomNav();
    setupFullSearch();
    setupCategoryView();
});

async function loadMovies() {
    showLoading(true);
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const jsonText = text.substring(47, text.length - 2);
        const data = JSON.parse(jsonText);
        
        const rows = data.table.rows;
        if (rows && rows.length > 1) {
            allMovies = [];
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].c;
                if (row && row[0] && row[0].v) {
                    allMovies.push({
                        id: row[0]?.v || i,
                        title: row[1]?.v || 'Untitled',
                        year: row[2]?.v || 'N/A',
                        rating: row[3]?.v || '0',
                        posterUrl: row[4]?.v || '',
                        trailerUrl: row[5]?.v || '',
                        genre: row[6]?.v || 'Uncategorized',
                        duration: row[7]?.v || 'N/A',
                        director: row[8]?.v || 'Unknown',
                        language: row[9]?.v || 'N/A',
                        inSlider: row[10]?.v === 'TRUE',
                        downloadUrl480: row[11]?.v || '',
                        downloadUrl720: row[12]?.v || '',
                        downloadUrl1080: row[13]?.v || ''
                    });
                }
            }
        }
        console.log("Movies loaded:", allMovies.length);
        
        displayMovies();
        setupFeatured();
        displayFavorites();
        displayCategories();
    } catch (error) {
        console.error('Error loading movies:', error);
        const grid = document.getElementById('movieGrid');
        if (grid) grid.innerHTML = '<p style="text-align:center">Error loading movies. Check Google Sheet connection.</p>';
    }
    showLoading(false);
}

function setupFeatured() {
    // EDIT THE IDs BELOW - Add movie IDs you want in slider
    const featuredIds = [55, 52, 51, 48, 43, 34, 24];
    
    const featuredMovies = allMovies.filter(m => featuredIds.includes(m.id));
    const container = document.getElementById('featuredSlider');
    
    if (!container) return;
    
    if (featuredMovies.length === 0) {
        container.innerHTML = '<div style="text-align:center; width:100%; padding:40px; background:#1a1a2e; border-radius:20px;">⭐ Edit featuredIds in script.js to add movies to slider</div>';
        return;
    }
    
    container.innerHTML = featuredMovies.map(movie => `
        <div class="slider-card" onclick="openMovie(${movie.id})">
            <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
            <h4>${movie.title}</h4>
        </div>
    `).join('');
    
    const dotsContainer = document.getElementById('featuredDots');
    if (dotsContainer && featuredMovies.length > 0) {
        dotsContainer.innerHTML = '';
        for (let i = 0; i < featuredMovies.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.onclick = () => {
                const sliderEl = document.getElementById('featuredSlider');
                const cardWidth = sliderEl.firstChild?.offsetWidth + 15 || 165;
                sliderEl.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
            };
            dotsContainer.appendChild(dot);
        }
    }
    
    const prevBtn = document.querySelector('.prev-featured-btn');
    const nextBtn = document.querySelector('.next-featured-btn');
    const sliderEl = document.getElementById('featuredSlider');
    
    if (prevBtn && nextBtn && sliderEl) {
        prevBtn.onclick = () => sliderEl.scrollBy({ left: -165, behavior: 'smooth' });
        nextBtn.onclick = () => sliderEl.scrollBy({ left: 165, behavior: 'smooth' });
    }
    
    if (sliderEl && dotsContainer) {
        sliderEl.addEventListener('scroll', () => {
            const cardWidth = sliderEl.firstChild?.offsetWidth + 15 || 165;
            const scrollPosition = sliderEl.scrollLeft;
            const activeIndex = Math.round(scrollPosition / cardWidth);
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, idx) => {
                if (idx === activeIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        });
    }
}

function loadCategories() {
    const saved = localStorage.getItem('movie_categories');
    if (saved) {
        categories = JSON.parse(saved);
    } else {
        categories = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
        saveCategories();
    }
}

function saveCategories() {
    localStorage.setItem('movie_categories', JSON.stringify(categories));
}

function displayCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    let uniqueCategories = [];
    
    allMovies.forEach(movie => {
        if (movie.genre && movie.genre !== 'Uncategorized') {
            const genres = movie.genre.split(',').map(g => g.trim());
            genres.forEach(genre => {
                if (genre && !uniqueCategories.includes(genre)) {
                    uniqueCategories.push(genre);
                }
            });
        }
    });
    
    uniqueCategories.sort();
    
    let html = '<button class="category-btn active" data-category="all">All Movies</button>';
    uniqueCategories.forEach(cat => {
        html += `<button class="category-btn" data-category="${cat}">${cat}</button>`;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('#categoriesList .category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#categoriesList .category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            showMoviesByCategory(category);
        });
    });
}

function showMoviesByCategory(category) {
    const container = document.getElementById('categoryMovies');
    if (!container) return;
    
    let filtered;
    if (category === 'all') {
        filtered = [...allMovies].reverse();
    } else {
        filtered = allMovies.filter(movie => {
            if (!movie.genre || movie.genre === 'Uncategorized') return false;
            const genres = movie.genre.split(',').map(g => g.trim());
            return genres.includes(category);
        }).reverse();
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1">No movies in this category</p>';
        return;
    }
    
    container.innerHTML = filtered.map(movie => `
        <div class="movie-card" onclick="openMovie(${movie.id})">
            <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
            <h4>${movie.title} (${movie.year})</h4>
            <div class="movie-card-fav ${isFavorite(movie.id) ? 'active' : ''}" onclick="toggleFavorite(event, ${movie.id})">
                <i class="fas fa-star"></i>
                <span>Add to Favourite</span>
            </div>
        </div>
    `).join('');
}

function displayMovies() {
    const grid = document.getElementById('movieGrid');
    if (!grid) return;
    
    let filtered = [...allMovies].reverse();
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1">No movies found. Add some to your Google Sheet!</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(movie => `
        <div class="movie-card" onclick="openMovie(${movie.id})">
            <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
            <h4>${movie.title} (${movie.year})</h4>
            <div class="movie-card-fav ${isFavorite(movie.id) ? 'active' : ''}" onclick="toggleFavorite(event, ${movie.id})">
                <i class="fas fa-star"></i>
                <span>Add to Favourite</span>
            </div>
        </div>
    `).join('');
}

function toggleFavorite(event, movieId) {
    event.stopPropagation();
    if (!currentUser) {
        alert('Please login first to save favorites!');
        return;
    }
    
    const index = favorites.indexOf(movieId);
    if (index === -1) {
        favorites.push(movieId);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    displayMovies();
    displayFavorites();
    setupFeatured();
    
    const isFav = favorites.includes(movieId);
    const btn = event.currentTarget;
    if (isFav) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

function isFavorite(movieId) {
    return favorites.includes(movieId);
}

function saveFavorites() {
    if (currentUser) {
        localStorage.setItem(`favorites_${currentUser}`, JSON.stringify(favorites));
    }
}

function loadFavorites() {
    if (currentUser) {
        const saved = localStorage.getItem(`favorites_${currentUser}`);
        favorites = saved ? JSON.parse(saved) : [];
    } else {
        favorites = [];
    }
    displayFavorites();
}

function displayFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;
    
    const favMovies = allMovies.filter(m => favorites.includes(m.id));
    if (favMovies.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center">No favorites yet. Tap ★ on movies!</p>';
        return;
    }
    
    container.innerHTML = favMovies.map(movie => `
        <div class="fav-card" onclick="openMovie(${movie.id})">
            <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
            <h4>${movie.title}</h4>
        </div>
    `).join('');
}

function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.onclick = loginUser;
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logoutUser;
    
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) adminBtn.onclick = () => window.location.href = 'admin.html';
    
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.onclick = () => window.history.back();
}

function loginUser() {
    const username = document.getElementById('dummyUsername').value.trim();
    const password = document.getElementById('dummyPassword').value;
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    loadFavorites();
    
    document.getElementById('loggedOutView').style.display = 'none';
    document.getElementById('loggedInView').style.display = 'block';
    document.getElementById('currentUser').textContent = currentUser;
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    favorites = [];
    
    document.getElementById('loggedOutView').style.display = 'block';
    document.getElementById('loggedInView').style.display = 'none';
    
    displayMovies();
    displayFavorites();
    setupFeatured();
}

function loadUserSession() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = saved;
        document.getElementById('loggedOutView').style.display = 'none';
        document.getElementById('loggedInView').style.display = 'block';
        document.getElementById('currentUser').textContent = currentUser;
        loadFavorites();
    }
}

function openMovie(movieId) {
    const movie = allMovies.find(m => m.id == movieId);
    if (movie) {
        localStorage.setItem('selectedMovie', JSON.stringify(movie));
        window.location.href = 'movie.html';
    }
}

function openTrailer(url) {
    if (!url || url === '') {
        alert('Trailer not available');
        return;
    }
    window.open(url, '_blank');
}

function downloadQuality(url) {
    if (!url || url === '') {
        alert('Download link not available');
        return;
    }
    window.open(url, '_blank');
}

function openTelegram() {
    // CHANGE THIS LINK TO YOUR TELEGRAM CHANNEL LINK
    const telegramLink = 'https://t.me/yourCineSpot';
    window.open(telegramLink, '_blank');
}

function showLoading(show) {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.style.display = show ? 'block' : 'none';
}

// Movie detail page handler
if (window.location.pathname.includes('movie.html')) {
    const movieData = localStorage.getItem('selectedMovie');
    if (movieData) {
        const movie = JSON.parse(movieData);
        const container = document.getElementById('movieDetailContainer');
        if (container) {
            const isFav = favorites.includes(movie.id);
            
            container.innerHTML = `
                <div class="movie-detail-card">
                    <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                    <div class="movie-info">
                        <h2>${movie.title} (${movie.year})</h2>
                        
                        <div class="movie-buttons">
                            <button class="trailer-btn" onclick="openTrailer('${movie.trailerUrl || ''}')">
                                <i class="fas fa-play"></i> Watch Trailer
                            </button>
                            <button class="favourite-btn ${isFav ? 'active' : ''}" onclick="toggleFavouriteFromDetail(${movie.id})">
                                <i class="fas fa-star"></i> Add to Favourite
                            </button>
                        </div>
                        
                        <div class="telegram-btn-container">
                            <button class="telegram-join-btn" onclick="openTelegram()">
                                <i class="fab fa-telegram-plane"></i> Join Telegram
                            </button>
                        </div>
                        
                        <div class="download-divider"></div>
                        
                        <div class="download-section">
                            <div class="download-title">
                                <i class="fas fa-download"></i> DOWNLOAD
                            </div>
                            <div class="quality-buttons">
                                <button class="quality-btn" onclick="downloadQuality('${movie.downloadUrl480 || ''}')">480p</button>
                                <button class="quality-btn" onclick="downloadQuality('${movie.downloadUrl720 || ''}')">720p</button>
                                <button class="quality-btn" onclick="downloadQuality('${movie.downloadUrl1080 || ''}')">1080p</button>
                            </div>
                        </div>
                        
                        <div class="info-grid">
                            <div class="info-row">
                                <span class="info-label">RELEASE YEAR</span>
                                <span class="info-value">${movie.year || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">RATING</span>
                                <span class="info-value rating-value">⭐ ${movie.rating || 'N/A'}/10</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">GENRE</span>
                                <span class="info-value">${movie.genre || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">DURATION</span>
                                <span class="info-value">${movie.duration || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">DIRECTOR</span>
                                <span class="info-value">${movie.director || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">LANGUAGE</span>
                                <span class="info-value">${movie.language || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

function toggleFavouriteFromDetail(movieId) {
    if (!currentUser) {
        alert('Please login first to save favorites!');
        return;
    }
    
    const index = favorites.indexOf(movieId);
    if (index === -1) {
        favorites.push(movieId);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    
    const favBtn = document.querySelector('.favourite-btn');
    if (favBtn) {
        if (favorites.includes(movieId)) {
            favBtn.classList.add('active');
        } else {
            favBtn.classList.remove('active');
        }
    }
    
    displayFavorites();
    setupFeatured();
}

// ===== BOTTOM NAVIGATION FUNCTIONS =====
function setupBottomNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const homeSection = document.getElementById('homeSection');
    const searchSection = document.getElementById('searchSection');
    const categoriesSection = document.getElementById('categoriesSection');
    const accountSection = document.getElementById('accountSection');
    const userSection = document.getElementById('userSection');
    
    function showPage(page) {
        if (homeSection) homeSection.style.display = 'none';
        if (searchSection) searchSection.style.display = 'none';
        if (categoriesSection) categoriesSection.style.display = 'none';
        if (accountSection) accountSection.style.display = 'none';
        
        if (userSection) {
            if (page === 'account') {
                userSection.style.display = 'none';
            } else {
                userSection.style.display = 'block';
            }
        }
        
        if (page === 'home' && homeSection) homeSection.style.display = 'block';
        if (page === 'search' && searchSection) searchSection.style.display = 'block';
        if (page === 'categories' && categoriesSection) categoriesSection.style.display = 'block';
        if (page === 'account' && accountSection) accountSection.style.display = 'block';
        
        navItems.forEach(item => {
            if (item.dataset.page === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        if (page === 'account') {
            displayFavorites();
        }
        if (page === 'categories') {
            displayCategories();
        }
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            showPage(page);
            
            if (page === 'search') {
                const searchInput = document.getElementById('searchInputFull');
                if (searchInput) searchInput.focus();
            }
        });
    });
    
    showPage('home');
}

function setupFullSearch() {
    const searchInput = document.getElementById('searchInputFull');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const resultsContainer = document.getElementById('searchResults');
        
        if (!resultsContainer) return;
        
        if (searchTerm.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; grid-column:1/-1">🔍 Start typing to search movies...</p>';
            return;
        }
        
        const filtered = allMovies.filter(movie => 
            movie.title.toLowerCase().includes(searchTerm) ||
            movie.genre.toLowerCase().includes(searchTerm) ||
            movie.director.toLowerCase().includes(searchTerm) ||
            movie.year.toString().includes(searchTerm)
        );
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align:center; grid-column:1/-1">❌ No movies found for "' + searchTerm + '"</p>';
            return;
        }
        
        resultsContainer.innerHTML = filtered.map(movie => `
            <div class="movie-card" onclick="openMovie(${movie.id})">
                <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                <h4>${movie.title} (${movie.year})</h4>
                <div class="movie-card-fav ${isFavorite(movie.id) ? 'active' : ''}" onclick="toggleFavorite(event, ${movie.id})">
                    <i class="fas fa-star"></i>
                    <span>Add to Favourite</span>
                </div>
            </div>
        `).join('');
    });
}

function setupCategoryView() {
    const categoryMoviesContainer = document.getElementById('categoryMovies');
    if (!categoryMoviesContainer) return;
                    }
