// Configuração da API de Filmes (TMDb)
const TMDB_API_KEY = '577e86ff6fa23f2befa26d0b5bb02a69';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Função para buscar detalhes do filme
async function getMovieDetails(title) {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'SUA_CHAVE_API_AQUI') {
        console.warn('Chave da API do TMDb não configurada.');
        return null;
    }

    try {
        // Primeiro, busca o filme pelo título
        const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=pt-BR`;
        const searchResponse = await fetch(searchUrl);

        if (!searchResponse.ok) {
            throw new Error(`Erro na API do TMDb: Status ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.results || searchData.results.length === 0) {
            console.log(`Nenhum resultado encontrado para: "${title}"`);
            return null;
        }

        // Pega o primeiro resultado
        const movieId = searchData.results[0].id;

        // Busca detalhes completos do filme
        const detailsUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=pt-BR`;
        const detailsResponse = await fetch(detailsUrl);

        if (!detailsResponse.ok) {
            throw new Error(`Erro ao buscar detalhes do filme: Status ${detailsResponse.status}`);
        }

        const movieDetails = await detailsResponse.json();

        // Formata os dados do filme
        return {
            tmdbId: movieDetails.id,
            title: movieDetails.title,
            originalTitle: movieDetails.original_title,
            synopsis: movieDetails.overview,
            runtime: movieDetails.runtime,
            genre: movieDetails.genres.map(g => g.name).join(', '),
            releaseDate: movieDetails.release_date,
            posterUrl: movieDetails.poster_path ? `${TMDB_IMAGE_BASE_URL}${movieDetails.poster_path}` : null,
            backdropUrl: movieDetails.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movieDetails.backdrop_path}` : null,
            rating: movieDetails.vote_average,
            popularity: movieDetails.popularity,
            status: movieDetails.status
        };
    } catch (error) {
        console.error('Erro ao buscar detalhes do filme:', error);
        return null;
    }
}

// Função para buscar sugestões de filmes
async function searchMovieSuggestions(query) {
    if (!query) return [];

    try {
        const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR`;
        const response = await fetch(searchUrl);

        if (!response.ok) {
            throw new Error(`Erro na API do TMDb: Status ${response.status}`);
        }

        const data = await response.json();
        return data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            releaseDate: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
            posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null
        }));
    } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        return [];
    }
}
