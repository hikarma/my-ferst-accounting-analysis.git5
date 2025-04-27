// Добавляем дополнительные маршруты для категорий
app.get('/api/categories', async (req, res) => {
    try {
        const categories = [
            { id: 'рукоделие', name: 'Рукоделие', icon: 'fas fa-cut' },
            { id: 'рисование', name: 'Рисование', icon: 'fas fa-paint-brush' },
            { id: 'фотография', name: 'Фотография', icon: 'fas fa-camera' },
            { id: 'кулинария', name: 'Кулинария', icon: 'fas fa-utensils' },
            { id: 'другое', name: 'Другое', icon: 'fas fa-ellipsis-h' }
        ];
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Популярные теги
app.get('/api/tags/popular', async (req, res) => {
    try {
        const tags = await Article.aggregate([
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        res.json(tags.map(tag => tag._id));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});