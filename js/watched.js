// Carregar apenas filmes assistidos
async function loadWatchedMovies() {
    try {
        const snapshot = await db.collection('movies')
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

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    firebase.auth().onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        loadWatchedMovies();
    });

    // Configurar botão de logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        firebase.auth().signOut();
    });
});
