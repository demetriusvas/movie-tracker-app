// Carregar apenas filmes não assistidos
async function loadUnwatchedMovies() {
    try {
        const snapshot = await db.collection('movies')
            .where('status', '==', 'nao_assistido')
            .orderBy('createdAt', 'desc')
            .get();

        const moviesContainer = document.getElementById('moviesContainer');
        moviesContainer.innerHTML = '';

        if (snapshot.empty) {
            moviesContainer.innerHTML = '<div class="col-12 text-center mt-4"><h4>Nenhum filme na lista para assistir.</h4></div>';
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
        loadUnwatchedMovies();
    });

    // Configurar botão de logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        firebase.auth().signOut();
    });
});
