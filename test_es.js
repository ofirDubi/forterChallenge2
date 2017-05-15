var Elasticsearch = require('aws-es');
elasticsearch = new Elasticsearch({
    accessKeyId: 'AKIAJTXBJTY7NKDCGS3Q',
    secretAccessKey: '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',
    service: 'es',
    region: 'us-west-2',
    host: "search-test-w2nudafrgwzftz6ndkh6b7pwyu.us-west-2.es.amazonaws.com"
});


elasticsearch.search({
    index: 'q_and_a',
    type: 'posts',
    body: {
        "query": {
            "match" : {
                "question" :{
                    "query": " how do i play sports",
                    "minimum_should_match": "70%"
                }
            }
        }
    }
}, function(err, data) {

    console.log('json reply received');
   // console.log(data)
    if(data != undefined) console.log(data.hits.hits);
});