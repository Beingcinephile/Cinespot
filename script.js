// Main application logic
let allMovies = [];
let categories = [];
let currentUser = null;
let favorites = [];
let currentCategory = 'all';
let autoPlayInterval = null;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', function() {
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
                        downloadUrl1080: row[13]?.v || '',
                        sourceType: row[14]?.v || '',
                        releaseDate: row[15]?.v || '',
                        uploadProgress: row[16]?.v || 0,
                        status: row[17]?.v || ''
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
        var grid = document.getElementById('movieGrid');
        if (grid) grid.innerHTML = '<p style="text-align:center">Error loading movies. Check Google Sheet connection.</p>';
    }
    showLoading(false);
}

function setupFeatured() {
    var featuredIds = [1, 2, 3, 4, 5, 6, 7];
    
    var featuredMovies = allMovies.filter(function(m) { return featuredIds.includes(m.id); });
    var container = document.getElementById('featuredSlider');
    
    if (!container) return;
    
    if (featuredMovies.length === 0) {
        container.innerHTML = '<div style="text-align:center; width:100%; padding:40px;">⭐ Edit featuredIds in script.js to add movies to slider</div>';
        return;
    }
    
    container.innerHTML = featuredMovies.map(function(movie) {
        var badgeHtml = '';
        if (movie.sourceType === 'WEB-DL') {
            badgeHtml = '<div class="source-badge badge-webdl">WEB-DL</div>';
        } else if (movie.sourceType === 'HDTC') {
            badgeHtml = '<div class="source-badge badge-hdtc">HDTC</div>';
        } else if (movie.sourceType === 'BLURAY') {
            badgeHtml = '<div class="source-badge badge-bluray">BLURAY</div>';
        } else if (movie.sourceType === 'REMUX') {
            badgeHtml = '<div class="source-badge badge-remux">REMUX</div>';
        } else if (movie.sourceType === 'UPCOMING') {
            badgeHtml = '<div class="source-badge badge-upcoming">UPCOMING</div>';
        }
        
        return '<div class="slider-card" onclick="openMovie(' + movie.id + ')">' +
            badgeHtml +
            '<img src="' + movie.posterUrl + '" alt="' + movie.title + '" onerror="this.src=\'https://via.placeholder.com/300x450?text=No+Poster\'">' +
            '<h4>' + movie.title + '</h4>' +
        '</div>';
    }).join('');
    
    var dotsContainer = document.getElementById('featuredDots');
    if (dotsContainer && featuredMovies.length > 0) {
        dotsContainer.innerHTML = '';
        for (var i = 0; i < featuredMovies.length; i++) {
            var dot = document.createElement('div');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.onclick = (function(index) {
                return function() {
                    var sliderEl = document.getElementById('featuredSlider');
                    var cardWidth = 165;
                    sliderEl.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
                };
            })(i);
            dotsContainer.appendChild(dot);
        }
    }
    
    var prevBtn = document.querySelector('.prev-featured-btn');
    var nextBtn = document.querySelector('.next-featured-btn');
    var sliderEl = document.getElementById('featuredSlider');
    
    if (prevBtn && nextBtn && sliderEl) {
        prevBtn.onclick = function() { sliderEl.scrollBy({ left: -165, behavior: 'smooth' }); };
        nextBtn.onclick = function() { sliderEl.scrollBy({ left: 165, behavior: 'smooth' }); };
    }
    
    if (sliderEl && dotsContainer) {
        sliderEl.addEventListener('scroll', function() {
            var cardWidth = 165;
            var scrollPosition = sliderEl.scrollLeft;
            var activeIndex = Math.round(scrollPosition / cardWidth);
            var dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach(function(dot, idx) {
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
    var saved = localStorage.getItem('movie_categories');
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
    var container = document.getElementById('categoriesList');
    if (!container) return;
    
    var uniqueCategories = [];
    
    allMovies.forEach(function(movie) {
        if (movie.genre && movie.genre !== 'Uncategorized') {
            var genres = movie.genre.split(',').map(function(g) { return g.trim(); });
            genres.forEach(function(genre) {
                if (genre && !uniqueCategories.includes(genre)) {
                    uniqueCategories.push(genre);
                }
            });
        }
    });
    
    uniqueCategories.sort();
    
    var html = '<button class="category-btn active" data-category="all">All Movies</button>';
    uniqueCategories.forEach(function(cat) {
        html += '<button class="category-btn" data-category="' + cat + '">' + cat + '</button>';
    });
    container.innerHTML = html;
    
    document.querySelectorAll('#categoriesList .category-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#categoriesList .category-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var category = btn.dataset.category;
            showMoviesByCategory(category);
        });
    });
}

function showMoviesByCategory(category) {
    var container = document.getElementById('categoryMovies');
    if (!container) return;
    
    var filtered;
    var categoryDisplayName = category;
    
    if (category === 'all') {
        filtered = allMovies.slice().reverse();
        categoryDisplayName = 'All Movies';
    } else {
        filtered = allMovies.filter(function(movie) {
            if (!movie.genre || movie.genre === 'Uncategorized') return false;
            var genres = movie.genre.split(',').map(function(g) { return g.trim(); });
            return genres.includes(category);
        }).reverse();
        categoryDisplayName = category;
    }
    
    var countHtml = 
        '<div class="category-count-banner">' +
            '<span class="count-banner-icon">📊</span>' +
            '<span class="count-banner-text">' + filtered.length + ' result' + (filtered.length > 1 ? 's' : '') + ' found in <strong>' + categoryDisplayName + '</strong></span>' +
        '</div>';
    
    if (filtered.length === 0) {
        container.innerHTML = countHtml +
            '<p style="text-align:center; grid-column:1/-1; color: rgba(255,255,255,0.4); padding: 30px;">' +
            'No movies in this category</p>';
        return;
    }
    
    container.innerHTML = countHtml + filtered.map(function(movie) {
        var badgeHtml = '';
        if (movie.sourceType === 'WEB-DL') {
            badgeHtml = '<div class="source-badge badge-webdl">WEB-DL</div>';
        } else if (movie.sourceType === 'HDTC') {
            badgeHtml = '<div class="source-badge badge-hdtc">HDTC</div>';
        } else if (movie.sourceType === 'BLURAY') {
            badgeHtml = '<div class="source-badge badge-bluray">BLURAY</div>';
        } else if (movie.sourceType === 'REMUX') {
            badgeHtml = '<div class="source-badge badge-remux">REMUX</div>';
        } else if (movie.sourceType === 'UPCOMING') {
            badgeHtml = '<div class="source-badge badge-upcoming">UPCOMING</div>';
        }
        
        return '<div class="movie-card" onclick="openMovie(' + movie.id + ')">' +
            badgeHtml +
            '<img src="' + movie.posterUrl + '" alt="' + movie.title + '" onerror="this.src=\'https://via.placeholder.com/300x450?text=No+Poster\'">' +
            '<h4>' + movie.title + ' (' + movie.year + ')</h4>' +
            '<div class="movie-card-fav ' + (isFavorite(movie.id) ? 'active' : '') + '" onclick="toggleFavorite(event, ' + movie.id + ')">' +
            '<i class="fas fa-star"></i>' +
            '<span>Add to Favourite</span>' +
            '</div>' +
        '</div>';
    }).join('');
}

function displayMovies() {
    var grid = document.getElementById('movieGrid');
    if (!grid) return;
    
    var filtered = allMovies.slice().reverse();
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1">No movies found. Add some to your Google Sheet!</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(function(movie) {
        var badgeHtml = '';
        if (movie.sourceType === 'WEB-DL') {
            badgeHtml = '<div class="source-badge badge-webdl">WEB-DL</div>';
        } else if (movie.sourceType === 'HDTC') {
            badgeHtml = '<div class="source-badge badge-hdtc">HDTC</div>';
        } else if (movie.sourceType === 'BLURAY') {
            badgeHtml = '<div class="source-badge badge-bluray">BLURAY</div>';
        } else if (movie.sourceType === 'REMUX') {
            badgeHtml = '<div class="source-badge badge-remux">REMUX</div>';
        } else if (movie.sourceType === 'UPCOMING') {
            badgeHtml = '<div class="source-badge badge-upcoming">UPCOMING</div>';
        }
        
        return '<div class="movie-card" onclick="openMovie(' + movie.id + ')">' +
            badgeHtml +
            '<img src="' + movie.posterUrl + '" alt="' + movie.title + '" onerror="this.src=\'https://via.placeholder.com/300x450?text=No+Poster\'">' +
            '<h4>' + movie.title + ' (' + movie.year + ')</h4>' +
            '<div class="movie-card-fav ' + (isFavorite(movie.id) ? 'active' : '') + '" onclick="toggleFavorite(event, ' + movie.id + ')">' +
            '<i class="fas fa-star"></i>' +
            '<span>Add to Favourite</span>' +
            '</div>' +
        '</div>';
    }).join('');
}

function getTimerAndProgress(movie) {
    var timerHtml = '';
    var progressHtml = '';
    
    if (movie.sourceType === 'UPCOMING' && movie.releaseDate && movie.releaseDate !== '') {
        timerHtml = '<div class="premium-countdown-container" id="countdownContainer">' +
            '<div class="premium-countdown-header">' +
            '<i class="fas fa-hourglass-half"></i>' +
            '<span>RELEASES IN</span>' +
            '</div>' +
            '<div id="movieCountdown"></div>' +
        '</div>';
    }
    
    if (movie.status === 'uploading') {
        var progress = parseInt(movie.uploadProgress) || 0;
        progressHtml = '<div class="premium-progress-container">' +
            '<div class="premium-progress-header">' +
            '<i class="fas fa-cloud-upload-alt"></i>' +
            '<span>UPLOADING</span>' +
            '</div>' +
            '<div class="premium-progress-bar">' +
            '<div class="premium-progress-fill" style="width: ' + progress + '%;"></div>' +
            '</div>' +
            '<div class="premium-progress-percentage">' + progress + '%</div>' +
            '<div class="premium-progress-status">Processing your request...</div>' +
        '</div>';
    }
    
    return timerHtml + progressHtml;
}

function startCountdown(releaseDate) {
    if (timerInterval) clearInterval(timerInterval);
    
    var timerElement = document.getElementById('movieCountdown');
    if (!timerElement) return;
    
    function updateTimer() {
        var release = new Date(releaseDate);
        
        if (isNaN(release.getTime())) {
            release = new Date(releaseDate.replace(/-/g, '/'));
        }
        
        if (isNaN(release.getTime())) {
            timerElement.innerHTML = '<div class="countdown-released">📅 Coming Soon</div>';
            return;
        }
        
        var now = new Date();
        var timeLeft = release - now;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerElement.innerHTML = '<div class="countdown-released"><i class="fas fa-ticket-alt"></i> NOW AVAILABLE!</div>';
            return;
        }
        
        var days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        var hours = Math.floor((timeLeft % (86400000)) / (3600000));
        var minutes = Math.floor((timeLeft % 3600000) / 60000);
        var seconds = Math.floor((timeLeft % 60000) / 1000);
        
        timerElement.innerHTML = '<div class="ultra-countdown">' +
            '<div class="ultra-countdown-item">' +
            '<span class="ultra-countdown-number">' + String(days).padStart(2, '0') + '</span>' +
            '<span class="ultra-countdown-label">DAYS</span>' +
            '</div>' +
            '<div class="ultra-countdown-separator">:</div>' +
            '<div class="ultra-countdown-item">' +
            '<span class="ultra-countdown-number">' + String(hours).padStart(2, '0') + '</span>' +
            '<span class="ultra-countdown-label">HOURS</span>' +
            '</div>' +
            '<div class="ultra-countdown-separator">:</div>' +
            '<div class="ultra-countdown-item">' +
            '<span class="ultra-countdown-number">' + String(minutes).padStart(2, '0') + '</span>' +
            '<span class="ultra-countdown-label">MINS</span>' +
            '</div>' +
            '<div class="ultra-countdown-separator">:</div>' +
            '<div class="ultra-countdown-item">' +
            '<span class="ultra-countdown-number">' + String(seconds).padStart(2, '0') + '</span>' +
            '<span class="ultra-countdown-label">SECS</span>' +
            '</div>' +
        '</div>';
    }
    
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

function toggleFavorite(event, movieId) {
    event.stopPropagation();
    if (!currentUser) {
        alert('Please login first to save favorites!');
        return;
    }
    
    var index = favorites.indexOf(movieId);
    if (index === -1) {
        favorites.push(movieId);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    displayMovies();
    displayFavorites();
    setupFeatured();
    
    var isFav = favorites.includes(movieId);
    var btn = event.currentTarget;
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
        localStorage.setItem('favorites_' + currentUser, JSON.stringify(favorites));
    }
}

function loadFavorites() {
    if (currentUser) {
        var saved = localStorage.getItem('favorites_' + currentUser);
        favorites = saved ? JSON.parse(saved) : [];
    } else {
        favorites = [];
    }
    displayFavorites();
}

function displayFavorites() {
    var container = document.getElementById('favoritesGrid');
    if (!container) return;
    
    var favMovies = allMovies.filter(function(m) { return favorites.includes(m.id); });
    favMovies = favMovies.sort(function(a, b) { return b.id - a.id; });
    
    if (favMovies.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1; text-align:center; color: rgba(255,255,255,0.5); padding: 20px;">⭐ No favorites yet. Tap ★ on movies!</p>';
        return;
    }
    
    container.innerHTML = favMovies.map(function(movie) {
        return '<div class="fav-list-item" onclick="openMovie(' + movie.id + ')">' +
            '<img src="' + movie.posterUrl + '" alt="' + movie.title + '" onerror="this.src=\'https://via.placeholder.com/300x450?text=No+Poster\'">' +
            '<div class="fav-list-info">' +
            '<h4>' + movie.title + '</h4>' +
            '<span class="fav-list-year">' + movie.year + '</span>' +
            '</div>' +
            '<div class="fav-list-arrow">›</div>' +
        '</div>';
    }).join('');
}

function setupEventListeners() {
    var loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.onclick = loginUser;
    
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logoutUser;
    
    var adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) adminBtn.onclick = function() { window.location.href = 'admin.html'; };
    
    var backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.onclick = function(e) {
            e.preventDefault();
            window.history.back();
        };
    }
}

function loginUser() {
    var username = document.getElementById('dummyUsername').value.trim();
    var password = document.getElementById('dummyPassword').value;
    
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
    var saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = saved;
        document.getElementById('loggedOutView').style.display = 'none';
        document.getElementById('loggedInView').style.display = 'block';
        document.getElementById('currentUser').textContent = currentUser;
        loadFavorites();
    }
}

function openMovie(movieId) {
    var movie = allMovies.find(function(m) { return m.id == movieId; });
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

// ===== REPORT BROKEN LINK WITH MODAL =====
function reportBrokenLink() {
    var movieData = localStorage.getItem('selectedMovie');
    var movieTitle = 'Unknown Movie';
    var movieId = 'N/A';
    
    if (movieData) {
        var movie = JSON.parse(movieData);
        movieTitle = movie.title;
        movieId = movie.id;
    }
    
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = 
        '<div class="modal-box">' +
            '<div class="modal-title">✨ Report a Problem</div>' +
            '<div class="modal-subtitle">Select which link is not working for <strong>"' + movieTitle + '"</strong></div>' +
            
            '<div class="modal-option" data-type="Trailer">' +
                '<span class="icon">🎬</span>' +
                '<span class="label">Watch Trailer</span>' +
            '</div>' +
            '<div class="modal-option" data-type="480p">' +
                '<span class="icon">📥</span>' +
                '<span class="label">480p Download</span>' +
            '</div>' +
            '<div class="modal-option" data-type="720p">' +
                '<span class="icon">📥</span>' +
                '<span class="label">720p Download</span>' +
            '</div>' +
            '<div class="modal-option" data-type="1080p">' +
                '<span class="icon">📥</span>' +
                '<span class="label">1080p Download</span>' +
            '</div>' +
            '<div class="modal-option cancel" data-type="cancel">' +
                'Cancel' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
    
    modal.querySelectorAll('.modal-option').forEach(function(option) {
        option.addEventListener('click', function() {
            var type = this.dataset.type;
            modal.remove();
            if (type === 'cancel') return;
            
            openCustomMessageModal(movieTitle, movieId, type);
        });
    });
}

function openCustomMessageModal(movieTitle, movieId, linkType) {
    var modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = 
        '<div class="modal-box" style="max-width: 420px;">' +
            '<div class="modal-title">✍️ Describe the Issue</div>' +
            '<div class="modal-subtitle" style="margin-bottom: 20px;">Tell us what\'s wrong with the <strong>' + linkType + '</strong> link for <strong>"' + movieTitle + '"</strong></div>' +
            
            '<textarea id="customReportMessage" placeholder="Example: The link is showing 404 error, takes me to wrong page, or video quality is low..." style="width:100%; min-height:120px; padding:14px; border-radius:16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:white; font-size:14px; font-family:inherit; resize:vertical; margin-bottom:16px;"></textarea>' +
            
            '<div style="display:flex; gap:12px;">' +
                '<button class="modal-option cancel" onclick="this.closest(\'.modal-overlay\').remove()" style="flex:1; justify-content:center; margin:0;">Cancel</button>' +
                '<button class="modal-option" onclick="sendCustomReport(\'' + movieTitle + '\', ' + movieId + ', \'' + linkType + '\')" style="flex:2; justify-content:center; margin:0; background:linear-gradient(135deg,#e50914,#b00710); border-color:#e50914;">' +
                    '📤 Send Report' +
                '</button>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
}

function sendCustomReport(movieTitle, movieId, linkType) {
    var messageText = document.getElementById('customReportMessage');
    if (!messageText) return;
    
    var customMessage = messageText.value.trim();
    if (!customMessage) {
        showToast('Please describe the issue before sending.', 'error');
        return;
    }
    
    var modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    
    showToast('Sending your report...', 'loading');
    
    var botToken = '8605366366:AAGSbgDrNJNb58tof0-ii9syUgnAYybG9Xg';
    var chatId = '6579926806';
    
    var message = '📨 *CUSTOM REPORT* 📨\n\n' +
        '🎬 *Movie:* ' + movieTitle + '\n' +
        '🆔 *ID:* ' + movieId + '\n' +
        '🔗 *Link Type:* ' + linkType + '\n' +
        '📝 *Message:* ' + customMessage;
    
    fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.ok) {
            showToast('Your report has been sent successfully!', 'success');
        } else {
            showToast('Failed to send report. Please try again.', 'error');
        }
    })
    .catch(function() {
        showToast('Network error. Please try again.', 'error');
    });
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type) {
    if (type === undefined) type = '';
    
    var existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    var toast = document.createElement('div');
    toast.className = 'toast-notification ' + type;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 120px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(16px);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-weight: 600;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.08);
        white-space: nowrap;
        max-width: 90%;
        display: inline-block;
        width: auto;
        text-align: center;
        letter-spacing: 0.3px;
        line-height: 1;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(function() {
            if (toast.parentNode) toast.remove();
        }, 400);
    }, 3500);
}

function showLoading(show) {
    var loader = document.getElementById('loadingIndicator');
    if (loader) {
        if (show) {
            loader.classList.remove('hidden');
            loader.style.display = 'flex';
        } else {
            loader.classList.add('hidden');
            setTimeout(function() {
                loader.style.display = 'none';
            }, 500);
        }
    }
}

// ===== TOGGLE NOTE ANSWER =====
function toggleNote(contentId, arrowId) {
    var content = document.getElementById(contentId);
    var arrow = document.getElementById(arrowId);
    
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        arrow.classList.remove('open');
        arrow.textContent = '▶';
    } else {
        content.classList.add('open');
        arrow.classList.add('open');
        arrow.textContent = '▼';
    }
}

// ===== REQUEST PANEL =====
function openRequestPanel(movieName) {
    var modal = document.createElement('div');
    modal.className = 'request-panel-overlay';
    modal.innerHTML = 
        '<div class="request-panel-box" style="max-height: 85vh; display: flex; flex-direction: column; padding: 24px 20px;">' +
            '<div class="request-panel-title" style="font-size: 22px; margin-bottom: 10px;">📩 Request Panel</div>' +
            
            '<div class="request-panel-note" style="font-size: 12px; padding: 10px 14px; margin-bottom: 14px; line-height: 1.5;">' +
                'This request will be directly sent to Admin device. Check after <strong>48-72hrs</strong>.<br>' +
                '<strong>The "' + movieName + '" must be released in Theatres or any OTT Platform</strong>' +
            '</div>' +
            
            '<div style="flex: 1; overflow-y: auto; padding-right: 4px; margin-bottom: 10px;">' +
                '<div class="request-field" style="margin-bottom: 12px;">' +
                    '<label style="font-size: 11px;">Movie / Series Name</label>' +
                    '<input id="requestName" type="text" value="" placeholder="Enter movie/series name" style="padding: 10px 14px; font-size: 13px;">' +
                '</div>' +
                
                '<div class="request-field" style="margin-bottom: 12px;">' +
                    '<label style="font-size: 11px;">Release Date</label>' +
                    '<input id="requestReleaseDate" type="text" placeholder="e.g., 2025-12-25" style="padding: 10px 14px; font-size: 13px;">' +
                '</div>' +
                
                '<div class="request-field" style="margin-bottom: 12px;">' +
                    '<label style="font-size: 11px;">Original Language</label>' +
                    '<input id="requestLanguage" type="text" placeholder="e.g., English, Hindi, Tamil" style="padding: 10px 14px; font-size: 13px;">' +
                '</div>' +
                
                '<div class="request-field" style="margin-bottom: 12px;">' +
                    '<label style="font-size: 11px;">OTT Platform Name</label>' +
                    '<input id="requestOTT" type="text" placeholder="e.g., Netflix, Amazon Prime, Disney+" style="padding: 10px 14px; font-size: 13px;">' +
                '</div>' +
            '</div>' +
            
            '<div class="request-note" style="font-size: 11px; padding: 8px 12px; margin: 4px 0 12px 0; line-height: 1.4;">' +
                '📌 Note: Please Check the Site Correctly Before Requesting a Movie/Series with proper spelling (Prefer Google)' +
            '</div>' +
            
            '<div class="request-buttons" style="display: flex; gap: 12px;">' +
                '<button class="request-btn-cancel" onclick="this.closest(\'.request-panel-overlay\').remove()" style="flex: 1; padding: 12px 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: white; font-weight: 600; font-size: 14px; cursor: pointer;">Cancel</button>' +
                '<button class="request-btn-send" onclick="sendRequest()" style="flex: 2; padding: 12px 0; background: linear-gradient(135deg, #4facfe, #00f2fe); border: none; border-radius: 12px; color: white; font-weight: 600; font-size: 14px; cursor: pointer;">📤 Send</button>' +
            '</div>' +
        '</div>';
    
    document.body.appendChild(modal);
}

// ===== OPEN REQUEST PANEL FROM MOVIE DETAIL PAGE =====
function openRequestPanelFromMovie() {
    openRequestPanel('');
}

// ===== SEND REQUEST =====
function sendRequest() {
    var name = document.getElementById('requestName').value.trim();
    var releaseDate = document.getElementById('requestReleaseDate').value.trim();
    var language = document.getElementById('requestLanguage').value.trim();
    var ott = document.getElementById('requestOTT').value.trim();

    var nameField = document.getElementById('requestName').closest('.request-field');
    var releaseField = document.getElementById('requestReleaseDate').closest('.request-field');
    var languageField = document.getElementById('requestLanguage').closest('.request-field');
    var ottField = document.getElementById('requestOTT').closest('.request-field');

    [nameField, releaseField, languageField, ottField].forEach(function(field) {
        if (field) {
            field.style.border = 'none';
            field.style.boxShadow = 'none';
        }
    });

    var labels = document.querySelectorAll('.request-field label');
    labels.forEach(function(label) {
        label.style.color = 'rgba(255, 255, 255, 0.5)';
    });

    var emptyFields = [];
    if (!name) emptyFields.push('Movie/Series Name');
    if (!releaseDate) emptyFields.push('Release Date');
    if (!language) emptyFields.push('Original Language');
    if (!ott) emptyFields.push('OTT Platform Name');

    if (emptyFields.length > 0) {
        if (!name && nameField) {
            nameField.style.border = '2px solid #ff6b6b';
            nameField.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.15)';
            nameField.style.borderRadius = '12px';
            nameField.querySelector('label').style.color = '#ff6b6b';
        }
        if (!releaseDate && releaseField) {
            releaseField.style.border = '2px solid #ff6b6b';
            releaseField.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.15)';
            releaseField.style.borderRadius = '12px';
            releaseField.querySelector('label').style.color = '#ff6b6b';
        }
        if (!language && languageField) {
            languageField.style.border = '2px solid #ff6b6b';
            languageField.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.15)';
            languageField.style.borderRadius = '12px';
            languageField.querySelector('label').style.color = '#ff6b6b';
        }
        if (!ott && ottField) {
            ottField.style.border = '2px solid #ff6b6b';
            ottField.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.15)';
            ottField.style.borderRadius = '12px';
            ottField.querySelector('label').style.color = '#ff6b6b';
        }

        var firstEmptyField = document.querySelector('.request-field[style*="border: 2px solid rgb(255, 107, 107)"]');
        if (firstEmptyField) {
            firstEmptyField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        showToast('⚠️ Please fill all the sections correctly!', 'error');
        return;
    }

    var panel = document.querySelector('.request-panel-overlay');
    if (panel) panel.remove();

    showToast('⏳ Sending your request to Admin...', 'loading');

    var botToken = '8605366366:AAGSbgDrNJNb58tof0-ii9syUgnAYybG9Xg';
    var chatId = '6579926806';

    var message = '📩 *NEW MOVIE REQUEST* 📩\n\n' +
        '🎬 *Name:* ' + name + '\n' +
        '📅 *Release Date:* ' + (releaseDate || 'N/A') + '\n' +
        '🌐 *Language:* ' + (language || 'N/A') + '\n' +
        '📺 *OTT Platform:* ' + (ott || 'N/A') + '\n\n' +
        '⏳ *Status:* Pending';

    fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.ok) {
            showToast('✅ Your request has been sent to Admin!', 'success');
        } else {
            showToast('❌ Failed to send request. Please try again.', 'error');
        }
    })
    .catch(function() {
        showToast('❌ Network error. Please try again.', 'error');
    });
}

// Movie detail page handler
if (window.location.pathname.includes('movie.html')) {
    // BACK BUTTON - DIRECT FIX
    (function() {
        var backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                window.history.back();
            };
        }
    })();
    
    var movieData = localStorage.getItem('selectedMovie');
    if (movieData) {
        var movie = JSON.parse(movieData);
        console.log("Movie sourceType:", movie.sourceType);
        console.log("Movie releaseDate:", movie.releaseDate);
        console.log("Movie status:", movie.status);
        
        var container = document.getElementById('movieDetailContainer');
        if (container) {
            var isFav = favorites.includes(movie.id);
            var timerProgressHtml = getTimerAndProgress(movie);
            
            var isReady = movie.status === 'Ready' || movie.status === 'available' || (movie.sourceType !== 'UPCOMING' && movie.status !== 'uploading');
            var isUploading = movie.status === 'uploading';
            
            var trailerButtonHtml = '<button class="trailer-btn" onclick="openTrailer(\'' + (movie.trailerUrl || '') + '\')">' +
                '<i class="fas fa-play"></i> Watch Trailer' +
            '</button>';
            
            var downloadButtonsHtml = '';
            if (isReady && !isUploading) {
                downloadButtonsHtml = '<div class="download-section">' +
                    '<div class="download-title">' +
                        '<i class="fas fa-download"></i> DOWNLOAD' +
                    '</div>' +
                    '<div class="quality-buttons">' +
                        '<button class="quality-btn quality-480p" onclick="downloadQuality(\'' + (movie.downloadUrl480 || '') + '\')">480p</button>' +
                        '<button class="quality-btn quality-720p" onclick="downloadQuality(\'' + (movie.downloadUrl720 || '') + '\')">720p</button>' +
                        '<button class="quality-btn quality-1080p" onclick="downloadQuality(\'' + (movie.downloadUrl1080 || '') + '\')">1080p</button>' +
                    '</div>' +
                '</div>';
            } else if (isUploading) {
                downloadButtonsHtml = '<div class="download-section">' +
                    '<div class="download-title">' +
                        '<i class="fas fa-download"></i> DOWNLOAD' +
                    '</div>' +
                    '<div class="quality-buttons">' +
                        '<button class="quality-btn quality-480p disabled" disabled style="opacity: 0.4; cursor: not-allowed;">480p (Uploading)</button>' +
                        '<button class="quality-btn quality-720p disabled" disabled style="opacity: 0.4; cursor: not-allowed;">720p (Uploading)</button>' +
                        '<button class="quality-btn quality-1080p disabled" disabled style="opacity: 0.4; cursor: not-allowed;">1080p (Uploading)</button>' +
                    '</div>' +
                '</div>';
            } else if (movie.sourceType === 'UPCOMING') {
                downloadButtonsHtml = '<div class="download-section">' +
                    '<div class="download-title">' +
                        '<i class="fas fa-download"></i> DOWNLOAD' +
                    '</div>' +
                    '<div class="quality-buttons">' +
                        '<button class="quality-btn quality-480p disabled" disabled style="opacity: 0.4; cursor: not-allowed;">480p (Coming Soon)</button>' +
                        '<button class="quality-btn quality-720p disabled" disabled style="opacity: 0.4; cursor: not-allowed;">720p (Coming Soon)</button>' +
                        '<button class="quality-btn quality-1080p disabled" disabled style="opacity: 0.4; cursor: not-allowed;">1080p (Coming Soon)</button>' +
                    '</div>' +
                '</div>';
            }
            
            container.innerHTML =
                '<div class="movie-detail-card">' +
                    '<img src="' + movie.posterUrl + '" alt="' + movie.title + '" onerror="this.src=\'https://via.placeholder.com/300x450?text=No+Poster\'">' +
                    '<div class="movie-info">' +
                        '<h2>' + movie.title + ' (' + movie.year + ')</h2>' +
                        
                        '<div class="movie-buttons">' +
                            trailerButtonHtml +
                            '<button class="favourite-btn ' + (isFav ? 'active' : '') + '" onclick="toggleFavouriteFromDetail(' + movie.id + ')">' +
                                '<i class="fas fa-star"></i> Add to Favourite' +
                            '</button>' +
                        '</div>' +
                        
                        '<div class="report-btn-container">' +
                            '<button class="report-btn" onclick="reportBrokenLink()">' +
                                '<i class="fas fa-exclamation-triangle"></i> Report a Problem' +
                            '</button>' +
                        '</div>' +
                        
                        '<div class="download-divider"></div>' +
                        
                        downloadButtonsHtml +
                        
                        '<div class="note-section">' +
                            '<div class="note-header">' +
                                '<span class="note-icon">📌</span>' +
                                '<span class="note-title">IMPORTANT NOTICE</span>' +
                            '</div>' +
                            
                            '<div class="note-question" onclick="toggleNote(\'noteContent1\', \'noteArrow1\')">' +
                                '<span class="question-icon">❓</span>' +
                                '<span class="question-text">How to Download Movies/Series Ads-free?</span>' +
                                '<span class="question-arrow" id="noteArrow1">▶</span>' +
                            '</div>' +
                            '<div class="note-content-collapsible" id="noteContent1">' +
                                'Please Install JIOSPHERE or BRAVE Browser and Enable AD-BLOCKER Inside the App For Smooth Downloading Process.' +
                            '</div>' +
                            
                            '<div class="note-question" onclick="toggleNote(\'noteContent2\', \'noteArrow2\')">' +
                                '<span class="question-icon">❓</span>' +
                                '<span class="question-text">How to watch Movies/Series without Interruption after downloading?</span>' +
                                '<span class="question-arrow" id="noteArrow2">▶</span>' +
                            '</div>' +
                            '<div class="note-content-collapsible" id="noteContent2">' +
                                'Install VLC MEDIA PLAYER from PlayStore and Play your Movies/Series without any Interruption!' +
                            '</div>' +
                        '</div>' +
                        
                        timerProgressHtml +
                        
                        '<div class="info-grid">' +
                            '<div class="info-row">' +
                                '<span class="info-label"><i class="fas fa-calendar-alt"></i> RELEASE YEAR</span>' +
                                '<span class="info-value">' + (movie.year || 'N/A') + '</span>' +
                            '</div>' +
                            '<div class="info-row">' +
                                '<span class="info-label"><i class="fas fa-star"></i> RATING</span>' +
                                '<span class="info-value rating-value">⭐ ' + (movie.rating || 'N/A') + '/10</span>' +
                            '</div>' +
                            '<div class="info-row">' +
                                '<span class="info-label"><i class="fas fa-tags"></i> GENRE</span>' +
                                '<div class="info-value tags-wrap">' + 
                                    (movie.genre ? movie.genre.split(',').map(function(g) { 
                                        var genreName = g.trim();
                                        return '<span class="info-tag genre" onclick="goToCategory(\'' + genreName + '\')" style="cursor:pointer;">' + genreName + '</span>'; 
                                    }).join('') : '<span class="info-tag">N/A</span>') + 
                                '</div>' +
                            '</div>' +
                            '<div class="info-row">' +
                                '<span class="info-label"><i class="fas fa-clock"></i> DURATION</span>' +
                                '<span class="info-value">' + (movie.duration || 'N/A') + '</span>' +
                            '</div>' +
                            '<div class="info-row">' +
                                '<span class="info-label"><i class="fas fa-user-tie"></i> DIRECTOR</span>' +
                                '<div class="info-value tags-wrap">' + 
                                    (movie.director ? movie.director.split(',').map(function(d) { 
                                        return '<span class="info-tag director">' + d.trim() + '</span>'; 
                                    }).join('') : '<span class="info-tag">N/A</span>') + 
                                '</div>' +
                            '</div>' +
                            '<div class="info-row">' +
                                '<span class="info-label"><i class="fas fa-globe"></i> LANGUAGE</span>' +
                                '<span class="info-value">' + (movie.language || 'N/A') + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            
            if (movie.sourceType === 'UPCOMING' && movie.releaseDate && movie.releaseDate !== '') {
                startCountdown(movie.releaseDate);
            }
        }
    }
}

function toggleFavouriteFromDetail(movieId) {
    if (!currentUser) {
        alert('Please login first to save favorites!');
        return;
    }
    
    var index = favorites.indexOf(movieId);
    if (index === -1) {
        favorites.push(movieId);
    } else {
        favorites.splice(index, 1);
    }
    saveFavorites();
    
    var favBtn = document.querySelector('.favourite-btn');
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
    var navItems = document.querySelectorAll('.nav-item');
    var homeSection = document.getElementById('homeSection');
    var searchSection = document.getElementById('searchSection');
    var categoriesSection = document.getElementById('categoriesSection');
    var accountSection = document.getElementById('accountSection');
    var userSection = document.getElementById('userSection');
    
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
        
        navItems.forEach(function(item) {
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
    
    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            var page = this.dataset.page;
            showPage(page);
            
            if (page === 'search') {
                var searchInput = document.getElementById('searchInputFull');
                if (searchInput) searchInput.focus();
            }
        });
    });
    
    showPage('home');
}

function setupFullSearch() {
    var searchInput = document.getElementById('searchInputFull');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        var searchTerm = e.target.value.toLowerCase().trim();
        var resultsContainer = document.getElementById('searchResults');
        
        if (!resultsContainer) return;
        
        resultsContainer.style.marginTop = '30px';
        
        if (searchTerm.length === 0) {
            resultsContainer.innerHTML = 
                '<div class="no-results-container">' +
                    '<div class="no-results-box">' +
                        '<span class="icon">🎬</span>' +
                        '<span class="title">Ready to Explore?</span>' +
                        '<span class="message">Type a movie or series name...</span>' +
                    '</div>' +
                '</div>';
            return;
        }
        
        var filtered = allMovies.filter(function(movie) {
            return movie.title.toLowerCase().includes(searchTerm) ||
                movie.genre.toLowerCase().includes(searchTerm) ||
                movie.director.toLowerCase().includes(searchTerm) ||
                movie.year.toString().includes(searchTerm);
        });
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML =
                '<div class="no-results-container">' +
                    '<div class="no-results-box">' +
                        '<span class="icon">😔</span>' +
                        '<span class="title">O-O! Sorry!</span>' +
                        '<span class="message">"' + searchTerm + '" not available</span>' +
                    '</div>' +
                    '<div class="request-btn-wrapper">' +
                        '<button class="request-btn-main" onclick="openRequestPanel(\'' + searchTerm.replace(/'/g, "\\'") + '\')">' +
                            '📥 Request Movie/Series' +
                        '</button>' +
                    '</div>' +
                '</div>';
            return;
        }
        
        resultsContainer.innerHTML = filtered.map(function(movie) {
            var badgeHtml = '';
            if (movie.sourceType === 'WEB-DL') {
                badgeHtml = '<div class="source-badge badge-webdl">WEB-DL</div>';
            } else if (movie.sourceType === 'HDTC') {
                badgeHtml = '<div class="source-badge badge-hdtc">HDTC</div>';
            } else if (movie.sourceType === 'BLURAY') {
                badgeHtml = '<div class="source-badge badge-bluray">BLURAY</div>';
            } else if (movie.sourceType === 'REMUX') {
                badgeHtml = '<div class="source-badge badge-remux">REMUX</div>';
            } else if (movie.sourceType === 'UPCOMING') {
                badgeHtml = '<div class="source-badge badge-upcoming">UPCOMING</div>';
            }
            
            return '<div class="movie-card" onclick="openMovie(' + movie.id + ')">' +
                badgeHtml +
                '<img src="' + movie.posterUrl + '" alt="' + movie.title + '" onerror="this.src=\'https://via.placeholder.com/300x450?text=No+Poster\'">' +
                '<h4>' + movie.title + ' (' + movie.year + ')</h4>' +
                '<div class="movie-card-fav ' + (isFavorite(movie.id) ? 'active' : '') + '" onclick="toggleFavorite(event, ' + movie.id + ')">' +
                '<i class="fas fa-star"></i>' +
                '<span>Add to Favourite</span>' +
                '</div>' +
            '</div>';
        }).join('');
    });
}

function setupCategoryView() {
    var categoryMoviesContainer = document.getElementById('categoryMovies');
    if (!categoryMoviesContainer) return;
}

// ===== GO TO CATEGORY =====
function goToCategory(category) {
    console.log("goToCategory called with:", category);
    
    // Navigate to categories page
    var navItems = document.querySelectorAll('.nav-item');
    var categoriesSection = document.getElementById('categoriesSection');
    var homeSection = document.getElementById('homeSection');
    var searchSection = document.getElementById('searchSection');
    var accountSection = document.getElementById('accountSection');
    var userSection = document.getElementById('userSection');
    
    // Hide all sections
    if (homeSection) homeSection.style.display = 'none';
    if (searchSection) searchSection.style.display = 'none';
    if (accountSection) accountSection.style.display = 'none';
    if (categoriesSection) categoriesSection.style.display = 'block';
    
    // Update nav active state
    navItems.forEach(function(item) {
        if (item.dataset.page === 'categories') {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    if (userSection) userSection.style.display = 'block';
    
    // Refresh categories
    displayCategories();
    
    // Find and click the matching category
    setTimeout(function() {
        var categoryBtns = document.querySelectorAll('#categoriesList .category-btn');
        var found = false;
        categoryBtns.forEach(function(btn) {
            if (btn.dataset.category === category) {
                found = true;
                categoryBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                showMoviesByCategory(category);
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
        if (!found) {
            var allBtn = document.querySelector('#categoriesList .category-btn[data-category="all"]');
            if (allBtn) allBtn.click();
        }
    }, 300);
                }
