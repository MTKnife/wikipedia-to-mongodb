let test = require('tape')
var exec = require('shelljs').exec
const MongoClient = require('mongodb').MongoClient
let db = require('./db')
let wp2mongo = require('../')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)
test('test-real-smallwiki', function(t) {
  console.time('test')
  db.drop('smallwiki', () => {
    exec('./bin/wp2mongo.js ./tests/smallwiki-latest-pages-articles.xml.bz2')
    db.count('smallwiki', count => {
      t.equal(count, 1050, 'count-is-correct')
      db.drop('smallwiki', () => {
        console.timeEnd('test')
        t.end()
      })
    })
  })
})
