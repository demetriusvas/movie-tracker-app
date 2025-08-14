
// Carregar apenas filmes assistidos
async function loadWatchedMovies(userId) {
    const moviesContainer = document.getElementById('moviesContainer');
    moviesContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    try {
        const snapshot = await db.collection('movies')
            .where('userId', '==', userId)
            .where('status', '==', 'assistido')
            .orderBy('watchedDate', 'desc')
            .get();

        const moviesContainer = document.getElementById('moviesContainer');
        moviesContainer.innerHTML = '';

        if (snapshot.empty) {
            moviesContainer.innerHTML = '<div class="col-12 text-center mt-4"><h4>Nenhum filme assistido ainda.</h4></div>';
            return;
        }

        snapshot.forEach(doc => {
            const movie = { id: doc.id, ...doc.data() };
            const movieCard = createMovieCard(movie);
            moviesContainer.appendChild(movieCard);
        });
    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        alert('Erro ao carregar filmes. Por favor, recarregue a página.');
    }
}

function createMovieCard(movie) {
    const movieElement = document.createElement('div');
    movieElement.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4 fade-in';

    const placeholderPoster = 'https://placehold.co/500x750/212529/FFFFFF/png?text=Capa+Indispon%C3%ADvel';
    const posterUrl = movie.posterUrl || placeholderPoster;

    movieElement.innerHTML = `
        <div class="card movie-card">
            <div class="movie-poster-container" style="cursor: pointer;">
                <img src="${posterUrl}" alt="Capa de ${movie.title}">
            </div>
            <div class="card-body">
                <h6 class="card-title text-truncate" title="${movie.title}">${movie.title}</h6>
                <span class="badge status-badge status-${movie.status}">${movie.status === 'assistido' ? 'Assistido' : 'Não Assistido'}</span>
                ${movie.watchedDate ? `<small class="d-block text-muted mt-1">Visto em: ${new Date(movie.watchedDate).toLocaleDateString()}</small>` : ''}
            </div>
        </div>
    `;

    // Adicionar event listeners
    const posterContainer = movieElement.querySelector('.movie-poster-container');
    posterContainer.addEventListener('click', () => showMovieDetails(movie));

    return movieElement;
}

function loadMovies(userId) {
    loadWatchedMovies(userId);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        loadWatchedMovies(user.uid);
    });

    // Configurar botão de logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        firebase.auth().signOut();
    });
});
