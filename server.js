//---------------------------
//--------SUPER CHAT---------
//---------------------------

//REQUIRES
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app).listen(3000);
var io = require('socket.io').listen(server);
var crypto = require('crypto');

//JADE
//var jade = require('jade');
var ejs = require('ejs');

//MONGO
var databaseUrl = 'test';
var collections = ['test', 'user'];
var db = require('mongojs').connect(databaseUrl, collections);

//CRYTPO
var md5sum = crypto.createHash('md5');

//EXPRESS
app.set('views', __dirname + '/views');


app.set('view engine', 'ejs');
// app.engine('.html', require('ejs').renderFile());
//app.set('view engine', 'jade');
//app.set("view options", { layout: false });
app.use("/styles", express.static(__dirname + '/styles'));
app.configure(function() {
   app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
  res.render('home.ejs');
});

//SOCKET IO
io.sockets.on('connection', function (socket) {
   	
   	/* 
   	* SET PSEUDO
   	*/
   	socket.on('setPseudo', function (data) {
	   socket.set('pseudo', data);
	});
		
		
	/*
	* ADD CONV
	*/
	socket.on('addConv', function(data){
		console.log(data);
		conv = {"conversation": data['convName'] };
		db.test.insert(conv);
		socket.emit('conv', conv);
	});
		
   	/* 
   	* SET CONV
   	*/
	socket.on('setConv', function(data){
		socket.set('conversation', data);
		db.test.find({conversation: data},{}, {limit: 10}, function(err, messages){
			if(messages[0].messages != undefined){
				msgs = messages[0].messages;
				
				io.sockets.socket(socket.id).emit('message', {'message': 'Starting conversation '+data+' !', 'pseudo': 'Super Chat',  'conv':data});
				
				for(i = 0; i < msgs.length; i++){
					console.log('sending message from previous conversation: '+ msgs[i]['message']);
					message = {
						'message': msgs[i]['message'], 
						'pseudo': msgs[i]['pseudo'],
						'conv': data
				 	};
					io.sockets.socket(socket.id).emit('message', message);
				}
			}			
		});
	});
	
  	/* 
   	* SET ON GET CONVS
   	*/
	socket.on('getConvs', function(){
		db.test.find({}, {conversation: 1}, function(err, convs){
			for(i = 0; i < convs.length; i++){
				conv = { conversation: convs[i].conversation };		
				io.sockets.socket(socket.id).emit('conv', conv);
			}//for
		});
	});

   	/* 
   	* SET ON MESSAGE
   	*/
	socket.on('message', function (message) {
	   socket.get('pseudo', function (error, name) {
			socket.get('conversation', function(converror, conv){	
				var data = {message: message['message'], pseudo: message['pseudo'], conv: conv};
				socket.broadcast.emit('message', data);
				db.test.update(
					{
						conversation: conv
					},
					{ 
						$push:{
							messages: {
								message: message['message'],
								pseudo: message['pseudo'],
								current_date: new Date()
							}
						}
					},
					{upsert: true}
				);
			});
			
	   })
	});
	
	/*
	 * AUTH USER
	 */
	socket.on('auth-user', function(data){
		console.log(data);
		db.user.find({"username": data['username'] , "password": data['password']}, {"username": 1}, function(err, users){
			auth = false;
			if(users.length === 1)
				auth = true;
			socket.set('pseudo', data['username']);
			
			socket.get('pseudo', function (error, name) {
				console.log(name);
			});
			
			
			io.sockets.socket(socket.id).emit('auth-login', auth);
		});
		
	});

	
	
	/*
 	* REGISTER
	*/
	socket.on('register', function(user){
		db.user.find({'username' : user['username']}, function(err,users){
				if(users.length > 0){
					io.sockets.socket(socket.id).emit('register-success', false);	
				}else{
					db.user.insert(user);
					io.sockets.socket(socket.id).emit('register-success', {'username' : user['username']});		
					
				}				
			});
	});
	
});// io sockets connection
