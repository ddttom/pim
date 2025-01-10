export default async function decorate(block) {
  const supportsWebP = window.createImageBitmap && window.createImageBitmap.toString().includes("native code");

  async function fetchSlideHtml(path) {
    try {
      const response = await fetch(`${path}.plain.html`);
      if (!response.ok) {
        throw new Error(`Failed to fetch HTML for slide: ${path}`);
      }
      return await response.text();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function fetchSlides() {
    const response = await fetch("/slides/query-index.json");
    const json = await response.json();
    
    const slides = [];
    for (const slide of json.data) {
      if (window.innerWidth > 799) {
        slide.html = await fetchSlideHtml(slide.path);
      } else {
        slide.html = null;
      }
      slides.push(slide);
    }
    return slides;
  }

  function fetchSupportingText(html) {
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const h2 = doc.querySelector("h2");
    let firstParagraph = h2 ? h2.nextElementSibling : doc.querySelector("p");

    while (firstParagraph && firstParagraph.tagName.toLowerCase() !== "p") {
      firstParagraph = firstParagraph.nextElementSibling;
    }

    return firstParagraph?.textContent.trim() || null;
  }

  function setSlideBackground(slideItem, imageUrl) {
    const finalImageUrl = supportsWebP
      ? `${imageUrl}?width=2000&format=webply&optimize=medium`
      : imageUrl;

    const img = new Image();
    img.src = finalImageUrl;

    img.onload = () => {
      slideItem.style.backgroundImage = `url(${finalImageUrl})`;
      slideItem.classList.add("loaded");
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${finalImageUrl}`);
    };
  }

  async function createPanel(slideData) {
    let html = slideData.html;
    if (!html) {
      html = await fetchSlideHtml(slideData.path);
      if (!html) {
        console.error("Failed to fetch HTML content for this slide");
        return;
      }
    }

    const panel = document.createElement('div');
    panel.classList.add('slide-panel');
    panel.innerHTML = `
      <div class="slide-panel-content">
        <div class="slide-panel-body"></div>
      </div>
      <button class="slide-panel-close" aria-label="Close panel">&times;</button>
    `;
    panel.querySelector('.slide-panel-body').innerHTML = html;
    
    const closeButton = panel.querySelector('.slide-panel-close');
    closeButton.addEventListener('click', () => {
      panel.remove();
    });

    document.body.appendChild(panel);

    // Ensure the close button is visible and above other content
    setTimeout(() => {
      closeButton.style.display = 'block';
      closeButton.style.zIndex = '1001'; // Ensure this is higher than other elements
    }, 0);
  }

  async function createSlideItem(slideData, index) {
    const { image, title, description, path } = slideData;
    const imageUrl = image.split("?")[0];

    const slideItem = document.createElement("div");
    slideItem.classList.add("slide-builder-item");
    slideItem.setAttribute("data-bg", imageUrl);
    slideItem.setAttribute("data-slidenum", index + 1);

    slideItem.innerHTML = `
      <div class="text-container">
        <h2>${title}</h2>
        <p><strong>${description}</strong></p>
      </div>
    `;

    slideItem.addEventListener("click", () => createPanel(slideData));

    // Fetch and append supporting text if available
    if (!slideData.html && window.innerWidth <= 799) {
      slideData.html = await fetchSlideHtml(path);
    }

    if (slideData.html) {
      const supportingText = fetchSupportingText(slideData.html);
      if (supportingText) {
        const textContainer = slideItem.querySelector('.text-container');
        textContainer.insertAdjacentHTML('beforeend', `
          <p class="supporting-text">${supportingText}</p>
        `);
      }
    }

    return slideItem;
  }

  const container = document.querySelector(".slide-builder");
  const slides = await fetchSlides();

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const slideItem = entry.target;
          const imageUrl = slideItem.dataset.bg;
          setSlideBackground(slideItem, imageUrl);
          observer.unobserve(slideItem);
        }
      });
    },
    { rootMargin: "100px" }
  );

  for (let i = 0; i < slides.length; i++) {
    const slideItem = await createSlideItem(slides[i], i);
    observer.observe(slideItem);
    container.appendChild(slideItem);
  }
}