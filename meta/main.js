import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let xScale;
let yScale;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
  
    return data;
}

function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/vis-society/lab-7/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };
    
            Object.defineProperty(ret, 'lines', {
                value: lines,
                configurable: true,
                writable: true,
                enumerable: false
            });
    
            return ret;
        });
}

// const scrollContainer2 = d3.select('#scroll-container2');
// const spacer2 = d3.select('#spacer2');
// spacer.style('height', `${totalHeight}px`);
// const itemsContainer2 = d3.select('#items-container2');
// scrollContainer2.on('scroll', () => {
//     const scrollTop = scrollContainer2.property('scrollTop');
//     let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
//     renderItems2(startIndex);
// });
// renderItems2(0);

function renderItems(startIndex) {
    // Clear things off
    itemsContainer.selectAll('div').remove();
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    let newCommitSlice = commits.slice(startIndex, endIndex);
    // TODO: how should we update the scatterplot (hint: it's just one function call)
    updateScatterPlot(data, newCommitSlice);
    // Re-bind the commit data to the container and represent each using a div
    itemsContainer.selectAll('div')
        .data(commits)
        .enter()
        .append('div')
        .style('position', 'absolute')
        .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
        .html((commit, index) => {
                const numFiles = d3.rollups(commit.lines, d => d.length, d => d.file).length;
                return `
                <p class='item'>
                    On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made
                    <a href="${commit.url}" target="_blank">
                    ${index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
                    </a>.
                    I edited ${commit.totalLines} lines across ${numFiles} files. Then I looked over all I had made, and I saw that it was very good.
                </p>
                `;
            });
}

function renderItems2(startIndex) {
    itemsContainer2.selectAll('div').remove();
    let newCommitSlice = commits.slice(0, startIndex + 1);
    displayCommitFiles(newCommitSlice);
    itemsContainer2.selectAll('div')
        .data(commits)
        .enter()
        .append('div')
        .style('position', 'absolute')
        .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
        .html((commit, index) => {
                const numFiles = d3.rollups(commit.lines, d => d.length, d => d.file).length;
                return `
                <p class='item'>
                    On ${commit.datetime.toLocaleString("en", { dateStyle: "full", timeStyle: "short" })}, I made
                    <a href="${commit.url}" target="_blank">
                    ${index > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
                    </a>.
                    I edited ${commit.totalLines} lines across ${numFiles} files. Then I looked over all I had made, and I saw that it was very good.
                </p>
                `;
            });
}

function displayCommitFiles(commitSlice) {
    const lines = commitSlice.flatMap((d) => d.lines);
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
        return { name, lines };
        });
    files = d3.sort(files, (d) => -d.lines.length);
    d3.select('.files').selectAll('div').remove();

    let filesContainer = d3
        .select('.files')
        .selectAll('div')
        .data(files)
        .enter()
        .append('div');
    filesContainer
        .append('dt')
        .html(
        (d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`,
    );
    filesContainer
        .append('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .enter()
        .append('div')
        .attr('class', 'line')
        .style('background', (d) => fileTypeColors(d.type));
}

function renderCommitInfo(data, commits) {
    // Create the dl element
    d3.select('#stats').selectAll('dl').remove();
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('TOTAL <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('TOTAL COMMIT');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    dl.append('dt').text('LONGEST LINE');
    dl.append('dd').text(d3.max(data, d => d.length));

    dl.append('dt').text('NUM FILES');
    dl.append('dd').text(d3.groups(data, d => d.file).length);

    dl.append('dt').text('MAX FILE LENGTH');
    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
    );
    const maxFileLength = d3.max(fileLengths, (d) => d[1]);
    dl.append('dd').text(maxFileLength);

    dl.append('dt').text('TIME WORK');
    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
    );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    dl.append('dd').text(maxPeriod);
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');
  
    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
}

function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const colorScale = d3.scaleLinear()
                         .domain([0, 6, 12, 18, 24])
                         .range(['#00008B', '#FFDC00', '#FFDC00', 'steelblue', '#00008B']); 

    const svg = d3.select('#chart').select('svg');

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const xAxis = d3.axisBottom(xScale);

    // CHANGE: we should clear out the existing xAxis and then create a new one.
    svg.select('g.x-axis')
        .transition()
        .duration(500)
        .call(xAxis);

    const dots = svg.select('g.dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', (d) => colorScale(d.hourFrac))
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });
    
    dots.selectAll('circle')
        .transition()
        .duration(500)
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines));
}

function createBrushSelector(svg) {
    svg.call(d3.brush());
    svg.selectAll('.dots, .overlay ~ *').raise();
    svg.call(d3.brush().on('start brush end', brushed));
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function renderScatterPlot(data, commits) {
    // Put all the JS code of Steps inside this function
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
    const colorScale = d3.scaleLinear()
                         .domain([0, 6, 12, 18, 24])
                         .range(['#00008B', '#FFDC00', '#FFDC00', 'steelblue', '#00008B']); 

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();
    yScale = d3.scaleLinear().domain([0, 24]).range([usableArea.top, usableArea.bottom]);

    const dots = svg.append('g').attr('class', 'dots');
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 60]);
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('fill', (d) => colorScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.top, usableArea.bottom]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis') // new line to mark the g tag
        .call(xAxis);

    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis') // just for consistency
        .call(yAxis);

    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    createBrushSelector(svg);
}

function isCommitSelected(selection, commit) {
    if (!selection) {
        return false;
    }

    const [x0, x1] = selection.map((d) => d[0]); 
    const [y0, y1] = selection.map((d) => d[1]); 
    const x = xScale(commit.datetime); 
    const y = yScale(commit.hourFrac); 
    return x >= x0 && x <= x1 && y >= y0 && y <= y1; 
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);
    
        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
}

function updateFileDisplay(filteredCommits){
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        })
        .sort((a, b) => b.lines.length - a.lines.length);
    let filesContainer = d3
        .select('#files')
        .selectAll('div')
        .data(files, (d) => d.name)
        .join(
            // This code only runs when the div is initially rendered
            (enter) =>
            enter.append('div').call((div) => {
                div.append('dt').append('code');
                div.append('dd');
            }),
        );

    // This code updates the div info
    filesContainer.select('dt > code').html((d) => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
    filesContainer.select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`)
        .style('background', (d) => colors(d.type));
}

let commitProgress = 100;
let data = await loadData();
let commits = processCommits(data).sort((a, b) => d3.ascending(a.datetime, b.datetime));;
let filteredCommits = commits;
let timeScale = d3
    .scaleTime()
    .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
    ])
    .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);
d3.select('#scatter-story')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
        (d, i) => `
            On ${d.datetime.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short',
        })},
            I made <a href="${d.url}" target="_blank">${
        i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
        }</a>.
            I edited ${d.totalLines} lines across ${
        d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
        ).length
        } files.
            Then I looked over all I had made, and I saw that it was very good.
        `,
);
d3.select('#scatter-story-2')
    .selectAll('.step')
    .data(commits)
    .join('div')
    .attr('class', 'step')
    .html(
        (d, i) => `
            On ${d.datetime.toLocaleString('en', {
        dateStyle: 'full',
        timeStyle: 'short',
        })},
            I made <a href="${d.url}" target="_blank">${
        i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
        }</a>.
            I edited ${d.totalLines} lines across ${
        d3.rollups(
            d.lines,
            (D) => D.length,
            (d) => d.file,
        ).length
        } files.
            Then I looked over all I had made, and I saw that it was very good.
        `,
);
function onStepEnter(response) {
    console.log(response.element.__data__.datetime);
    filteredCommits = commits.filter((d) => d.datetime <= response.element.__data__.datetime);
    updateScatterPlot(data, filteredCommits);
}
function onStepEnter2(response) {
    console.log(response.element.__data__.datetime);
    filteredCommits = commits.filter((d) => d.datetime <= response.element.__data__.datetime);
    updateFileDisplay(filteredCommits);
}
const scroller = scrollama();
scroller
    .setup({
        container: '#scrolly-1',
        step: '#scrolly-1 .step',
    })
    .onStepEnter(onStepEnter);

const scroller2 = scrollama();
scroller2
    .setup({
        container: '#scrolly-2',
        step: '#scrolly-2 .step',
    })
    .onStepEnter(onStepEnter2);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
updateFileDisplay(filteredCommits);

// function filterCommitsByTime(){
//     const currentTime = timeScale.invert(+timeSlider.node().value);
//     filteredCommits = commits.filter(d => d.datetime <= currentTime); 
// }

// function renderFileDetail(){
//     let lines = filteredCommits.flatMap((d) => d.lines);
//     let files = [];
//     files = d3
//     .groups(lines, (d) => d.file)
//     .map(([name, lines]) => {
//         return { name, lines };
//     });

//     files = d3.sort(files, (d) => -d.lines.length);
//     d3.select('.files').selectAll('div').remove(); 
//     let filesContainer = d3.select('.files').selectAll('div').data(files).enter().append('div');
//     let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
//     fileTypeColors.domain(['html', 'css', 'js']);

//     const dt = filesContainer.append('dt')
//     dt.append('code').text(d => d.name);
//     dt.append('small').text(d => `${d.lines.length} lines`);
//     filesContainer.append('dd')
//         .selectAll('div')
//         .data(d => d.lines)
//         .enter()
//         .append('div')
//         .attr('class', 'line')
//         .style('background', d => fileTypeColors(d.type));
// }

// function updateTimeDisplay() {
//     commitProgress = +timeSlider.value;
//     const commitMaxTime = timeScale.invert(commitProgress);
//     selectedTime.textContent = commitMaxTime.toLocaleString(undefined, {
//         dateStyle: "long",
//         timeStyle: "short"
//     });

//     filterCommitsByTime();
//     updateScatterPlot(data, filteredCommits);
//     renderCommitInfo(data, filteredCommits);
//     renderFileDetail();
// }



// updateTimeDisplay();
// timeSlider.on('input', function() {
//     commitProgress = +this.value;
//     selectedTime.text(timeScale.invert(commitProgress).toLocaleString(undefined, {
//         dateStyle: "long",
//         timeStyle: "short"
//     }));
//     updateTimeDisplay();
// })