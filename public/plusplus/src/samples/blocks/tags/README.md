# Tags javascript

The decorate function is designed to dynamically add metadata tags to a specified HTML block on a web page. It operates by querying the document for a specific block element (.tags.block) and checking for metadata in the global site configuration object (window.siteConfig). Specifically, it looks for content technology and category metadata.

If the metadata exists, the function generates HTML span elements for each metadata tag. For example, if the content \$meta:contenttechnology\$ is present, it creates a span like `<span class='card-tag'>"\$meta:contenttechnology\$ value"</span>`. Similarly, it generates a span for the category metadata with an additional class alt like `<span class='card-tag alt'>category value</span>`.

Here’s a brief illustration of how the tags are created:

```js
let tagsHTML = '';
if (window.siteConfig && window.siteConfig['$meta:contenttechnology$']) {
  tagsHTML += `<span class='card-tag'>${window.siteConfig['$meta:contenttechnology$']}</span>`;
}
if (window.siteConfig && window.siteConfig['$meta:category$']) {
  tagsHTML += `<span class='card-tag alt'>${window.siteConfig['$meta:category$']}</span>`;
}
```

Once the tags are generated, the function sets the inner HTML of the tags block to this generated content and appends the tags block to the specified HTML block element:

```js
tagsBlock.innerHTML = tagsHTML;
block.appendChild(tagsBlock);
```

In summary, the decorate function enhances the web page by programmatically adding relevant metadata tags, making the content more informative and categorized.
