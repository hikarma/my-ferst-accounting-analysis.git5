document.addEventListener('DOMContentLoaded', function() {
    // Получаем ID статьи из URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (!articleId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем статью
    loadArticle(articleId);
    
    // Загружаем комментарии
    loadComments(articleId);
    
    // Загружаем похожие статьи
    loadRelatedArticles(articleId);
    
    // Обработчик отправки комментария
    const submitCommentBtn = document.getElementById('submitComment');
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', () => {
            submitComment(articleId);
        });
    }
});

async function loadArticle(articleId) {
    try {
        const response = await fetch(`/api/articles/${articleId}`);
        const article = await response.json();
        
        if (!response.ok) {
            throw new Error(article.message || 'Статья не найдена');
        }
        
        renderArticle(article);
    } catch (err) {
        console.error('Ошибка загрузки статьи:', err);
        showNotification(err.message || 'Ошибка загрузки статьи', 'error');
        window.location.href = 'index.html';
    }
}

function renderArticle(article) {
    const container = document.getElementById('articleContent');
    if (!container) return;
    
    // Обновляем title страницы
    document.title = `${article.title} - Творческие хобби`;
    
    container.innerHTML = `
        <div class="article-header">
            <h1>${article.title}</h1>
            <div class="meta">
                <span>Опубликовано: ${new Date(article.createdAt).toLocaleDateString()}</span>
                <span>Автор: ${article.author?.username || 'Неизвестен'}</span>
                <span>Категория: ${article.category}</span>
            </div>
            <div class="tags">
                ${article.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || ''}
            </div>
        </div>
        
        <div class="article-image">
            <img src="${article.imageUrl || 'https://via.placeholder.com/800x400'}" alt="${article.title}">
        </div>
        
        <div class="article-body">
            ${article.content}
        </div>
        
        <div class="article-footer">
            <div class="social-share">
                <span>Поделиться:</span>
                <a href="#" class="social-icon"><i class="fab fa-vk"></i></a>
                <a href="#" class="social-icon"><i class="fab fa-telegram"></i></a>
                <a href="#" class="social-icon"><i class="fab fa-facebook"></i></a>
            </div>
        </div>
    `;
}

async function loadComments(articleId) {
    try {
        const response = await fetch(`/api/articles/${articleId}`);
        const article = await response.json();
        
        if (!response.ok) {
            throw new Error(article.message || 'Ошибка загрузки комментариев');
        }
        
        renderComments(article.comments || []);
    } catch (err) {
        console.error('Ошибка загрузки комментариев:', err);
        showNotification('Ошибка загрузки комментариев', 'error');
    }
}

function renderComments(comments) {
    const container = document.getElementById('commentsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (comments.length === 0) {
        container.innerHTML = '<p>Комментариев пока нет. Будьте первым!</p>';
        return;
    }
    
    comments.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        
        commentElement.innerHTML = `
            <div class="comment-author">${comment.author?.username || 'Аноним'}</div>
            <div class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</div>
            <div class="comment-content">${comment.content}</div>
        `;
        
        container.appendChild(commentElement);
    });
}

async function submitComment(articleId) {
    const commentText = document.getElementById('commentText').value.trim();
    if (!commentText) {
        showNotification('Введите текст комментария', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('Для комментирования необходимо авторизоваться', 'error');
        openModal(authModal);
        return;
    }
    
    try {
        const response = await fetch(`/api/articles/${articleId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: commentText })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Ошибка при отправке комментария');
        }
        
        document.getElementById('commentText').value = '';
        showNotification('Комментарий добавлен', 'success');
        loadComments(articleId);
    } catch (err) {
        console.error('Ошибка отправки комментария:', err);
        showNotification(err.message || 'Ошибка отправки комментария', 'error');
    }
}

async function loadRelatedArticles(articleId) {
    try {
        // В реальном приложении здесь должен быть запрос к API для получения похожих статей
        // Для демонстрации просто загружаем статьи из той же категории
        const response = await fetch('/api/articles?limit=3');
        const data = await response.json();
        
        if (response.ok) {
            renderRelatedArticles(data.articles);
        } else {
            throw new Error(data.message || 'Ошибка загрузки похожих статей');
        }
    } catch (err) {
        console.error('Ошибка загрузки похожих статей:', err);
    }
}

function renderRelatedArticles(articles) {
    const container = document.getElementById('relatedArticles');
    if (!container) return;
    
    container.innerHTML = '';
    
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
                <a href="article.html?id=${article._id}" class="read-more">Читать далее</a>
            </div>
        `;
        
        container.appendChild(articleCard);
    });
}