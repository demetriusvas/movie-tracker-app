// --- Configuração da API de Filmes (TMDb) ---
// É necessário criar uma conta no site themoviedb.org e obter uma chave de API.
const TMDB_API_KEY = '577e86ff6fa23f2befa26d0b5bb02a69'; // <-- SUBSTITUA PELA SUA CHAVE
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Função para buscar a capa do filme
async function getMoviePoster(title) {
    // Verifica se a chave da API foi preenchida.
    if (!TMDB_API_KEY || TMDB_API_KEY === 'SUA_CHAVE_API_AQUI') {
        console.warn('Chave da API do TMDb não configurada. Por favor, adicione sua chave em js/dashboard.js ou substitua o valor de exemplo. A busca pela capa será ignorada.');
        return null;
    }
    const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=pt-BR`;
    try {
        const response = await fetch(searchUrl);

        // **Verificação crucial de erro da API**
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Tenta ler a mensagem de erro da API
            console.error(`Erro na API do TMDb: Status ${response.status}`, errorData.status_message || 'Nenhuma mensagem de erro adicional.');
            // Um erro comum é 401 (Unauthorized), que significa que a chave da API é inválida ou não está ativa.
            return null;
        }

        const data = await response.json();
        if (data.results && data.results.length > 0 && data.results[0].poster_path) {
            console.log(`Capa encontrada para "${title}"`);
            return `${TMDB_IMAGE_BASE_URL}${data.results[0].poster_path}`;
        }
        
        console.log(`Nenhuma capa encontrada na API para o filme: "${title}"`);
        return null; // Retorna nulo se não encontrar capa
    } catch (error) {
        console.error('Erro de rede ou de parsing ao buscar capa do filme:', error);
        return null;
    }
}

// Verificar autenticação
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    loadMovies(user.uid);
    setupEventListeners(user.uid);
});

// Carregar filmes do usuário
async function loadMovies(userId) {
    const moviesContainer = document.getElementById('moviesContainer');
    moviesContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const snapshot = await db.collection('movies')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        
        moviesContainer.innerHTML = '';
        
        if (snapshot.empty) {
            moviesContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Nenhum filme adicionado ainda</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addMovieModal">
                        Adicionar seu primeiro filme
                    </button>
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const movie = { id: doc.id, ...doc.data() };
            addMovieToDOM(movie, userId);
        });
    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        moviesContainer.innerHTML = '<div class="col-12"><p class="text-danger">Erro ao carregar filmes</p></div>';
    }
}

// Adicionar filme ao DOM
function addMovieToDOM(movie, userId) {
    const moviesContainer = document.getElementById('moviesContainer');
    const movieElement = document.createElement('div');
    movieElement.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-4 fade-in';

    const placeholderPoster = 'https://placehold.co/500x750/212529/FFFFFF/png?text=Capa+Indispon%C3%ADvel';
    const posterUrl = movie.posterUrl || placeholderPoster;

    movieElement.innerHTML = `
        <div class="card movie-card">
            <div class="movie-poster-container">
                <img src="${posterUrl}" alt="Capa de ${movie.title}">
                <div class="movie-card-actions">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${movie.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn mt-2" data-id="${movie.id}">
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
    
    moviesContainer.appendChild(movieElement);
    
    // Adicionar event listeners para os botões
    movieElement.querySelector('.edit-btn').addEventListener('click', () => editMovie(movie));
    movieElement.querySelector('.delete-btn').addEventListener('click', () => deleteMovie(movie.id, userId));
}

// Editar filme
function editMovie(movie) {
    document.getElementById('movieId').value = movie.id;
    document.getElementById('originalTitle').value = movie.title; // Guarda o título original
    document.getElementById('title').value = movie.title;
    document.getElementById('status').value = movie.status;
    document.getElementById('rating').value = movie.rating || '';
    document.getElementById('watchedDate').value = movie.watchedDate || '';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('addMovieModal'));
    modal.show();
}

// Excluir filme
async function deleteMovie(movieId, userId) {
    if (confirm('Tem certeza que deseja excluir este filme?')) {
        try {
            await db.collection('movies').doc(movieId).delete();
            // Recarrega a lista de filmes para refletir a exclusão.
            loadMovies(userId);
        } catch (error) {
            console.error('Erro ao excluir filme:', error);
            alert('Erro ao excluir filme');
        }
    }
}

// Setup de event listeners
function setupEventListeners(userId) {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });
    
    // Formulário de filme
    document.getElementById('movieForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = saveButton.innerHTML;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

        const movieId = document.getElementById('movieId').value;
        const title = document.getElementById('title').value;
        
        try {
            if (movieId) {
                // Atualizar filme existente
                const movieDataToUpdate = {
                    title: title,
                    status: document.getElementById('status').value,
                    rating: document.getElementById('rating').value || null,
                    watchedDate: document.getElementById('watchedDate').value || null,
                    runtime: document.getElementById('runtime').value || null,
                    genre: document.getElementById('genre').value || null,
                    synopsis: document.getElementById('synopsis').value || null,
                    tmdbId: document.getElementById('tmdbId').value || null,
                };

                await db.collection('movies').doc(movieId).update(movieDataToUpdate);
            } else {
                // Criar novo filme
                let movieData = {
                    title: title,
                    status: document.getElementById('status').value,
                    rating: document.getElementById('rating').value || null,
                    watchedDate: document.getElementById('watchedDate').value || null,
                    runtime: document.getElementById('runtime').value || null,
                    genre: document.getElementById('genre').value || null,
                    synopsis: document.getElementById('synopsis').value || null,
                    tmdbId: document.getElementById('tmdbId').value || null,
                    userId: userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Se não for entrada manual, busca detalhes completos do filme
                if (!isManualEntry) {
                    const movieDetails = await getMovieDetails(title);
                    if (movieDetails) {
                        movieData = {
                            ...movieData,
                            originalTitle: movieDetails.originalTitle,
                            posterUrl: movieDetails.posterUrl,
                            backdropUrl: movieDetails.backdropUrl,
                            releaseDate: movieDetails.releaseDate,
                            tmdbRating: movieDetails.rating,
                            popularity: movieDetails.popularity
                        };
                    }
                }

                await db.collection('movies').add(movieData);
            }
            
            // Fechar modal e resetar formulário
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMovieModal'));
            modal.hide();
            
            // Recarregar filmes
            loadMovies(userId);
        } catch (error) {
            console.error('Erro ao salvar filme:', error);
            alert('Erro ao salvar filme');
        }
        finally {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonText;
        }
    });
    
    // Resetar formulário quando o modal é fechado
    document.getElementById('addMovieModal')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('movieForm').reset();
        document.getElementById('movieId').value = '';
        document.getElementById('originalTitle').value = '';
    });
}