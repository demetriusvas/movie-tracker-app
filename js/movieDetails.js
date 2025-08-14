let currentMovie = null;
let movieDetailsModal = null;
let addMovieModal = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('movieDetails.js: DOMContentLoaded fired');
    const modalElement = document.getElementById('movieDetailsModal');
    if (modalElement) {
        movieDetailsModal = new bootstrap.Modal(modalElement);
    }

    const addModalElement = document.getElementById('addMovieModal');
    if (addModalElement) {
        addMovieModal = new bootstrap.Modal(addModalElement);
    }

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
});

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

// Função para preencher campos adicionais
function fillAdditionalFields(movieDetails) {
    if (movieDetails.releaseDate) {
        const releaseDateInput = document.getElementById('releaseDate');
        if (releaseDateInput) {
            releaseDateInput.value = movieDetails.releaseDate;
        }
    }
}

// Função para validar e atualizar elemento
function updateElement(id, value, defaultValue = '-') {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value || defaultValue;
    }
}

// Função para mostrar detalhes do filme
async function showMovieDetails(movie) {
    console.log('showMovieDetails called with movie:', movie);
    if (!movie) {
        console.error('Nenhum filme fornecido para exibição');
        return;
    }

    const modalElement = document.getElementById('movieDetailsModal');
    if (!modalElement) {
        console.error('Modal de detalhes não encontrado');
        return;
    }

    currentMovie = movie;

    try {
        // Se tiver o tmdbId, busca detalhes atualizados da API
        if (movie.tmdbId) {
            const updatedDetails = await getMovieDetails(movie.title);
            if (updatedDetails) {
                // Atualiza apenas os campos que vieram da API, mantendo os dados locais
                movie.originalTitle = updatedDetails.originalTitle;
                movie.synopsis = movie.synopsis || updatedDetails.synopsis;
                movie.runtime = movie.runtime || updatedDetails.runtime;
                movie.genre = movie.genre || updatedDetails.genre;
                movie.posterUrl = movie.posterUrl || updatedDetails.posterUrl;
                movie.backdropUrl = movie.backdropUrl || updatedDetails.backdropUrl;
            }
        }
    
        // Atualiza a interface com todos os detalhes disponíveis
        updateElement('movieDetailsTitle', movie.title);
        updateElement('movieDetailsOriginalTitle', movie.originalTitle || movie.title);
        updateElement('movieDetailsGenre', movie.genre);
        updateElement('movieDetailsRuntime', formatRuntime(movie.runtime));
        updateElement('movieDetailsStatus', movie.status === 'assistido' ? 'Assistido' : 'Não Assistido');
        updateElement('movieDetailsRating', movie.rating ? `${movie.rating}/10` : null);
        updateElement('movieDetailsWatchedDate', formatDate(movie.watchedDate));
        updateElement('movieDetailsSynopsis', movie.synopsis, 'Sem sinopse disponível');
        
        // Atualiza imagens
        const posterElement = document.getElementById('movieDetailsPoster');
        if (posterElement) {
            if (movie.posterUrl) {
                posterElement.src = movie.posterUrl;
                posterElement.style.display = 'block';
            } else {
                posterElement.src = 'https://placehold.co/500x750/212529/FFFFFF/png?text=Sem+Imagem';
                posterElement.style.display = 'block';
            }
        }

        // Atualizar botões de ação
        const toggleStatusBtn = document.getElementById('toggleStatusBtn');
        if (toggleStatusBtn) {
            toggleStatusBtn.textContent = movie.status === 'assistido' ? 'Marcar como Não Assistido' : 'Marcar como Assistido';
        }

        // Mostrar o modal
        if (movieDetailsModal) {
            movieDetailsModal.show();
        }
    } catch (error) {
        console.error('Erro ao mostrar detalhes do filme:', error);
        alert('Erro ao carregar detalhes do filme. Tente novamente.');
    }
}

// Função para atualizar status do filme
async function toggleMovieStatus() {
    if (!currentMovie) return;

    try {
        // Inverte o status
        const newStatus = currentMovie.status === 'assistido' ? 'nao_assistido' : 'assistido';
        
        // Atualiza no Firestore
        await db.collection('movies').doc(currentMovie.id).update({
            status: newStatus,
            // Se marcar como assistido, adiciona a data atual
            watchedDate: newStatus === 'assistido' ? new Date().toISOString() : null
        });

        // Atualiza o objeto local
        currentMovie.status = newStatus;
        currentMovie.watchedDate = newStatus === 'assistido' ? new Date().toISOString() : null;

        // Atualiza a interface
        updateElement('movieDetailsStatus', newStatus === 'assistido' ? 'Assistido' : 'Não Assistido');
        updateElement('movieDetailsWatchedDate', formatDate(currentMovie.watchedDate));
        document.getElementById('toggleStatusBtn').textContent = 
            newStatus === 'assistido' ? 'Marcar como Não Assistido' : 'Marcar como Assistido';

        // Recarrega a lista de filmes para atualizar a visualização
        location.reload();
    } catch (error) {
        console.error('Erro ao atualizar status do filme:', error);
        alert('Erro ao atualizar status do filme. Tente novamente.');
    }
}

// Função para editar filme
function editMovie() {
    if (!currentMovie) return;

    console.log('editMovie: currentMovie', currentMovie);

    try {
        if (addMovieModal) {
            // Preencher o formulário com os dados atuais
            const form = addMovieModal._element.querySelector('#movieForm');
            console.log('editMovie: form', form);
            form.reset();
            form.querySelector('#movieFormFields').classList.remove('d-none');
            form.querySelector('#movieSearch').value = currentMovie.title;
            console.log('editMovie: movieSearch', form.querySelector('#movieSearch').value);
            form.querySelector('#movieId').value = currentMovie.id;
            console.log('editMovie: movieId', form.querySelector('#movieId').value);
            form.querySelector('#tmdbId').value = currentMovie.tmdbId || '';
            console.log('editMovie: tmdbId', form.querySelector('#tmdbId').value);
            form.querySelector('#title').value = currentMovie.title;
            console.log('editMovie: title', form.querySelector('#title').value);
            form.querySelector('#originalTitle').value = currentMovie.originalTitle || currentMovie.title;
            console.log('editMovie: originalTitle', form.querySelector('#originalTitle').value);
            form.querySelector('#genre').value = currentMovie.genre || '';
            console.log('editMovie: genre', form.querySelector('#genre').value);
            form.querySelector('#runtime').value = currentMovie.runtime || '';
            console.log('editMovie: runtime', form.querySelector('#runtime').value);
            form.querySelector('#status').value = currentMovie.status;
            console.log('editMovie: status', form.querySelector('#status').value);
            form.querySelector('#rating').value = currentMovie.rating || '';
            console.log('editMovie: rating', form.querySelector('#rating').value);
            form.querySelector('#watchedDate').value = currentMovie.watchedDate || '';
            console.log('editMovie: watchedDate', form.querySelector('#watchedDate').value);
            form.querySelector('#synopsis').value = currentMovie.synopsis || '';
            console.log('editMovie: synopsis', form.querySelector('#synopsis').value);
            form.dataset.posterUrl = currentMovie.posterUrl || '';
            console.log('editMovie: posterUrl', form.dataset.posterUrl);
            form.dataset.backdropUrl = currentMovie.backdropUrl || '';
            console.log('editMovie: backdropUrl', form.dataset.backdropUrl);
            addMovieModal._element.querySelector('.modal-title').textContent = 'Editar Filme';
            addMovieModal.show();
            addMovieModal._element.dataset.mode = 'edit';
        }

// Função para excluir filme
async function deleteMovie() {
    if (!currentMovie || !confirm('Tem certeza que deseja excluir este filme?')) return;
    
    try {
        await db.collection('movies').doc(currentMovie.id).delete();
        
        if (movieDetailsModal) {
            movieDetailsModal.hide();
        }
        
        location.reload();
    } catch (error) {
        console.error('Erro ao excluir filme:', error);
        alert('Erro ao excluir filme. Tente novamente.');
    }
}