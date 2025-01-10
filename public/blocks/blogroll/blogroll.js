// Function to format the date
function formatDate(timestamp) {
  const date = new Date(parseInt(timestamp, 10) * 1000);
  return date.toLocaleDateString('en-GB');
}

// Function to extract series name and part number
function extractSeriesInfo(title, path) {
  const match = title.match(/^(.*?)\s*-?\s*Part\s*(\d+)$/i);
  const basePath = path.split('/').slice(0, -1).join('/');
  return {
    name: match ? match[1].trim() : title,
    part: match ? parseInt(match[2], 10) : null,
    basePath
  };
}

// Function to group and sort blog posts
function groupAndSortPosts(posts, acceptList = []) {
  const seriesMap = new Map();

  posts.forEach(post => {
    const postPath = post.path.toLowerCase();
    // Only filter if acceptList is not empty
    if (acceptList.length > 0 && !acceptList.some(term => postPath.includes(term))) {
      return;
    }

    const { name, part, basePath } = extractSeriesInfo(post.title, post.path);
    const key = `${basePath}/${name}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, []);
    }
    seriesMap.get(key).push({ ...post, part });
  });

  // Sort posts within each series
  seriesMap.forEach(posts => {
    posts.sort((a, b) => {
      if (a.part !== null && b.part !== null) {
        return a.part - b.part;
      }
      return a.title.localeCompare(b.title);
    });
  });

  // Convert map to array and sort by number of posts (descending)
  return Array.from(seriesMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, posts]) => [posts[0].title.split(' - ')[0], posts]);
}

// Configuration function
function getConfig(block) {
  const config = {
    acceptList: [],
    isCompact: block.classList.contains('compact'),
  };
  
  const rows = [...block.children];
  if (rows.length > 0) {
    const firstRow = rows.shift();
    config.acceptList = [...firstRow.children]
      .map(cell => cell.textContent.trim().toLowerCase())
      .filter(text => text !== '');
  }

  // If acceptList is empty and it's compact mode, set default path
  if (config.acceptList.length === 0 && config.isCompact) {
    const currentPath = window.location.pathname.toLowerCase();
    const pathParts = currentPath.split('/');
    const lastPart = pathParts[pathParts.length - 1].replace(/-part-\d+$/, '');
    const folderPath = pathParts.slice(0, -1).join('/');
    config.acceptList.push(folderPath + '/' + lastPart);
  }

  return config;
}

// Function to create the compact blogroll panel
function createCompactBlogrollPanel(groupedPosts, originalPosts, config) {
  const panel = document.createElement('div');
  panel.className = 'blogroll-panel';
  
  const panelHeader = document.createElement('div');
  panelHeader.className = 'blogroll-panel-header';
  
  const panelTitle = document.createElement('div');
  panelTitle.className = 'blogroll-panel-title';
  panelTitle.textContent = 'Blogroll';
  panelHeader.appendChild(panelTitle);
  
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;'; // This creates a × symbol
  closeButton.className = 'blogroll-panel-close';
  closeButton.setAttribute('aria-label', 'Close blogroll panel');
  closeButton.addEventListener('click', () => panel.classList.remove('open'));
  panelHeader.appendChild(closeButton);
  
  panel.appendChild(panelHeader);

  const blogrollContent = document.createElement('div');
  blogrollContent.className = 'blogroll-panel-content';

  updatePanelContent(blogrollContent, groupedPosts);

  // Add "Show All" button at the bottom of the panel
  const showAllContainer = document.createElement('div');
  showAllContainer.className = 'blogroll-show-all';
  
  const showAllButton = document.createElement('button');
  showAllButton.textContent = 'Show All Posts';
  showAllButton.setAttribute('aria-label', 'Show all posts');
  showAllButton.title = 'Show all posts';
  
  let isShowingAll = false;
  
  showAllContainer.appendChild(showAllButton);
  showAllContainer.addEventListener('click', () => {
    if (isShowingAll) {
      // Revert to previous state
      updatePanelContent(blogrollContent, groupedPosts);
      showAllButton.textContent = 'Show All Posts';
    } else {
      // Show all posts
      const allPosts = groupAndSortPosts(originalPosts, []);
      updatePanelContent(blogrollContent, allPosts);
      showAllButton.textContent = 'Show Filtered Posts';
    }
    isShowingAll = !isShowingAll;
  });

  panel.appendChild(blogrollContent);
  panel.appendChild(showAllContainer);

  return panel;
}

function updatePanelContent(container, groupedPosts) {
  container.innerHTML = ''; // Clear existing content
  
  groupedPosts.forEach(([seriesName, posts]) => {
    const seriesContainer = document.createElement('div');
    seriesContainer.className = 'blogroll-series';

    const seriesTitle = document.createElement('h3');
    seriesTitle.textContent = seriesName;
    seriesContainer.appendChild(seriesTitle);

    const postList = document.createElement('ul');
    posts.forEach(post => {
      const listItem = document.createElement('li');
      listItem.className = 'blogroll-entry'; // Add this line to apply the new class
      
      const postLink = document.createElement('a');
      postLink.href = post.path;
      postLink.textContent = post.title;
      
      const postDate = document.createElement('span');
      postDate.className = 'blogroll-date';
      postDate.textContent = formatDate(post.lastModified);
      
      listItem.appendChild(postLink);
      listItem.appendChild(postDate);

      postList.appendChild(listItem);
    });

    seriesContainer.appendChild(postList);
    container.appendChild(seriesContainer);
  });
}

export default async function decorate(block) {
  console.log('Decorating blogroll block:', block);
  const config = getConfig(block);
  console.log('Blogroll config:', config);
  
  // Add loading state
  block.textContent = 'Loading blog posts...';
  
  try {
    const response = await fetch('/query-index.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    const blogPosts = json.data;
    console.log('Fetched blog posts:', blogPosts);

    const groupedPosts = groupAndSortPosts(blogPosts, config.acceptList);
    console.log('Grouped posts:', groupedPosts);

    // Clear loading message
    block.textContent = '';

    // Only create the full blogroll if it's not compact mode
    if (!config.isCompact) {
      const blogrollContainer = document.createElement('div');
      blogrollContainer.className = 'blogroll-container';

      if (groupedPosts.length === 0) {
        console.log('No posts to display');
        const noPostsMessage = document.createElement('p');
        noPostsMessage.textContent = 'No blog posts found.';
        blogrollContainer.appendChild(noPostsMessage);
      } else {
        groupedPosts.forEach(([seriesName, posts]) => {
          const seriesContainer = document.createElement('div');
          seriesContainer.className = 'blogroll-series';

          const seriesTitle = document.createElement('h2');
          seriesTitle.textContent = seriesName;
          seriesContainer.appendChild(seriesTitle);

          const postList = document.createElement('ul');
          posts.forEach(post => {
            const listItem = document.createElement('li');
            listItem.className = 'blogroll-entry'; // Add this line to apply the new class
            
            const postLink = document.createElement('a');
            postLink.href = post.path;
            postLink.textContent = post.title;
            
            const postDate = document.createElement('span');
            postDate.className = 'blogroll-date';
            postDate.textContent = formatDate(post.lastModified);
            
            listItem.appendChild(postLink);
            listItem.appendChild(postDate);

            const postDescription = document.createElement('p');
            postDescription.textContent = post.longdescription || post.description;
            listItem.appendChild(postDescription);

            postList.appendChild(listItem);
          });

          seriesContainer.appendChild(postList);
          blogrollContainer.appendChild(seriesContainer);
        });
      }

      // Append the blogroll container to the block
      block.appendChild(blogrollContainer);
      console.log('Blogroll content added to block:', blogrollContainer);
    }

    // If compact mode is enabled, add the icon and panel
    if (config.isCompact) {
      console.log('Creating compact blogroll');
      // Create compact blogroll icon container
      const iconContainer = document.createElement('div');
      iconContainer.className = 'blogroll-icon-container';

      // Create compact blogroll icon
      const icon = document.createElement('div');
      icon.className = 'blogroll-icon';
      icon.innerHTML = '📚';
      iconContainer.appendChild(icon);

      // Add "Blogroll" text next to the icon
      const iconText = document.createElement('span');
      iconText.className = 'blogroll-icon-text';
      iconText.textContent = 'Blogroll';
      iconContainer.appendChild(iconText);

      document.body.appendChild(iconContainer);

      // Create compact blogroll panel
      const panel = createCompactBlogrollPanel(groupedPosts, blogPosts, config);
      document.body.appendChild(panel);

      // Function to close the panel
      const closePanel = () => {
        panel.classList.remove('open');
      };

      // Add click event to icon container
      iconContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.add('open');
      });

      // Add click event to document to close panel when clicking outside
      document.addEventListener('click', (e) => {
        if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== iconContainer) {
          closePanel();
        }
      });

      // Prevent clicks inside the panel from closing it
      panel.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Add keydown event listener to close panel on Escape key press
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
          closePanel();
        }
      });
    }
  } catch (error) {
    console.error('Error in blogroll decoration:', error);
    block.textContent = 'Failed to load blog posts. Please try again later.';
  }

  console.log('Blogroll decoration completed');
}
