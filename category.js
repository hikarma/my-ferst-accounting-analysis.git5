document.addEventListener('DOMContentLoaded', function() {
    // Определяем текущую категорию по URL
    const path = window.location.pathname;
    let category;
    
    if (path.includes('handcraft')) category = 'рукоделие';
    else if (path.includes('painting')) category = 'рисование';
    else if (path.includes('photography')) category = 'фотография';
    else if (path.includes('cooking')) category = 'кулинария';
    
    if (!category) return;
    
    // Загружаем данные для категории
    loadCategoryData(category);
    
    // Обработчики сортировки и фильтрации
    const sortSelect = document.getElementById(`sort${capitalizeFirstLetter(category)}`);
    const filterSelect = document.getElementById(`filter${capitalizeFirstLetter(category)}Tags`);
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadCategoryArticles(category);
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            loadCategoryArticles(category);
        });
    }
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function loadCategoryData(category) {
    try {
        // Загружаем популярные теги для категории
        const tagsResponse = await fetch(`/api/articles?category=${category}&limit=5`);
        const tagsData = await tagsResponse.json();
        
        if (tagsResponse.ok) {
            renderCategoryTags(category, tagsData);
        }
        
        // Загружаем статьи
        await loadCategoryArticles(category);
        
        // Загружаем популярные статьи
        await loadPopularArticles(category);
        
        // Загружаем мастер-классы (можно добавить отдельный endpoint)
        await loadWorkshops(category);
        
    } catch (err) {
        console.error('Ошибка загрузки данных категории:', err);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

function renderCategoryTags(category, articles) {
    const tagsContainer = document.getElementById(`${category}Tags`);
    if (!tagsContainer) return;
    
    // Собираем все теги из статей
    const allTags = articles.reduce((acc, article) => {
        if (article.tags) {
            return [...acc, ...article.tags];
        }
        return acc;
    }, []);
    
    // Удаляем дубликаты
    const uniqueTags = [...new Set(allTags)];
    
    // Ограничиваем количество тегов
    const tagsToShow = uniqueTags.slice(0, 10);
    
    // Очищаем контейнер
    tagsContainer.innerHTML = '';
    
    // Добавляем теги
    tagsToShow.forEach(tag => {
        const tagElement = document.createElement('a');
        tagElement.href = `#${tag}`;
        tagElement.className = 'tag';
        tagElement.textContent = `#${tag}`;
        tagsContainer.appendChild(tagElement);
    });
    
    // Заполняем select для фильтрации
    const filterSelect = document.getElementById(`filter${capitalizeFirstLetter(category)}Tags`);
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Все теги</option>';
        uniqueTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            filterSelect.appendChild(option);
        });
    }
}

async function loadCategoryArticles(category, page = 1) {
    try {
        const sortSelect = document.getElementById(`sort${capitalizeFirstLetter(category)}`);
        const filterSelect = document.getElementById(`filter${capitalizeFirstLetter(category)}Tags`);
        
        let url = `/api/articles?category=${category}&page=${page}`;
        
        // Добавляем сортировку
        if (sortSelect) {
            const sortValue = sortSelect.value;
            if (sortValue === 'popular') url += '&sort=-views';
            else if (sortValue === 'commented') url += '&sort=-commentsCount';
            else url += '&sort=-createdAt';
        }
        
        // Добавляем фильтр по тегу
        if (filterSelect && filterSelect.value) {
            url += `&tag=${filterSelect.value}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
            renderCategoryArticles(category, data.articles);
            renderPagination(category, page, data.totalPages);
        } else {
            throw new Error(data.message || 'Ошибка загрузки статей');
        }
    } catch (err) {
        console.error('Ошибка загрузки статей:', err);
        showNotification('Ошибка загрузки статей', 'error');
    }
}

function renderCategoryArticles(category, articles) {
    const container = document.getElementById(`${category}Articles`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (articles.length === 0) {
        container.innerHTML = '<p>Статьи не найдены</p>';
        return;
    }
    
    articles.forEach(article => {
        const articleCard = document.createElement('article');
        articleCard.className = 'article-card';
        
        articleCard.innerHTML = `
            <img src="${article.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${article.title}">
            <div class="article-card-content">
                <h3>${article.title}</h3>
                <div class="meta">
                    <span>${new Date(article.createdAt).toLocaleDateString()}</span>
                    <span>${article.author?.username || 'Автор'}</span>
                </div>
                <p>${article.content.substring(0, 100)}...</p>
                <div class="tags">
                    ${article.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || ''}
                </div>
                <a href="article.html?id=${article._id}" class="read-more">Читать далее</a>
            </div>
        `;
        
        container.appendChild(articleCard);
    });
}

function renderPagination(category, currentPage, totalPages) {
    const container = document.getElementById(`${category}Pagination`);
    if (!container || totalPages <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    
    container.innerHTML = '';
    
    // Кнопка "Назад"
    if (currentPage > 1) {
        const prevLink = document.createElement('a');
        prevLink.href = '#';
        prevLink.textContent = '«';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadCategoryArticles(category, currentPage - 1);
        });
        container.appendChild(prevLink);
    }
    
    // Страницы
    for (let i = 1; i <= totalPages; i++) {
        const pageLink = document.createElement(currentPage === i ? 'span' : 'a');
        if (currentPage !== i) {
            pageLink.href = '#';
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadCategoryArticles(category, i);
            });
        } else {
            pageLink.className = 'active';
        }
        pageLink.textContent = i;
        container.appendChild(pageLink);
    }
    
    // Кнопка "Вперед"
    if (currentPage < totalPages) {
        const nextLink = document.createElement('a');
        nextLink.href = '#';
        nextLink.textContent = '»';
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadCategoryArticles(category, currentPage + 1);
        });
        container.appendChild(nextLink);
    }
}

async function loadPopularArticles(category) {
    try {
        const response = await fetch(`/api/articles?category=${category}&sort=-views&limit=3`);
        const data = await response.json();
        
        if (response.ok) {
            renderPopularArticles(category, data.articles);
        } else {
            throw new Error(data.message || 'Ошибка загрузки популярных статей');
        }
    } catch (err) {
        console.error('Ошибка загрузки популярных статей:', err);
    }
}

function renderPopularArticles(category, articles) {
    const container = document.getElementById(`popular${capitalizeFirstLetter(category)}Articles`);
    if (!container) return;
    
    container.innerHTML = '';
    
    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article';
        
        articleElement.innerHTML = `
            <img src="${article.imageUrl || 'https://via.placeholder.com/80x60'}" alt="${article.title}">
            <div>
                <h4><a href="article.html?id=${article._id}">${article.title}</a></h4>
                <span class="views">${article.views || 0} просмотров</span>
            </div>
        `;
        
        container.appendChild(articleElement);
    });
}

async function loadWorkshops(category) {
    try {
        // В реальном приложении здесь должен быть запрос к API
        // Для демонстрации используем моковые данные
        const workshops = [
            {
                title: 'Мастер-класс по вязанию',
                date: '2023-06-15',
                id: '1'
            },
            {
                title: 'Основы вышивки крестом',
                date: '2023-06-20',
                id: '2'
            }
        ];
        
        renderWorkshops(category, workshops);
    } catch (err) {
        console.error('Ошибка загрузки мастер-классов:', err);
    }
}

function renderWorkshops(category, workshops) {
    const container = document.getElementById(`${category}Workshops`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (workshops.length === 0) {
        container.innerHTML = '<p>Мастер-классы не запланированы</p>';
        return;
    }
    
    workshops.forEach(workshop => {
        const workshopElement = document.createElement('div');
        workshopElement.className = 'workshop';
        
        workshopElement.innerHTML = `
            <h4>
                <i class="fas fa-graduation-cap"></i>
                <a href="workshop.html?id=${workshop.id}">${workshop.title}</a>
            </h4>
            <div class="date">${new Date(workshop.date).toLocaleDateString()}</div>
        `;
        
        container.appendChild(workshopElement);
    });
}