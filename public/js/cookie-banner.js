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
                <h3>🚨 MANDATORY SURVEILLANCE DISCLOSURE 🚨</h3>
                <p>
                    This site uses "cookies" (actually just session tokens) to:
                    <strong>Remember you're logged in</strong> and
                    <strong>Not show you this popup every 5 seconds</strong>
                </p>
                <p>
                    This site does <strong>NOT</strong>:
                    Sell your data to Cambridge Analytica •
                    Train AI on your posts (yet) •
                    Share anything with Zuckerberg
                </p>
                <p class="cookie-banner-small">
                    We DO log your visits for security/analytics, but we're too lazy to do anything malicious with it.
                </p>
            </div>
            <div class="cookie-banner-actions">
                <button id="cookie-accept" class="cookie-btn-primary">Whatever, I consent</button>
                <a href="/privacy.html" class="cookie-btn-link">Learn more</a>
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
