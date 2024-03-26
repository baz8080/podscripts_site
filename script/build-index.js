#!/usr/bin/env node

var lunr = require('lunr'),
    stdin = process.stdin,
    stdout = process.stdout,
    buffer = []

stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', function (data) {
    buffer.push(data)
})

stdin.on('end', function () {
    var corpus = JSON.parse(buffer.join(''))

    var idx = lunr((builder) => {
        builder.ref('id')
        builder.field('name')
        builder.field('url')
        builder.field('content')
        builder.field['category']
        builder.metadataWhitelist = ['position']

        corpus.forEach(function (doc) {
            builder.add(doc)
        }, builder)
    })

    stdout.write(JSON.stringify(idx))
})