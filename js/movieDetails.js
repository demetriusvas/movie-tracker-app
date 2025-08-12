let currentMovie = null;

// Função para formatar a data
function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
}

// Função para formatar a duração
function formatRuntime(minutes) {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
}
    
    // Preencher campos adicionais se existirem
    if (movieDetails.releaseDate) {
        const releaseDateInput = document.getElementById('releaseDate');
        if (releaseDateInput) {
            releaseDateInput.value = movieDetails.releaseDate;
        }
    }
}

// Função para mostrar detalhes do filme
function showMovieDetails(movie) {
    currentMovie = movie;
    
    document.getElementById('movieDetailsTitle').textContent = movie.title;
    document.getElementById('movieDetailsGenre').textContent = movie.genre || '-';
    document.getElementById('movieDetailsRuntime').textContent = formatRuntime(movie.runtime);
    document.getElementById('movieDetailsStatus').textContent = movie.status === 'assistido' ? 'Assistido' : 'Não Assistido';
    document.getElementById('movieDetailsRating').textContent = movie.rating ? `${movie.rating}/10` : '-';
    document.getElementById('movieDetailsWatchedDate').textContent = formatDate(movie.watchedDate);
    document.getElementById('movieDetailsSynopsis').textContent = movie.synopsis || 'Sem sinopse disponível';
    
    if (movie.posterUrl) {
        document.getElementById('movieDetailsPoster').src = movie.posterUrl;
        document.getElementById('movieDetailsPoster').style.display = 'block';
    } else {
        document.getElementById('movieDetailsPoster').style.display = 'none';
    }

    // Atualizar texto do botão de status
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    toggleStatusBtn.textContent = movie.status === 'assistido' ? 'Marcar como Não Assistido' : 'Marcar como Assistido';

    const modal = new bootstrap.Modal(document.getElementById('movieDetailsModal'));
    modal.show();
}

// Função para editar filme
function editMovie() {
    if (!currentMovie) return;

    // Preencher o formulário com os dados atuais
    document.getElementById('movieId').value = currentMovie.id;
    document.getElementById('title').value = currentMovie.title;
    document.getElementById('genre').value = currentMovie.genre || '';
    document.getElementById('runtime').value = currentMovie.runtime || '';
    document.getElementById('status').value = currentMovie.status;
    document.getElementById('rating').value = currentMovie.rating || '';
    document.getElementById('watchedDate').value = currentMovie.watchedDate || '';
    document.getElementById('synopsis').value = currentMovie.synopsis || '';

    // Fechar modal de detalhes e abrir modal de edição
    bootstrap.Modal.getInstance(document.getElementById('movieDetailsModal')).hide();
    const editModal = new bootstrap.Modal(document.getElementById('addMovieModal'));
    document.querySelector('#addMovieModal .modal-title').textContent = 'Editar Filme';
    editModal.show();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Listener para o botão de editar
    document.getElementById('editMovieBtn').addEventListener('click', editMovie);

    // Listener para o botão de alternar status
    document.getElementById('toggleStatusBtn').addEventListener('click', async () => {
        if (!currentMovie) return;
        
        const newStatus = currentMovie.status === 'assistido' ? 'nao_assistido' : 'assistido';
        await db.collection('movies').doc(currentMovie.id).update({
            status: newStatus,
            watchedDate: newStatus === 'assistido' ? new Date().toISOString().split('T')[0] : null
        });

        bootstrap.Modal.getInstance(document.getElementById('movieDetailsModal')).hide();
        loadMovies(); // Recarregar lista de filmes
    });

    // Listener para o botão de excluir
    document.getElementById('deleteMovieBtn').addEventListener('click', async () => {
        if (!currentMovie || !confirm('Tem certeza que deseja excluir este filme?')) return;
        
        await db.collection('movies').doc(currentMovie.id).delete();
        bootstrap.Modal.getInstance(document.getElementById('movieDetailsModal')).hide();
        loadMovies(); // Recarregar lista de filmes
    });

    // Atualizar o formulário para incluir os novos campos
    const movieForm = document.getElementById('movieForm');
    movieForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const movieData = {
            title: document.getElementById('title').value,
            status: document.getElementById('status').value,
            rating: document.getElementById('rating').value ? parseInt(document.getElementById('rating').value) : null,
            watchedDate: document.getElementById('watchedDate').value || null,
            genre: document.getElementById('genre').value || null,
            runtime: document.getElementById('runtime').value ? parseInt(document.getElementById('runtime').value) : null,
            synopsis: document.getElementById('synopsis').value || null,
            updatedAt: new Date().toISOString()
        };

        const movieId = document.getElementById('movieId').value;
        
        try {
            if (movieId) {
                await db.collection('movies').doc(movieId).update(movieData);
            } else {
                movieData.createdAt = new Date().toISOString();
                await db.collection('movies').add(movieData);
            }

            bootstrap.Modal.getInstance(document.getElementById('addMovieModal')).hide();
            movieForm.reset();
            loadMovies();
        } catch (error) {
            console.error('Erro ao salvar filme:', error);
            alert('Erro ao salvar filme. Por favor, tente novamente.');
        }
    });
});
