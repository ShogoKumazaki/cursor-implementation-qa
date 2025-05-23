document.addEventListener('DOMContentLoaded', async function() {
  // Get all slide containers
  const slideContainers = document.querySelectorAll('.reveal .slides section');

  // Store all scripts from loaded slides to execute them later
  const scriptsToExecute = [];

  // Load HTML content for each slide
  for (let i = 0; i < slideContainers.length; i++) {
    try {
      const slideNum = slideContainers[i].getAttribute('data-slide-num');
      const response = await fetch(`${slideNum}.html`);

      if (response.ok) {
        const html = await response.text();

        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract all styles from the head
        const styles = doc.querySelectorAll('style');
        styles.forEach(style => {
          // Add styles to the main document if not already present
          const existingStyle = document.head.querySelector(`style[data-slide="${slideNum}"]`);
          if (!existingStyle) {
            const newStyle = document.createElement('style');
            newStyle.textContent = style.textContent;
            newStyle.setAttribute('data-slide', slideNum);
            document.head.appendChild(newStyle);
          }
        });

        // Extract external script tags (like Chart.js)
        const scripts = doc.querySelectorAll('script[src]');
        scripts.forEach(script => {
          const existingScript = document.head.querySelector(`script[src="${script.src}"]`);
          if (!existingScript) {
            const newScript = document.createElement('script');
            newScript.src = script.src;
            document.head.appendChild(newScript);
          }
        });

        // Extract the complete slide content (the entire slide-container)
        const slideContent = doc.querySelector('.slide-container');
        if (slideContent) {
          // Clone the entire slide container with all its content
          const completeSlide = slideContent.cloneNode(true);

          // Clear and set the slide HTML
          slideContainers[i].innerHTML = '';
          slideContainers[i].appendChild(completeSlide);

          // Extract and store inline scripts for later execution
          const inlineScripts = doc.querySelectorAll('script:not([src])');
          inlineScripts.forEach(script => {
            if (script.textContent.trim()) {
              scriptsToExecute.push({
                slideNum: slideNum,
                code: script.textContent,
                slideElement: slideContainers[i]
              });
            }
          });
        } else {
          slideContainers[i].innerHTML = '<div class="p-4 bg-red-100 text-red-700">Error: No slide content found</div>';
        }
      } else {
        console.error(`Failed to load slide ${slideNum}.html`);
        // Don't display empty slides
        slideContainers[i].style.display = 'none';
      }
    } catch (error) {
      console.error(`Error loading slide ${slideContainers[i].getAttribute('data-slide-num')}.html:`, error);
      // Hide the slide if there's an error
      slideContainers[i].style.display = 'none';
    }
  }

  // Initialize RevealJS with proper dimensions matching original HTML files
  Reveal.initialize({
    hash: true,
    center: true,
    progress: true,
    controls: true,
    controlsBackArrows: 'faded',
    slideNumber: 'c/t',
    width: 1280,
    height: 720,
    margin: 0,
    minScale: 1,
    maxScale: 1,
    transition: 'slide',
    plugins: []
  });

  // Execute slide-specific scripts after RevealJS is initialized
  Reveal.addEventListener('ready', function() {
    executeSlideScripts();
  });

  Reveal.addEventListener('slidechanged', function(event) {
    const currentSlideNum = event.currentSlide.getAttribute('data-slide-num');
    executeSlideScripts(currentSlideNum);
  });

  function executeSlideScripts(currentSlideNum = null) {
    scriptsToExecute.forEach(scriptInfo => {
      // Execute script only for current slide or all scripts if no specific slide
      if (!currentSlideNum || scriptInfo.slideNum === currentSlideNum) {
        try {
          // Create a function to execute the script in the context of the slide
          const scriptFunction = new Function(scriptInfo.code);
          scriptFunction.call(scriptInfo.slideElement);
        } catch (error) {
          console.error(`Error executing script for slide ${scriptInfo.slideNum}:`, error);
        }
      }
    });
  }
});