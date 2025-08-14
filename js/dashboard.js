// Verificar autenticação
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    loadMovies(user.uid);
    setupEventListeners(user.uid);

    const modalElement = document.getElementById('movieDetailsModal');
    if (modalElement) {
        movieDetailsModal = new bootstrap.Modal(modalElement);

        // Listener para o botão de alternar status
        const toggleStatusBtn = document.getElementById('toggleStatusBtn');
        if (toggleStatusBtn) {
            toggleStatusBtn.addEventListener('click', toggleMovieStatus);
        }

        // Listener para o botão de editar
        const editMovieBtn = document.getElementById('editMovieBtn');
        if (editMovieBtn) {
            editMovieBtn.addEventListener('click', editMovie);
        }

        // Listener para o botão de excluir
        const deleteMovieBtn = document.getElementById('deleteMovieBtn');
        if (deleteMovieBtn) {
            deleteMovieBtn.addEventListener('click', deleteMovie);
        }
    }
});

// Cache simples para os dados dos filmes
const movieCache = new Map();

// Carregar filmes do usuário
async function loadMovies(userId) {
    console.log('Loading movies for user:', userId);
    const moviesContainer = document.getElementById('moviesContainer');
    moviesContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const snapshot = await db.collection('movies')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        
        console.log('Snapshot empty:', snapshot.empty);

        moviesContainer.innerHTML = '';
        movieCache.clear(); // Limpa o cache antes de recarregar
        
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
            console.log('Movie found:', doc.data());
            const movie = { id: doc.id, ...doc.data() };
            movieCache.set(movie.id, movie); // Adiciona o filme ao cache
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
            </div>
            <div class="card-body">
                <h6 class="card-title text-truncate" title="${movie.title}">${movie.title}</h6>
                <span class="badge status-badge status-${movie.status}">${movie.status === 'assistido' ? 'Assistido' : 'Não Assistido'}</span>
                ${movie.watchedDate ? `<small class="d-block text-muted mt-1">Visto em: ${new Date(movie.watchedDate).toLocaleDateString()}</small>` : ''}
            </div>
        </div>
    `;
    
    moviesContainer.appendChild(movieElement);
    
    const posterContainer = movieElement.querySelector('.movie-poster-container');
    posterContainer.addEventListener('click', () => showMovieDetails(movie));
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
                        container.style.display = 'none';
                        return;
                    }

                    // Buscar detalhes do filme apenas uma vez
                    const movieDetails = await getMovieDetails(movieTitle);
                    if (!movieDetails) {
                        alert('Não foi possível carregar os detalhes do filme');
                        return;
                    }

                    // Limpar formulário antes de preencher
                    const form = document.getElementById('movieForm');
                    form.reset();
                    
                    // Preencher o formulário com os detalhes corretos
                    document.getElementById('tmdbId').value = movieId;
                    document.getElementById('title').value = movieDetails.title;
                    document.getElementById('originalTitle').value = movieDetails.originalTitle || movieDetails.title;
                    document.getElementById('runtime').value = movieDetails.runtime || '';
                    document.getElementById('genre').value = movieDetails.genre || '';
                    document.getElementById('synopsis').value = movieDetails.synopsis || '';
                    document.getElementById('movieSearch').value = movieDetails.title;

                    // Armazenar temporariamente os detalhes do filme no formulário
                    form.dataset.posterUrl = movieDetails.posterUrl || '';
                    form.dataset.backdropUrl = movieDetails.backdropUrl || '';
                    
                    container.style.display = 'none';
                    formFields.classList.remove('d-none');
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
        
        const form = e.target;
        const saveButton = form.querySelector('button[type="submit"]');
        const originalButtonText = saveButton.innerHTML;
        
        try {
            saveButton.disabled = true;
            saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

            const movieId = form.querySelector('#movieId').value;
            const title = form.querySelector('#title').value.trim();
            const selectedMovieId = form.querySelector('#tmdbId').value;

            if (!title) {
                alert('O título do filme é obrigatório');
                return;
            }

            let movieData = {
                title: title,
                originalTitle: form.querySelector('#originalTitle').value.trim() || title,
                status: form.querySelector('#status').value,
                rating: form.querySelector('#rating').value || null,
                watchedDate: form.querySelector('#watchedDate').value || null,
                runtime: form.querySelector('#runtime').value || null,
                genre: form.querySelector('#genre').value || null,
                synopsis: form.querySelector('#synopsis').value || null,
                tmdbId: selectedMovieId || null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (movieId) {
                // Atualizar filme existente
                await db.collection('movies').doc(movieId).update(movieData);
            } else {
                // Verificar duplicidade pelo TMDb ID e título
                let duplicate = false;
                if (selectedMovieId) {
                    const existingByTmdb = await db.collection('movies')
                        .where('userId', '==', userId)
                        .where('tmdbId', '==', selectedMovieId)
                        .get();
                    if (!existingByTmdb.empty) duplicate = true;
                }
                if (!duplicate) {
                    const existingByTitle = await db.collection('movies')
                        .where('userId', '==', userId)
                        .where('title', '==', title)
                        .get();
                    if (!existingByTitle.empty) duplicate = true;
                }
                if (duplicate) {
                    alert('Este filme já está na sua lista!');
                    return;
                }

                // Adicionar campos específicos para novo filme
                movieData = {
                    ...movieData,
                    userId: userId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    posterUrl: form.dataset.posterUrl || null,
                    backdropUrl: form.dataset.backdropUrl || null
                };

                await db.collection('movies').add(movieData);
            }

            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMovieModal'));
            if (modal) {
                modal.hide();
            }

            // Limpar o formulário
            form.reset();
            form.querySelector('#movieId').value = '';
            form.querySelector('#tmdbId').value = '';
            form.dataset.posterUrl = '';
            form.dataset.backdropUrl = '';
            document.getElementById('movieFormFields').classList.add('d-none');
            document.getElementById('movieSearch').value = '';
            
            // Recarregar filmes
            loadMovies(userId);
        } catch (error) {
            console.error('Erro ao salvar filme:', error);
            alert('Erro ao salvar filme. Por favor, tente novamente.');
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = originalButtonText;
        }
    });
    
    // Gerenciamento do modal
    const addMovieModal = document.getElementById('addMovieModal');
    if (addMovieModal) {
        // Quando o modal é aberto
        addMovieModal.addEventListener('show.bs.modal', (event) => {
            const mode = addMovieModal.dataset.mode;
            if (mode === 'edit') {
                delete addMovieModal.dataset.mode;
                return;
            }
            // Resetar o formulário
            const form = document.getElementById('movieForm');
            form.reset();
            form.querySelector('#movieId').value = '';
            form.querySelector('#tmdbId').value = '';
            form.dataset.posterUrl = '';
            form.dataset.backdropUrl = '';

            // Resetar a busca
            document.getElementById('movieSearch').value = '';
            document.getElementById('movieSuggestions').style.display = 'none';
        });

        // Quando o modal é fechado
        addMovieModal.addEventListener('hidden.bs.modal', () => {
            // Remover o foco de qualquer elemento dentro do modal
            document.activeElement.blur();
            
            // Resetar o título do modal
            document.querySelector('#addMovieModal .modal-title').textContent = 'Adicionar Filme';

            // Esconder campos do formulário e mostrar busca
            document.getElementById('movieFormFields').classList.add('d-none');
            document.getElementById('manualEntryBtn').textContent = 'Entrada Manual';
        });

        
    }
}