// App
var app = angular.module('app', []);
//
var colors = ["Pink", "Red", "blue", "Yellow", "Green", "Black", "White", "Purple", "Orange", "brown"];

var name = colors[Math.floor(Math.random() * colors.length)] ; //the user name consist of a color and an animal
// Service to fetch some data..
app.factory('dataServ', ['$http',function($http) {
	return {
		get : function() {
			return $http.get('/data');
		}
	}
}]);
app.factory('socketServ', function ($rootScope) { // makes socket.io connections easy
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

// App controller
app.controller('appController', ['$scope','dataServ','socketServ', function($scope, Data, socket) {


    $scope.username =  name + " "+ getAnimal(); //getAnimal returns a random animal

    $scope.output = [];
	$scope.unansweredQuestions = [];

	$scope.sugestions = false;
	$scope.botAnswers = [];

	$scope.questionError = false;
    $scope.questionErrorContent = ""
	Data.get()
		.success(function(resp) {

			$scope.output.push(resp);
		});

	$scope.post = function(question, textType){
		socket.emit("debug", textType);
		if(textType === "ask"){
            if($scope.unansweredQuestions.indexOf($scope.username+ " asks : " + question) >-1){
                $scope.questionError = true;
                $scope.questionErrorContent = "this question has already been asked, still no answers";
                return;
            }
            $scope.questionError = false;
            $scope.sugestions = false;
            $scope.botAnswers = [];
            socket.emit('question', $scope.username+ " asks : " + question);
		}
		if(textType == "talk"){
            socket.emit("talk", $scope.username + " says: " + question);
		}
    }
    $scope.answerQuestion = function(q, a){

        if($scope.unansweredQuestions.indexOf(q) >-1){
            socket.emit('answer', {question : q, answer : a });


		}
    }
    socket.on("talk", function(msg){

       $scope.output.push(msg);
        socket.emit("debug", $scope.output);
    });

    socket.on('question', function(msg){

        $scope.unansweredQuestions.push(msg);
	});
    socket.on('bot_answer', function(msg){
        $scope.sugestions = true;
        $scope.botAnswers = msg;


    });

    socket.on('answer', function(msg){
        var index = $scope.unansweredQuestions.indexOf(msg.question)
		if(index >-1){	//if its in the unanswered question, remove it from there
            $scope.unansweredQuestions.splice(index, 1)

		}
		//it can also be a question that got asked several times and the chat bot answered it
		// without putting it into the unanswered questions.

        $scope.output
            .push("Question: " + msg.question + "\n"  + "Answer: " + msg.answer);

    });
}]);