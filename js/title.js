document.addEventListener('DOMContentLoaded', () => {
    const textFrames = document.querySelectorAll('.text-frame');
    const titleFrame = document.querySelector('.title-frame');
    const credits = document.querySelector('.credits');
    const enterBtn = document.querySelector('.enter-btn');
    const circle = document.querySelector('.circle-viewport');
    
    let currentFrame = 0;
    
    // Variable timing for different frames
    function getFrameDuration(index) {
        // Shorter for initial simple statements
        if (index < 4) return 3000;
        // Longer for statistical and question frames
        if (index < 6) return 5000;
        // Medium for Camerimage frame
        return 4000;
    }

    // Function to animate text frames
    function showNextFrame() {
        if (currentFrame < textFrames.length) {
            // Remove animation from previous frame
            if (currentFrame > 0) {
                textFrames[currentFrame - 1].style.animation = '';
                textFrames[currentFrame - 1].style.opacity = '0';
            }

            // Animate current frame
            const frame = textFrames[currentFrame];
            const duration = getFrameDuration(currentFrame);
            frame.style.animation = `textAppear ${duration}ms ease forwards`;
            
            currentFrame++;
            setTimeout(showNextFrame, duration);
        } else {
            // Show final title frame and credits
            textFrames.forEach(frame => {
                frame.style.opacity = '0';
                frame.style.animation = '';
            });
            
            titleFrame.classList.remove('hidden');
            titleFrame.classList.add('visible');
            
            setTimeout(() => {
                credits.classList.remove('hidden');
                credits.classList.add('visible');
                
                // Show enter button after credits
                setTimeout(() => {
                    enterBtn.classList.remove('hidden');
                    enterBtn.classList.add('visible');
                }, 1500);
            }, 2000);
            
            // Start circle expansion
            circle.style.animation = 'appear 2s ease forwards, expand 20s ease-in-out infinite';
        }
    }

    // Start sequence after a short delay
    setTimeout(showNextFrame, 1000);

    // Handle enter button click
    enterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'experience.html';
    });
});
