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
    { url: 'index.html', title: 'Home' },
    { url: 'projects/index.html', title: 'Projects' },
    // add the rest of your pages here
    { url: 'contact/index.html', title: 'Contact' },
    { url: 'resume/index.html', title: 'Resume' },
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
        : "/website/";         // GitHub Pages repo name
    if (!url.startsWith('http')) {
        url = BASE_PATH + url;
    }
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
        console.log('Hi!');
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