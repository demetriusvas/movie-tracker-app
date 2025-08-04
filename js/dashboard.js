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
            addMovieToDOM(movie);
        });
    } catch (error) {
        console.error('Erro ao carregar filmes:', error);
        moviesContainer.innerHTML = '<div class="col-12"><p class="text-danger">Erro ao carregar filmes</p></div>';
    }
}

// Adicionar filme ao DOM
function addMovieToDOM(movie) {
    const moviesContainer = document.getElementById('moviesContainer');
    const movieElement = document.createElement('div');
    movieElement.className = 'col-md-6 col-lg-4 mb-4 fade-in';
    movieElement.innerHTML = `
        <div class="card movie-card h-100">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title">${movie.title}</h5>
                <div class="mt-auto">
                    <span class="badge status-badge status-${movie.status}">
                        ${movie.status === 'assistido' ? 'Assistido' : 'Não Assistido'}
                    </span>
                    ${movie.rating ? `<span class="badge rating-badge ms-2">${movie.rating}/10</span>` : ''}
                    ${movie.watchedDate ? `<small class="d-block mt-2 text-muted">Assistido em: ${new Date(movie.watchedDate).toLocaleDateString()}</small>` : ''}
                </div>
            </div>
            <div class="card-footer bg-transparent">
                <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${movie.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn ms-2" data-id="${movie.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `;
    
    moviesContainer.appendChild(movieElement);
    
    // Adicionar event listeners para os botões
    movieElement.querySelector('.edit-btn').addEventListener('click', () => editMovie(movie));
    movieElement.querySelector('.delete-btn').addEventListener('click', () => deleteMovie(movie.id));
}

// Editar filme
function editMovie(movie) {
    document.getElementById('movieId').value = movie.id;
    document.getElementById('title').value = movie.title;
    document.getElementById('status').value = movie.status;
    document.getElementById('rating').value = movie.rating || '';
    document.getElementById('watchedDate').value = movie.watchedDate || '';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('addMovieModal'));
    modal.show();
}

// Excluir filme
async function deleteMovie(movieId) {
    if (confirm('Tem certeza que deseja excluir este filme?')) {
        try {
            await db.collection('movies').doc(movieId).delete();
            
            // Remover do DOM
            const movieElement = document.querySelector(`[data-id="${movieId}"]`).closest('.col-md-6');
            movieElement.remove();
            
            // Se não houver mais filmes, mostrar mensagem
            const moviesContainer = document.getElementById('moviesContainer');
            if (moviesContainer.children.length === 0) {
                moviesContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">Nenhum filme adicionado ainda</p>
                        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addMovieModal">
                            Adicionar seu primeiro filme
                        </button>
                    </div>
                `;
            }
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
        
        const movieId = document.getElementById('movieId').value;
        const movieData = {
            title: document.getElementById('title').value,
            status: document.getElementById('status').value,
            rating: document.getElementById('rating').value || null,
            watchedDate: document.getElementById('watchedDate').value || null,
            userId: userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            if (movieId) {
                // Atualizar filme existente
                await db.collection('movies').doc(movieId).update(movieData);
            } else {
                // Criar novo filme
                await db.collection('movies').add(movieData);
            }
            
            // Fechar modal e resetar formulário
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMovieModal'));
            modal.hide();
            document.getElementById('movieForm').reset();
            document.getElementById('movieId').value = '';
            
            // Recarregar filmes
            loadMovies(userId);
        } catch (error) {
            console.error('Erro ao salvar filme:', error);
            alert('Erro ao salvar filme');
        }
    });
    
    // Resetar formulário quando o modal é fechado
    document.getElementById('addMovieModal')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('movieForm').reset();
        document.getElementById('movieId').value = '';
    });
}