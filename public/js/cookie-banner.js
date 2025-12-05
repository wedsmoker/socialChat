// Cookie consent banner (troll edition)
(function() {
    // Check if user already dismissed the banner
    if (localStorage.getItem('cookieBannerDismissed') === 'true') {
        return;
    }

    // Create banner HTML
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML = `
        <div class="cookie-banner-content">
            <div class="cookie-banner-text">
                <h3>OUR PRIVACY STANCE</h3>
                <p>
                    This site uses "cookies" (actually just session tokens) to:
                    <strong>Remember you're logged in</strong> and
                    <strong>Not show you this popup every 5 seconds</strong>
                </p>
                <p>
                    No algorithms deciding what you see •
                    No selling your data •
                    No tracking who you are •
                    No engagement metrics •
                    Just you and your people
                </p>
                <p class="cookie-banner-small">
                    Built different. Stay different.
                </p>
            </div>
            <div class="cookie-banner-actions">
                <button id="cookie-accept" class="cookie-btn-primary">Let's go</button>
                <a href="/privacy.html" class="cookie-btn-link">Privacy details</a>
            </div>
        </div>
    `;

    // Add to page
    document.body.appendChild(banner);

    // Handle dismiss
    document.getElementById('cookie-accept').addEventListener('click', () => {
        localStorage.setItem('cookieBannerDismissed', 'true');
        banner.classList.add('cookie-banner-hide');
        setTimeout(() => banner.remove(), 300);
    });

    // Show banner with animation
    setTimeout(() => banner.classList.add('cookie-banner-show'), 100);
})();
