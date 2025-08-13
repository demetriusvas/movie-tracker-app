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

        const editBtn = document.getElementById('editMovieBtn');
        if (editBtn) {
            editBtn.style.display = 'block';
        }

        const deleteBtn = document.getElementById('deleteMovieBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }

        // Mostrar o modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
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
        document.getElementById('movieDetailsStatus').textContent = newStatus === 'assistido' ? 'Assistido' : 'Não Assistido';
        document.getElementById('movieDetailsWatchedDate').textContent = formatDate(currentMovie.watchedDate);
        document.getElementById('toggleStatusBtn').textContent = 
            newStatus === 'assistido' ? 'Marcar como Não Assistido' : 'Marcar como Assistido';

        // Recarrega a lista de filmes para atualizar a visualização
        loadMovies(firebase.auth().currentUser.uid);
    } catch (error) {
        console.error('Erro ao atualizar status do filme:', error);
        alert('Erro ao atualizar status do filme. Tente novamente.');
    }
}

// Adiciona listeners quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Listener para o botão de alternar status
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');
    if (toggleStatusBtn) {
        toggleStatusBtn.addEventListener('click', toggleMovieStatus);
    }
});

// Função para editar filme
function editMovie() {
    if (!currentMovie) return;

    try {
        // Preencher o formulário com os dados atuais
        document.getElementById('movieId').value = currentMovie.id;
        document.getElementById('tmdbId').value = currentMovie.tmdbId || '';
        document.getElementById('title').value = currentMovie.title;
        document.getElementById('originalTitle').value = currentMovie.originalTitle || currentMovie.title;
        document.getElementById('genre').value = currentMovie.genre || '';
        document.getElementById('runtime').value = currentMovie.runtime || '';
        document.getElementById('status').value = currentMovie.status;
        document.getElementById('rating').value = currentMovie.rating || '';
        document.getElementById('watchedDate').value = currentMovie.watchedDate || '';
        document.getElementById('synopsis').value = currentMovie.synopsis || '';

        // Fechar modal de detalhes e abrir modal de edição
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('movieDetailsModal'));
        if (detailsModal) {
            detailsModal.hide();
        }

        const editModal = new bootstrap.Modal(document.getElementById('addMovieModal'));
        document.querySelector('#addMovieModal .modal-title').textContent = 'Editar Filme';
        editModal.show();
    } catch (error) {
        console.error('Erro ao abrir formulário de edição:', error);
        alert('Erro ao abrir formulário de edição. Tente novamente.');
    }
}

// Listener para o botão de editar
document.getElementById('editMovieBtn')?.addEventListener('click', editMovie);

// Listener para o botão de excluir
document.getElementById('deleteMovieBtn')?.addEventListener('click', async () => {
    if (!currentMovie || !confirm('Tem certeza que deseja excluir este filme?')) return;
    
    try {
        await db.collection('movies').doc(currentMovie.id).delete();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('movieDetailsModal'));
        if (modal) {
            modal.hide();
        }
        
        loadMovies(firebase.auth().currentUser.uid);
    } catch (error) {
        console.error('Erro ao excluir filme:', error);
        alert('Erro ao excluir filme. Tente novamente.');
    }
});
