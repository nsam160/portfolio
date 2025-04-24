console.log('IT’S ALIVE!');

window.addEventListener('DOMContentLoaded', () => {
    if ('colorScheme' in localStorage) {
        select.value = localStorage.colorScheme;
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    }
  });

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");
// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
// );
// if (currentLink) {
//     // or if (currentLink !== undefined)
//     currentLink.classList.add('current');
// }

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.insertAdjacentHTML(
        'afterbegin',
        `
            <label class="color-scheme">
                Theme:
                <select class = 'theme-selector'>
                    <!-- TODO add <option> elements here -->
                    <option value="light dark">Automatic (Dark)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </label>`,
    );
}
else {
    document.body.insertAdjacentHTML(
        'afterbegin',
        `
            <label class="color-scheme">
                Theme:
                <select class = 'theme-selector'>
                    <!-- TODO add <option> elements here -->
                    <option value="light dark">Automatic (Light)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </label>`,
    );
}

let select = document.querySelector('.theme-selector');
select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = event.target.value
});

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    // add the rest of your pages here
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/nsam160', title: 'Profile' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;

    // next step: create link and add it to nav
    const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
        ? "/"                  // Local server
        : "/portfolio/";         // GitHub Pages repo name
    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }
    
    if (a.host !== location.host){
        a.setAttribute('target', '_blank')
    }
}

const form = document.querySelector('.email');

form?.addEventListener('submit', function (event) {
    event.preventDefault(); 

    const data = new FormData(form);
    const params = [];

    for (let [name, value] of data) {
        const encodedValue = encodeURIComponent(value);
        params.push(`${name}=${encodedValue}`);
    }
    const queryString = params.join('&');
    const url = `${form.action}?${queryString}`;

    location.href = url;
});

export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        console.log(response)
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
    // Your code will go here
    if (!(containerElement instanceof HTMLElement)) {
        console.error('Invalid containerElement provided.');
        return;
    }

    const validHeadings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!validHeadings.includes(headingLevel)) {
        console.warn(`Invalid heading level "${headingLevel}", defaulting to h2.`);
        headingLevel = 'h2';
    }

    containerElement.innerHTML = '';

    for (const p of project){
        const article = document.createElement('article');
        const title = p.title || 'Untitled Project';
        const image = p.image || 'https://vis-society.github.io/labs/2/images/empty.svg';
        const description = p.description || 'No description available.';

        article.innerHTML = `
            <${headingLevel}>${title}</${headingLevel}>
            <img src="${image}" alt="${title}">
            <p>${description}</p>
        `;

        containerElement.appendChild(article);
    }
}

export async function fetchGitHubData(username) {
    // return statement here
    return fetchJSON(`https://api.github.com/users/${username}`);
}