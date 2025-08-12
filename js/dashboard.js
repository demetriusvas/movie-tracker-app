// Verificar autenticação
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    loadMovies(user.uid);
    setupEventListeners(user.uid);
});

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
            <div class="movie-poster-container" style="cursor: pointer;">
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
    
    // Adicionar event listeners
    const posterContainer = movieElement.querySelector('.movie-poster-container');
    posterContainer.addEventListener('click', () => showMovieDetails(movie));
    
    movieElement.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        editMovie(movie);
    });
    
    movieElement.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteMovie(movie.id, userId);
    });
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
    // Inicializar busca de filmes
    const searchInput = document.getElementById('movieSearch');
    const suggestionsContainer = document.getElementById('movieSuggestions');
    const formFields = document.getElementById('movieFormFields');
    const manualEntryBtn = document.getElementById('manualEntryBtn');

    let searchTimeout = null;
    let isManualEntry = false;

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            if (isManualEntry) return;
            
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 3) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                const suggestions = await searchMovieSuggestions(query);
                displayMovieSuggestions(suggestions, suggestionsContainer, formFields);
            }, 300);
        });
    }

    if (manualEntryBtn) {
        manualEntryBtn.addEventListener('click', () => {
            isManualEntry = !isManualEntry;
            if (isManualEntry) {
                formFields.classList.remove('d-none');
                suggestionsContainer.style.display = 'none';
                manualEntryBtn.textContent = 'Usar Busca';
                searchInput.value = '';
            } else {
                formFields.classList.add('d-none');
                manualEntryBtn.textContent = 'Entrada Manual';
            }
        });
    }

    // Display movie suggestions
    function displayMovieSuggestions(suggestions, container, formFields) {
        if (!suggestions || suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = suggestions.map(movie => `
            <button type="button" class="list-group-item list-group-item-action movie-suggestion" 
                    data-movie-id="${movie.id}" data-movie-title="${movie.title}">
                <div class="d-flex align-items-center">
                    ${movie.posterUrl ? 
                        `<img src="${movie.posterUrl}" alt="${movie.title}" style="width: 50px; margin-right: 10px;">` :
                        '<div style="width: 50px; height: 75px; background-color: #eee; margin-right: 10px;"></div>'}
                    <div>
                        <strong>${movie.title}</strong>
                        ${movie.releaseDate ? `<br><small>${movie.releaseDate}</small>` : ''}
                    </div>
                </div>
            </button>
        `).join('');

        container.style.display = 'block';

        // Adicionar event listeners para as sugestões
        container.querySelectorAll('.movie-suggestion').forEach(button => {
            button.addEventListener('click', async () => {
                const movieId = button.dataset.movieId;
                const movieTitle = button.dataset.movieTitle;

                try {
                    // Verificar se o filme já existe
                    const existingMovies = await db.collection('movies')
                        .where('userId', '==', firebase.auth().currentUser.uid)
                        .where('tmdbId', '==', movieId)
                        .get();

                    if (!existingMovies.empty) {
                        alert('Este filme já está na sua lista!');
                        return;
                    }

                    const movieDetails = await getMovieDetails(movieTitle);
                    if (movieDetails) {
                        // Limpar formulário antes de preencher
                        document.getElementById('movieForm').reset();
                        
                        // Preencher o formulário com os detalhes corretos
                        document.getElementById('tmdbId').value = movieDetails.tmdbId;
                        document.getElementById('title').value = movieDetails.title;
                        document.getElementById('originalTitle').value = movieDetails.originalTitle || movieDetails.title;
                        document.getElementById('runtime').value = movieDetails.runtime || '';
                        document.getElementById('genre').value = movieDetails.genre || '';
                        document.getElementById('synopsis').value = movieDetails.synopsis || '';
                        document.getElementById('movieSearch').value = movieDetails.title;
                        
                        // Guardar os dados da API temporariamente
                        button.dataset.posterUrl = movieDetails.posterUrl || '';
                        button.dataset.backdropUrl = movieDetails.backdropUrl || '';
                        
                        container.style.display = 'none';
                        formFields.classList.remove('d-none');
                    }
                } catch (error) {
                    console.error('Erro ao buscar detalhes do filme:', error);
                    alert('Erro ao buscar detalhes do filme. Tente novamente.');
                }
            });
        });
    }

    // Preencher formulário com detalhes do filme
    function fillMovieForm(movieDetails) {
        document.getElementById('tmdbId').value = movieDetails.tmdbId;
        document.getElementById('title').value = movieDetails.title;
        document.getElementById('originalTitle').value = movieDetails.originalTitle;
        document.getElementById('runtime').value = movieDetails.runtime || '';
        document.getElementById('genre').value = movieDetails.genre || '';
        document.getElementById('synopsis').value = movieDetails.synopsis || '';
    }

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
        const selectedMovieId = document.getElementById('tmdbId').value;
        
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
                // Verificar se já existe um filme com o mesmo TMDb ID
                if (selectedMovieId) {
                    const existingMovie = await db.collection('movies')
                        .where('userId', '==', userId)
                        .where('tmdbId', '==', selectedMovieId)
                        .get();

                    if (!existingMovie.empty) {
                        alert('Este filme já está na sua lista!');
                        return;
                    }
                }

                // Criar novo filme
                const selectedSuggestion = document.querySelector('.movie-suggestion[data-movie-id="' + selectedMovieId + '"]');
                
                let movieData = {
                    title: title,
                    status: document.getElementById('status').value,
                    rating: document.getElementById('rating').value || null,
                    watchedDate: document.getElementById('watchedDate').value || null,
                    runtime: document.getElementById('runtime').value || null,
                    genre: document.getElementById('genre').value || null,
                    synopsis: document.getElementById('synopsis').value || null,
                    tmdbId: selectedMovieId || null,
                    userId: userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    originalTitle: document.getElementById('originalTitle').value || title
                };

                // Adicionar URLs das imagens se disponíveis
                if (selectedSuggestion) {
                    movieData.posterUrl = selectedSuggestion.dataset.posterUrl || null;
                    movieData.backdropUrl = selectedSuggestion.dataset.backdropUrl || null;
                } else {
                    // Se for entrada manual, tentar buscar as imagens
                    try {
                        const movieDetails = await getMovieDetails(title);
                        if (movieDetails) {
                            movieData.posterUrl = movieDetails.posterUrl;
                            movieData.backdropUrl = movieDetails.backdropUrl;
                        }
                    } catch (error) {
                        console.error('Erro ao buscar imagens do filme:', error);
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