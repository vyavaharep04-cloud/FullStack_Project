// ================================
// BLOG ARTICLE TOGGLE
// Expands / collapses full article content
// Multiple articles can be open simultaneously
// ================================

function toggleArticle(articleId, btn) {

    // Get the article card
    const article = document.getElementById(articleId);

    // Check current state
    const isOpen = article.classList.contains("open");

    if (isOpen) {

        // CLOSE — collapse article
        article.classList.remove("open");

        // Update button text
        btn.innerHTML = 'Read More <i class="fa-solid fa-chevron-down btn-arrow"></i>';

    } else {

        // OPEN — expand article
        article.classList.add("open");

        // Update button text
        btn.innerHTML = 'Read Less <i class="fa-solid fa-chevron-up btn-arrow"></i>';

        // Auto scroll to article smoothly
        setTimeout(function () {
            article.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);

    }
}