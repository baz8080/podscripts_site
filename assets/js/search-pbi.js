(function () {
    downloadSearchIndex();
    downloadAndPopulateCorpus();

    async function downloadSearchIndex() {
        const response = await fetch("/search_index.json");
        const search = await response.json();
        window.index = lunr.Index.load(search);
    }

    async function downloadAndPopulateCorpus() {
        const response = await fetch("/corpus.json");
        const corpus = await response.json();
        window.site_contents = [];

        corpus.forEach(element => {
            var doc = {
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
            var contentItem = window.site_contents.filter(contentItem => contentItem.id === result.ref);
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
        const snippets = [];
        
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
        var listItem = document.createElement('li')
        
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

                const section = document.createElement("section");
                sectionLi.appendChild(section)

                const paragraph = document.createElement("p")
                paragraph.textContent = snippet
                section.appendChild(paragraph)
                
                const snippetLink = document.createElement("a")
                snippetLink.href = contentItem.url + "#:~:text=" + encodeURIComponent(snippet)
                
                snippetLink.textContent = "Go to snippet"
                section.appendChild(snippetLink)
                
                sectionLi.appendChild(section)
                sectionUl.appendChild(sectionLi)
                
            }); 
            
            article.appendChild(sectionUl)
        }

        return listItem;
    }

    const form = document.getElementById('search-form');
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Your code to handle the form submission goes here
        // For example, you can access form data using the FormData API:
        const formData = new FormData(form);
        const searchTerm = formData.get("search-query")
        var results = window.index.search(searchTerm)
        renderSearchResults(results)
    });
})();
