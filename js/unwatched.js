// Carregar apenas filmes não assistidos
async function loadUnwatchedMovies(userId) {
    const moviesContainer = document.getElementById('moviesContainer');
    moviesContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    try {
        const snapshot = await db.collection('movies')
            .where('userId', '==', userId)
            .where('status', '==', 'nao_assistido')
            .orderBy('createdAt', 'desc')
            .get();

        moviesContainer.innerHTML = '';

        if (snapshot.empty) {
            moviesContainer.innerHTML = '<div class="col-12 text-center mt-4"><h4>Nenhum filme na lista para assistir.</h4></div>';
            return;
        }

        snapshot.forEach(doc => {
            const movie = { id: doc.id, ...doc.data() };
            const movieCard = createMovieCard(movie, userId);
            moviesContainer.appendChild(movieCard);
        });
    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        alert('Erro ao carregar filmes. Por favor, recarregue a página.');
    }
}

function createMovieCard(movie, userId) {
    const movieElement = document.createElement('div');
    movieElement.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4 fade-in';

    const placeholderPoster = 'https://placehold.co/500x750/212529/FFFFFF/png?text=Capa+Indispon%C3%ADvel';
    const posterUrl = movie.posterUrl || placeholderPoster;

    movieElement.innerHTML = `
        <div class="card movie-card">
            <div class="movie-poster-container" style="cursor: pointer;">
                <img src="${posterUrl}" alt="Capa de ${movie.title}">
                <div class="movie-card-actions">
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${movie.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
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

    const deleteBtn = movieElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMovie(movie.id, userId);
    });

    return movieElement;
}

async function deleteMovie(movieId, userId) {
    if (confirm('Tem certeza que deseja excluir este filme?')) {
        try {
            await db.collection('movies').doc(movieId).delete();
            loadUnwatchedMovies(userId);
        } catch (error) {
            console.error('Erro ao excluir filme:', error);
            alert('Erro ao excluir filme');
        }
    }
}

function loadMovies(userId) {
    loadUnwatchedMovies(userId);
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        loadUnwatchedMovies(user.uid);
    });

    // Configurar botão de logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        firebase.auth().signOut();
    });
});