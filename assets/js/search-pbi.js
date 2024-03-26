(function () {
    
    async function downloadIndexAndCorpus() {
        var response = await fetch("/search_index.json");
        const search = await response.json();
        window.index = lunr.Index.load(search);

        response = await fetch("/corpus.json");
        const corpus = await response.json();
        window.site_contents = [];

        corpus.forEach(element => {
            const doc = {
                'id': element.id,
                'content': element.content,
                'name': element.name,
                'category': element.category,
                'url': element.url,

            };
            window.site_contents.push(doc);
        });
    }

    function renderSearchResults(results) {

        const resultsArea = document.getElementById("search-results");
        resultsArea.innerHTML = "";

        if (!results || !results.length) {
            resultsArea.innerHTML = "<li>No results found.</li>"
            return;
        }

        results.forEach(result => {
            const contentItem = window.site_contents.filter(contentItem => contentItem.id === result.ref);
            var snippets = []

            Object.keys(result.matchData.metadata).forEach(function (term) {
                Object.keys(result.matchData.metadata[term]).forEach(function (fieldName) {
                    const positionArray = result.matchData.metadata[term][fieldName]["position"]
                    snippets = generateSnippets(contentItem[0].content, positionArray, 160);
                });
            });

            const resultElement = buildSearchResult(contentItem[0], snippets);
            resultsArea.append(resultElement);
        });
    }

    function generateSnippets(content, positions, maxSnippetLength) {
        var snippets = [];
        
        for (const [position, termLength] of positions) {
            
            let start = Math.max(0, position - (maxSnippetLength / 2));
            let end = Math.min(content.length - 1, position + termLength + (maxSnippetLength / 2));
            
            // Expand left
            while (start > 0 && content[start] != '\n') {
                start--;
            }

            if (content[start] == '\n') {
                start++;
            }

            // Expand right
            while (end < content.length - 1 && content[end] != '\n') {
                end++;
            }

            const lastSnippet = snippets[snippets.length - 1];

            if (lastSnippet && start - lastSnippet.end <= maxSnippetLength / 2) {
                lastSnippet.end = end;
            } else {
                snippets.push({ start, end });
            }
        }
        
        return snippets.map(({ start, end }) => content.substring(start, end));;
    }
        
    function buildSearchResult(contentItem, snippets = []) {
        const listItem = document.createElement('li')
        
        const a = document.createElement('a')        
        a.href = contentItem.url;
        a.textContent = contentItem.name;

        const article = document.createElement('article')
        listItem.appendChild(article);

        const header = document.createElement('header')
        article.appendChild(header);
        
        header.appendChild(a);

        if (snippets) {
            
            const sectionUl = document.createElement("ul")
            
            snippets.forEach(snippet => {
                const sectionLi = document.createElement("li")
                sectionUl.appendChild(sectionLi)

                const section = document.createElement("section");
                sectionLi.appendChild(section)

                const paragraph = document.createElement("p")
                section.appendChild(paragraph)

                const snippetLink = document.createElement("a")
                snippetLink.href = contentItem.url + "#:~:text=" + encodeURIComponent(snippet)
                snippetLink.textContent = "Go to snippet"
                paragraph.appendChild(snippetLink)

                const snippetSpan = document.createElement("span")
                snippetSpan.textContent = "\u00A0" + snippet
                paragraph.appendChild(snippetSpan)
            }); 
            
            article.appendChild(sectionUl)
        }

        return listItem;
    }

    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const searchTerm = formData.get("search-query")
        
        const results = window.index.search(searchTerm)
        renderSearchResults(results)
    });

    window.addEventListener('load', async function(event) {

        await downloadIndexAndCorpus()

        const formData = new FormData(document.getElementById('search-form'));
        const searchTerm = formData.get("search-query")

        if (searchTerm) {
            const results = window.index.search("ireland")
            renderSearchResults(results)
        }
    });
})();
