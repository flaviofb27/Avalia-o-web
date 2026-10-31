const API_URL = 'https://dummyjson.com/products';

const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const statusMessage = document.getElementById('status-message');
const btnHome = document.getElementById('btn-home');
const btnFavorites = document.getElementById('btn-favorites');
const favCountSpan = document.getElementById('fav-count');

const productModal = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.getElementById('close-modal');

let currentProducts = [];
let currentView = 'home';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts(API_URL);
    updateFavCount();

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    btnHome.addEventListener('click', () => {
        currentView = 'home';
        btnHome.classList.add('active');
        btnFavorites.classList.remove('active');
        searchInput.value = '';
        fetchProducts(API_URL);
    });

    btnFavorites.addEventListener('click', () => {
        currentView = 'favorites';
        btnFavorites.classList.add('active');
        btnHome.classList.remove('active');
        searchInput.value = '';
        renderFavorites();
    });

    closeModal.addEventListener('click', () => {
        productModal.classList.add('hidden');
    });

    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.add('hidden');
        }
    });
});

async function fetchProducts(url) {
    showLoading(true);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data = await response.json();
        currentProducts = data.products;
        renderProducts(currentProducts);
    } catch (error) {
        console.error('Falha ao buscar produtos:', error);
        showError('Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.');
    } finally {
        showLoading(false);
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    if (currentView === 'favorites') {
        const favorites = getFavorites();
        const filtered = favorites.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
        renderProducts(filtered);
        return;
    }

    if (query === '') {
        fetchProducts(API_URL);
        return;
    }

    const searchUrl = `${API_URL}/search?q=${encodeURIComponent(query)}`;
    fetchProducts(searchUrl);
}

function renderProducts(products) {
    productsGrid.innerHTML = '';

    if (products.length === 0) {
        productsGrid.innerHTML = `<div class="message">Nenhum produto encontrado.</div>`;
        return;
    }

    const favorites = getFavorites();

    products.forEach(product => {
        const isFav = favorites.some(fav => fav.id === product.id);

        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
            <div class="card-body">
                <div>
                    <h3 class="card-title">${product.title}</h3>
                    <div class="card-price">R$ ${product.price.toFixed(2)}</div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-details" onclick="openDetails(${product.id})">Detalhes</button>
                    <button class="btn btn-fav ${isFav ? 'favorited' : ''}" onclick="toggleFavorite(${product.id})">
                        ${isFav ? '❤️ Favoritado' : '🤍 Favorito'}
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

async function openDetails(id) {
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar detalhes');
        const product = await response.json();

        modalBody.innerHTML = `
            <div class="modal-details">
                <h2>${product.title}</h2>
                <img src="${product.thumbnail}" alt="${product.title}">
                <p><strong>Descrição:</strong> ${product.description}</p>
                <p><strong>Categoria:</strong> ${product.category}</p>
                <p><strong>Marca:</strong> ${product.brand || 'N/A'}</p>
                <p><strong>Avaliação:</strong> ⭐ ${product.rating}</p>
                <div class="card-price" style="margin-top: 10px;">R$ ${product.price.toFixed(2)}</div>
            </div>
        `;
        productModal.classList.remove('hidden');
    } catch (error) {
        alert('Não foi possível carregar os detalhes do produto.');
    } finally {
        showLoading(false);
    }
}

function getFavorites() {
    const favs = localStorage.getItem('web_favorites');
    return favs ? JSON.parse(favs) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem('web_favorites', JSON.stringify(favorites));
    updateFavCount();
}

function toggleFavorite(id) {
    let favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        const product = currentProducts.find(p => p.id === id);
        if (product) {
            favorites.push(product);
        }
    }

    saveFavorites(favorites);

    if (currentView === 'favorites') {
        renderFavorites();
    } else {
        renderProducts(currentProducts);
    }
}

function renderFavorites() {
    const favorites = getFavorites();
    currentProducts = favorites;
    renderProducts(favorites);
}

function updateFavCount() {
    const favorites = getFavorites();
    favCountSpan.textContent = favorites.length;
}

function showLoading(isLoading) {
    if (isLoading) {
        statusMessage.className = 'message';
        statusMessage.textContent = 'Carregando produtos...';
        statusMessage.classList.remove('hidden');
    } else {
        statusMessage.classList.add('hidden');
    }
}

function showError(msg) {
    statusMessage.className = 'message';
    statusMessage.style.color = 'var(--danger)';
    statusMessage.textContent = msg;
    statusMessage.classList.remove('hidden');
}
