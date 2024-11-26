document.addEventListener('DOMContentLoaded', () => {
    const portals = document.querySelectorAll('.portal');
    
    portals.forEach(portal => {
        // Add hover effect
        portal.addEventListener('mouseenter', () => {
            const content = portal.querySelector('.portal-content');
            content.style.background = 'rgba(0, 0, 0, 0.2)';
        });
        
        portal.addEventListener('mouseleave', () => {
            const content = portal.querySelector('.portal-content');
            content.style.background = 'rgba(0, 0, 0, 0.4)';
        });
        
        // Add click transition
        portal.addEventListener('click', (e) => {
            e.preventDefault();
            const href = portal.getAttribute('href');
            
            portal.style.transform = 'scale(1.1)';
            document.body.style.opacity = '0';
            
            setTimeout(() => {
                window.location.href = href;
            }, 400);
        });
    });
    
    // Smooth entrance
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});
