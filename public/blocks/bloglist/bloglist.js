export default async function decorate(block) {
  const blogListElement = document.querySelector(".bloglist");
  const url = "/query-index.json";
  const currentPath = window.location.pathname; // Get the current document's path

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Filter the blog items based on the presence of "/blogs/ddt/a-developer" in the path
    // and exclude the current document
    const filteredBlogItems = data.data.filter((item) =>
      item.path.includes("developer-guide") && item.path !== currentPath
    );

    // Sort the filtered blog items by title
    const sortedBlogItems = filteredBlogItems.sort((a, b) =>
      a.title.localeCompare(b.title)
    );

    
    const limitedBlogItems = sortedBlogItems.slice(0, 4);

    // generate the content
    const content = generateContent(sortedBlogItems);

    blogListElement.innerHTML = content;
  } catch (error) {
    console.error("Error fetching the JSON data:", error);
  }
}
function generateContent(blogItems) {
  let content = "";

  blogItems.forEach((item) => {
    const lastModifiedDate = new Date(item.lastModified * 1000);
    const formattedDate = formatDate(lastModifiedDate);

    content += `
            <div class="blog-item">
                <a href="${item.path}">      
                    <img src="${item.image}" alt="${item.title}">
                    <strong>${item.title}</strong>
                </a>
                <p>${item.description}</p>
                <p class="last-modified">Last Modified: ${formattedDate}</p>
            </div>
        `;
  });

  return content;
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function getMonthName(monthIndex) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return monthNames[monthIndex];
}
