var express  = require('express');
var app      = express(); 								
var port  	 = 3000;
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Elasticsearch = require('aws-es');
var answered_questions = []

app.use(express.static(__dirname + '/client')); 		// statics
require('./server/routes.js')(app);						// routes

elasticsearch = new Elasticsearch({
    accessKeyId: 'AKIAJTXBJTY7NKDCGS3Q',
    secretAccessKey: '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',
    service: 'es',
    region: 'us-west-2',
    host: "search-test-w2nudafrgwzftz6ndkh6b7pwyu.us-west-2.es.amazonaws.com"
});

//some functions to make elasticsearch simpler
var insertQuestion_EL = function(index, type, question, answer){

    elasticsearch.index({
        index: index,
        type: type,
        body: {
            question: question,
            answer: answer
        }
    }, function(err, data) {
        console.log('json reply received');
        console.log(data);

    });
}



io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });

    socket.on('debug', function(msg){
       console.log("debug: " + msg);

    });
    socket.on("talk", function(msg){
        console.log("talk: " + msg);
        io.emit("talk", msg);
    });

    //when the server receives a new question
    socket.on('question', function(msg){
       console.log('message: ' +msg);
       var question = msg.substr(msg.indexOf(":") + 1); //the msg has the user name in it, so it needs to be trimmed
       console.log("question is " + question);
        var answerd = answered_questions.find(wrapper => wrapper.question === question); //search for the question in the answered questions pool
        if(answerd){
            console.log("the server has an answer for that question: " +
                answerd.question + " " + answerd.answer);
            io.emit('answer', answerd);
        }else{
            io.emit('question', msg);
            //search  amazon es  for an answer
            elasticsearch.search({
                    index: "q_and_a",
                    type: "posts",
                    body: {
                        "query": {
                            "match" : {
                                "question" :{
                                    "query": question,
                                    "minimum_should_match": "70%"
                                }
                            }
                        },
                        "size": 10
                    }

                },
                function (err, data) {
                    if (data !== undefined) {
                        console.log("search work, data hits are");
                        console.log(data.hits.hits);

                        if(data.hits.hits.length !== 0){
                            console.log("sending bot answer" );
                            console.log(data.hits.hits[0]._source.answer);
                            var possibleAnswers = data.hits.hits.map(x =>  x._source);
                            io.emit('bot_answer', possibleAnswers);
                        }


                    }



                });

        }
    });
    //when a user submits an answer
    socket.on('answer', function(msg){
        var question =  msg.question.substr(msg.question.indexOf(":") + 1);
        console.log('answer: ' +msg.question +" " +msg.answer);
        answered_questions.push({question : question, answer: msg.answer});
        insertQuestion_EL("q_and_a", "posts", question, msg.answer);
        io.emit('answer', msg);
    });
});
http.listen(3000, function(){ // let the games begin!
    console.log('listening on *:3000');
});

