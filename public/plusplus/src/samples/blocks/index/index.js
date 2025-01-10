/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
export default function decorate(block) {
  const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const indexBlock = document.querySelector('.index');
  // Create the index header
  const indexHeader = document.createElement('div');
  indexHeader.className = 'index-header';
  indexHeader.innerHTML = `
    <span>Index</span>
    <i class='arrow down'></i>
  `;
  // Create the index content container
  const indexContent = document.createElement('div');
  indexContent.className = 'index-content';
  // Append the index header and content container to the index block
  indexBlock.appendChild(indexHeader);
  indexBlock.appendChild(indexContent);

  let isIndexBuilt = false; // Flag to track if the index has been built

  indexHeader.addEventListener('click', () => {
    if (!isIndexBuilt) {
      buildIndex();
      isIndexBuilt = true; // Set the flag to true after building the index
      indexContent.style.display = 'none';
    }

    if (indexContent.style.display === 'none') {
      indexContent.style.display = 'block';
      indexHeader.querySelector('.arrow').style.transform = 'rotate(-135deg)';
    } else {
      indexContent.style.display = 'none';
      indexHeader.querySelector('.arrow').style.transform = 'rotate(45deg)';
    }
  });

  function buildIndex() {
    const indexContent2 = document.querySelector('.index-content');
    const ul = document.createElement('ul');
    headers.forEach((header, index) => {
      const id = `header-${index}`;
      header.id = id;
      const li = document.createElement('li');
      li.style.marginLeft = `${(parseInt(header.tagName[1], 10) - 1) * 20}px`;
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = header.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    indexContent2.innerHTML = '';
    indexContent2.appendChild(ul);
  }
}
