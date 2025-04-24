import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.latest-projects');
renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('nsam160');
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
        <dl>
            <dt>FOLLOWERS:</dt><dd>${githubData.followers}</dd>
            <dt>FOLLOWING:</dt><dd>${githubData.following}</dd>
            <dt>PUBLIC REPOS:</dt><dd>${githubData.public_repos}</dd>
            <dt>PUBLIC GISTS:</dt><dd>${githubData.public_gists}</dd>
        </dl>
    `;
}