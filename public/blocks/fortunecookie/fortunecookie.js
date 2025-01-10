
export  default async function decorate(block) {
    const fortuneCookieElement = document.querySelector('.fortunecookie');
    const url = '/data/cookies.json';
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const dataArray = data.data;
        const randomIndex = Math.floor(Math.random() * dataArray.length);
        const randomItem = dataArray[randomIndex];

        const content = `<p><strong>${randomItem.key}:</strong> ${randomItem.value}</p>`;
        fortuneCookieElement.innerHTML = content;
    } catch (error) {
        console.error('Error fetching the JSON data:', error);
    }
}