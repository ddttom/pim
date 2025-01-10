export default function decorate(block) {
  const tagsBlock = document.querySelector('.tags.block');
  let tagsHTML = '';
  if (window.siteConfig && window.siteConfig['$meta:contenttechnology$']) {
    tagsHTML += `<span class='card-tag'>${window.siteConfig['$meta:contenttechnology$']}</span>`;
  }
  if (window.siteConfig && window.siteConfig['$meta:category$']) {
    tagsHTML += `<span class='card-tag alt'>${window.siteConfig['$meta:category$']}</span>`;
  }
  if (tagsHTML) {
    tagsBlock.innerHTML = tagsHTML;
    block.appendChild(tagsBlock);
  }
}
