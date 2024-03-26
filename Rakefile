require 'rake'
require 'json'
require 'front_matter_parser'
require 'open3'
require "fileutils"

file './corpus.json' => [*Rake::FileList['_posts/**/*.md']] do |md_file|
    unsafe_loader = ->(string) { YAML.load(string) } 
    corpus = md_file.sources.grep(/\.md$/)
    .map do |path|
        file_path = './' + path
        
        parsed = FrontMatterParser::Parser.parse_file(file_path, loader: unsafe_loader)
        {
            id: path.pathmap('%n'),
            name: parsed['title'],
            category: parsed['category'] || "",
            title: parsed["title"],
            url: parsed['url'],
            content: parsed.content,
        }
    end

    File.open(md_file.name, 'w') do |f|
        f << JSON.generate(corpus)
    end
end

file './search_index.json' => ['./corpus.json'] do |t|
    Open3.popen2('script/build-index.js') do |stdin, stdout, wt|
    IO.copy_stream(t.source, stdin)
    stdin.close
    IO.copy_stream(stdout, t.name)
    end
end

task :clean do
    FileUtils.rm './corpus.json', :force => true
    FileUtils.rm './search_index.json', :force => true
end

task :default  => [:clean, './corpus.json', './search_index.json']