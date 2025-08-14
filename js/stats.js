
let statusChart = null;
let ratingChart = null;

// Verificar autenticação
auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    loadStats(user.uid);
    setupEventListeners();
});

// Carregar estatísticas
async function loadStats(userId) {
    try {
        const snapshot = await db.collection('movies')
            .where('userId', '==', userId)
            .get();
        
        const movies = [];
        snapshot.forEach(doc => {
            movies.push({ id: doc.id, ...doc.data() });
        });
        
        updateStats(movies);
        updateCharts(movies);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Atualizar estatísticas textuais
function updateStats(movies) {
    const totalMovies = movies.length;
    const watchedMovies = movies.filter(movie => movie.status === 'assistido').length;
    const pendingMovies = movies.filter(movie => movie.status === 'nao_assistido').length;
    
    // Calcular média de notas
    const ratedMovies = movies.filter(movie => movie.rating && movie.status === 'assistido');
    const averageRating = ratedMovies.length > 0 
        ? (ratedMovies.reduce((sum, movie) => sum + parseInt(movie.rating), 0) / ratedMovies.length).toFixed(1)
        : '0.0';
    
    // Último filme assistido
    const watchedMoviesSorted = movies
        .filter(movie => movie.status === 'assistido' && movie.watchedDate)
        .sort((a, b) => new Date(b.watchedDate) - new Date(a.watchedDate));
    
    const lastWatchedMovie = watchedMoviesSorted[0];
    
    // Atualizar DOM
    document.getElementById('totalMovies').textContent = totalMovies;
    document.getElementById('watchedMovies').textContent = watchedMovies;
    document.getElementById('pendingMovies').textContent = pendingMovies;
    document.getElementById('averageRating').textContent = averageRating;
    
    const lastWatchedElement = document.getElementById('lastWatchedMovie');
    if (lastWatchedMovie) {
        lastWatchedElement.innerHTML = `
            <h5>${lastWatchedMovie.title}</h5>
            <p class="mb-1">Nota: ${lastWatchedMovie.rating}/10</p>
            <small class="text-muted">Assistido em: ${new Date(lastWatchedMovie.watchedDate).toLocaleDateString()}</small>
        `;
    } else {
        lastWatchedElement.innerHTML = '<p class="text-muted">Nenhum filme assistido ainda</p>';
    }
}

// Atualizar gráficos
function updateCharts(movies) {
    // Gráfico de status
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const watchedCount = movies.filter(movie => movie.status === 'assistido').length;
    const notWatchedCount = movies.filter(movie => movie.status === 'nao_assistido').length;
    
    if (statusChart) {
        statusChart.destroy();
    }
    
    statusChart = new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: ['Assistidos', 'Não Assistidos'],
            datasets: [{
                data: [watchedCount, notWatchedCount],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfico de distribuição de notas
    const ratingCtx = document.getElementById('ratingChart').getContext('2d');
    const ratings = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 1-10
    
    movies.forEach(movie => {
        if (movie.rating) {
            ratings[parseInt(movie.rating) - 1]++;
        }
    });
    
    if (ratingChart) {
        ratingChart.destroy();
    }
    
    ratingChart = new Chart(ratingCtx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [{
                label: 'Número de Filmes',
                data: ratings,
                backgroundColor: '#007bff',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Setup de event listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    });
}
