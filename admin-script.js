// Admin panel logic
let allMoviesAdmin = [];
let adminLoggedIn = false;

function checkAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadAdminData();
        loadCategoriesAdmin();
        loadMoviesList();
    } else {
        const errorDiv = document.getElementById('loginError');
        errorDiv.style.display = 'block';
        errorDiv.innerText = 'Wrong password!';
        setTimeout(() => errorDiv.style.display = 'none', 3000);
    }
}

function forgotPassword() {
    const answer = prompt('Backup Question: ' + BACKUP_QUESTION);
    if (answer && answer.toLowerCase() === BACKUP_ANSWER.toLowerCase()) {
        const newPassword = prompt('Enter new admin password:');
        if (newPassword) {
            ADMIN_PASSWORD = newPassword;
            localStorage.setItem('admin_password', ADMIN_PASSWORD);
            alert('Password changed successfully!');
        }
    } else {
        alert('Wrong answer!');
    }
}

function changePassword() {
    const newPass = document.getElementById('newPassword').value;
    if (newPass) {
        ADMIN_PASSWORD = newPass;
        localStorage.setItem('admin_password', ADMIN_PASSWORD);
        const msgDiv = document.getElementById('passwordMsg');
        msgDiv.style.display = 'block';
        setTimeout(() => msgDiv.style.display = 'none', 3000);
        document.getElementById('newPassword').value = '';
    }
}

function loadAdminData() {
    const savedPass = localStorage.getItem('admin_password');
    if (savedPass) ADMIN_PASSWORD = savedPass;
}

async function loadMoviesList() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const jsonText = text.substring(47, text.length - 2);
        const data = JSON.parse(jsonText);
        
        const rows = data.table.rows;
        allMoviesAdmin = [];
        if (rows && rows.length > 1) {
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].c;
                if (row && row[0] && row[0].v) {
                    allMoviesAdmin.push({
                        id: row[0]?.v || i,
                        title: row[1]?.v || 'Untitled',
                        year: row[2]?.v || 'N/A',
                        rating: row[3]?.v || '0',
                        posterUrl: row[4]?.v || '',
                        watchUrl: row[5]?.v || '#',
                        genre: row[6]?.v || 'Uncategorized',
                        duration: row[7]?.v || 'N/A',
                        director: row[8]?.v || 'Unknown',
                        language: row[9]?.v || 'N/A',
                        inSlider: row[10]?.v === 'TRUE',
                        downloadUrl: row[11]?.v || ''
                    });
                }
            }
        }
        displayMoviesAdmin();
        displaySliderSelection();
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

function displayMoviesAdmin() {
    const container = document.getElementById('moviesListAdmin');
    if (!container) return;
    
    if (allMoviesAdmin.length === 0) {
        container.innerHTML = '<p>No movies found. Add your first movie!</p>';
        return;
    }
    
    container.innerHTML = allMoviesAdmin.map(movie => `
        <div class="movie-item">
            <span><strong>${movie.title}</strong> (${movie.year})</span>
            <div>
                <button onclick="editMovie(${movie.id})" class="btn-small">✏️ Edit</button>
                <button onclick="deleteMovie(${movie.id})" class="btn-small btn-danger">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function displaySliderSelection() {
    const container = document.getElementById('sliderMoviesList');
    if (!container) return;
    
    container.innerHTML = allMoviesAdmin.map(movie => `
        <label class="slider-checkbox">
            <input type="checkbox" class="slider-check" value="${movie.id}" ${movie.inSlider ? 'checked' : ''}>
            <img src="${movie.posterUrl}" onerror="this.src='https://via.placeholder.com/40x60'">
            <span>${movie.title}</span>
        </label>
    `).join('');
}

function saveSlider() {
    const checkboxes = document.querySelectorAll('.slider-check');
    const selectedIds = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selectedIds.push(parseInt(cb.value));
    });
    
    if (selectedIds.length < 3) {
        alert('Please select at least 3 movies for slider');
        return;
    }
    
    if (selectedIds.length > 7) {
        alert('Please select maximum 7 movies for slider');
        return;
    }
    
    // Update inSlider property
    allMoviesAdmin.forEach(movie => {
        movie.inSlider = selectedIds.includes(movie.id);
    });
    
    // Save to localStorage (you'll need to update Google Sheet manually or via API)
    localStorage.setItem('slider_movies', JSON.stringify(selectedIds));
    alert('Slider updated! Note: You need to manually update the "inSlider" column in Google Sheets to TRUE/FALSE');
    
    const msgDiv = document.getElementById('sliderMsg');
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.style.display = 'none', 3000);
}

function loadCategoriesAdmin() {
    const saved = localStorage.getItem('movie_categories');
    let cats = [];
    if (saved) {
        cats = JSON.parse(saved);
    } else {
        cats = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
    }
    
    const container = document.getElementById('categoriesListAdmin');
    if (!container) return;
    
    const genreSelect = document.getElementById('movieGenre');
    if (genreSelect) {
        genreSelect.innerHTML = '<option value="">Select Genre</option>';
        cats.forEach(cat => {
            genreSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }
    
    container.innerHTML = cats.map((cat, index) => `
        <div class="category-item">
            <span>${cat}</span>
            <div>
                <button onclick="editCategory(${index})" class="btn-small">✏️</button>
                <button onclick="deleteCategory(${index})" class="btn-small btn-danger">🗑️</button>
            </div>
        </div>
    `).join('');
}

function addCategory() {
    const newCat = document.getElementById('newCategory').value.trim();
    if (!newCat) {
        alert('Please enter category name');
        return;
    }
    
    const saved = localStorage.getItem('movie_categories');
    let cats = saved ? JSON.parse(saved) : [];
    cats.push(newCat);
    localStorage.setItem('movie_categories', JSON.stringify(cats));
    
    document.getElementById('newCategory').value = '';
    loadCategoriesAdmin();
    alert('Category added!');
}

function editCategory(index) {
    const saved = localStorage.getItem('movie_categories');
    let cats = saved ? JSON.parse(saved) : [];
    const newName = prompt('Edit category name:', cats[index]);
    if (newName) {
        cats[index] = newName;
        localStorage.setItem('movie_categories', JSON.stringify(cats));
        loadCategoriesAdmin();
    }
}

function deleteCategory(index) {
    if (confirm('Delete this category?')) {
        const saved = localStorage.getItem('movie_categories');
        let cats = saved ? JSON.parse(saved) : [];
        cats.splice(index, 1);
        localStorage.setItem('movie_categories', JSON.stringify(cats));
        loadCategoriesAdmin();
    }
}

function addMovie() {
    const title = document.getElementById('movieTitle').value;
    const poster = document.getElementById('moviePoster').value;
    const year = document.getElementById('movieYear').value;
    const rating = document.getElementById('movieRating').value;
    const genre = document.getElementById('movieGenre').value;
    const duration = document.getElementById('movieDuration').value;
    const director = document.getElementById('movieDirector').value;
    const language = document.getElementById('movieLanguage').value;
    const watchUrl = document.getElementById('movieWatchUrl').value;
    const downloadUrl = document.getElementById('movieDownloadUrl').value;
    
    if (!title || !poster) {
        alert('Title and Poster URL are required!');
        return;
    }
    
    const newId = allMoviesAdmin.length > 0 ? Math.max(...allMoviesAdmin.map(m => m.id)) + 1 : 1;
    
    alert('Movie data ready! Please add this movie to your Google Sheet manually:\n\n' +
        'ID: ' + newId + '\n' +
        'Title: ' + title + '\n' +
        'Year: ' + year + '\n' +
        'Rating: ' + rating + '\n' +
        'Poster URL: ' + poster + '\n' +
        'Watch URL: ' + watchUrl + '\n' +
        'Genre: ' + genre + '\n' +
        'Duration: ' + duration + '\n' +
        'Director: ' + director + '\n' +
        'Language: ' + language + '\n' +
        'Download URL: ' + downloadUrl + '\n\n' +
        'Go to your Google Sheet and add this as a new row!');
    
    clearMovieForm();
}

function clearMovieForm() {
    document.getElementById('movieTitle').value = '';
    document.getElementById('moviePoster').value = '';
    document.getElementById('movieYear').value = '';
    document.getElementById('movieRating').value = '';
    document.getElementById('movieGenre').value = '';
    document.getElementById('movieDuration').value = '';
    document.getElementById('movieDirector').value = '';
    document.getElementById('movieLanguage').value = '';
    document.getElementById('movieWatchUrl').value = '';
    document.getElementById('movieDownloadUrl').value = '';
}

function editMovie(id) {
    const movie = allMoviesAdmin.find(m => m.id === id);
    if (!movie) return;
    
    document.getElementById('movieTitle').value = movie.title;
    document.getElementById('moviePoster').value = movie.posterUrl;
    document.getElementById('movieYear').value = movie.year;
    document.getElementById('movieRating').value = movie.rating;
    document.getElementById('movieGenre').value = movie.genre;
    document.getElementById('movieDuration').value = movie.duration;
    document.getElementById('movieDirector').value = movie.director;
    document.getElementById('movieLanguage').value = movie.language;
    document.getElementById('movieWatchUrl').value = movie.watchUrl;
    document.getElementById('movieDownloadUrl').value = movie.downloadUrl || '';
    
    document.getElementById('editId').value = id;
    document.getElementById('editMode').style.display = 'block';
    
    document.getElementById('movieMsg').innerHTML = 'Edit mode: Update and click Update Movie';
    document.getElementById('movieMsg').style.display = 'block';
}

function updateMovie() {
    const id = parseInt(document.getElementById('editId').value);
    
    alert('Please update this movie in your Google Sheet manually:\n\n' +
        'ID: ' + id + '\n' +
        'Title: ' + document.getElementById('movieTitle').value + '\n' +
        'Year: ' + document.getElementById('movieYear').value + '\n' +
        'Rating: ' + document.getElementById('movieRating').value + '\n' +
        'Poster URL: ' + document.getElementById('moviePoster').value + '\n' +
        'Watch URL: ' + document.getElementById('movieWatchUrl').value + '\n' +
        'Genre: ' + document.getElementById('movieGenre').value + '\n' +
        'Duration: ' + document.getElementById('movieDuration').value + '\n' +
        'Director: ' + document.getElementById('movieDirector').value + '\n' +
        'Language: ' + document.getElementById('movieLanguage').value + '\n' +
        'Download URL: ' + document.getElementById('movieDownloadUrl').value);
    
    cancelEdit();
}

function cancelEdit() {
    document.getElementById('editMode').style.display = 'none';
    document.getElementById('editId').value = '';
    clearMovieForm();
    document.getElementById('movieMsg').style.display = 'none';
}

function deleteMovie(id) {
    if (confirm('Delete this movie? You will need to remove it from Google Sheet manually.')) {
        alert('Please delete row with ID ' + id + ' from your Google Sheet manually.');
    }
}

// Load saved admin password on startup
if (localStorage.getItem('admin_password')) {
    ADMIN_PASSWORD = localStorage.getItem('admin_password');
}