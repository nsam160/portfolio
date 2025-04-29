import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const titleElement = document.querySelector('.projects-title');
titleElement.textContent = `${projects.length} Projects`;

function renderPieChart(projectsGiven) {
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let newData = newRolledData.map(([year, count]) => {
        return { 
            value: count, 
            label: year 
        };
    });

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));
    let colors = d3.scaleOrdinal(d3.schemePurples[3]);

    let selectedIndex = -1;
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();

    let newLegend = d3.select('.legend');
    newLegend.selectAll('li').remove();

    newArcs.forEach((arc, idx) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .on('click', () => {
                selectedIndex = selectedIndex === idx ? -1 : idx;

                newSVG
                    .selectAll('path')
                    .attr('class', (_, idx) => selectedIndex === idx ? 'selected' : null);

                newLegend
                    .selectAll('li')
                    .attr('class', (_, idx) => selectedIndex === idx ? 'legend-item-selected' : 'legend-item');

                if (selectedIndex === -1) {
                    renderProjects(projectsGiven, projectsContainer, 'h2');
                } 
                else {
                    console.log(newData[selectedIndex].label);
                    let filteredProjects = projectsGiven.filter((project) => {
                        return project.year === newData[selectedIndex].label;
                    });
                    renderProjects(filteredProjects, projectsContainer, 'h2');
                }
            });
    });

    newData.forEach((d, idx) => {
        newLegend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', selectedIndex === idx ? 'legend-item-selected' : 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); 
    });
}

renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    // update query value
    query = event.target.value;
    // filter projects
    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
    // render filtered projects
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});