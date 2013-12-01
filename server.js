//---------------------------
//--------SUPER CHAT---------
//---------------------------

//REQUIRES
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app).listen(8080);
var io = require('socket.io').listen(server);
var crypto = require('crypto');
var cron = require('cron').CronJob

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
		conv = {"conversation": data['convName'] };
		db.test.insert(conv);
		socket.emit('conv', conv);
	});
		
   	/* 
   	* SET CONV
   	*/
	socket.on('setConv', function(data){
		socket.set('conversation', data['conversation']);
		db.test.findOne({conversation: data['conversation']},{}, {limit: 10}, function(err, messages){
		
		
			io.sockets.socket(socket.id).emit('message', {'message': 'Starting conversation '+data['conversation']+' !', 'pseudo': 'Super Chat',  'conv':data['conversation']});
		
			if(messages.messages != undefined){
				msgs = messages.messages;
				
				for(i = 0; i < msgs.length; i++){
					//console.log('sending message from previous conversation: '+ msgs[i]['message']);
					message = {
						'message': msgs[i]['message'], 
						'pseudo': msgs[i]['pseudo'],
						'conv': data['conversation']
				 	};
					io.sockets.socket(socket.id).emit('message', message);
				}			
				
			}		
			
			db.test.update({ "conversation": data['conversation']}, {
					"$push" : {
						active_user : {
							user : data['user'],
							last_active_date : new Date() 
						}
					}
				},
				{ upsert : true});
				
				
				
			
			db.test.findOne({conversation: data['conversation']}, function(err, conv){
				//Used to removed repeated users, the db.test.distinct was not working for some reason.. :(
				usersArray = [];
				activeUsers = conv.active_user;				
				for(i = 0; i < activeUsers.length; i++){
					user = activeUsers[i].user;					
					var exists = false;
					for(j = 0; j < usersArray.length; j++)
						if(user === usersArray[j])
							exists = true;										
					if(!exists)
						usersArray.push(user);					
				}
				
				io.sockets.socket(socket.id).emit('active_users', usersArray);		
				
			});
			
					
			
				

				
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
				
				db.test.update({ "conversation": conv}, {
					"$push" : {
						active_user : {
							user : message['pseudo'],
							last_active_date : new Date() 
						}
					}
				},
				{ upsert : true});
				
			});
			
	   })
	});
	
	/*
	 * AUTH USER
	 */
	socket.on('auth-user', function(data){
		db.user.find({"username": data['username'] , "password": data['password']}, {"username": 1}, function(err, users){
			auth = false;
			if(users.length === 1)
				auth = true;
			socket.set('pseudo', data['username']);
			
			//socket.get('pseudo', function (error, name) {
			//	console.log(name);
			//});
						
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


	socket.on('active-users', function(conversation){
		db.test.findOne({conversation: conversation}, function(err, conv){
				//Used to removed repeated users, the db.test.distinct was not working for some reason.. :(
				usersArray = [];
				activeUsers = conv.active_user;				
				for(i = 0; i < activeUsers.length; i++){
					user = activeUsers[i].user;					
					var exists = false;
					for(j = 0; j < usersArray.length; j++)
						if(user === usersArray[j])
							exists = true;										
					if(!exists)
						usersArray.push(user);					
				}
				
				io.sockets.socket(socket.id).emit('active_users', usersArray);		
				
			});
	});
	
	socket.on('keep-user-alive', function(data){
		db.test.update({ "conversation": data['conv']}, {
			"$push" : {
				active_user : {
					user : data['username'],
					last_active_date : new Date() 
				}
			}
		},
		{ upsert : true});
	});


	
});// io sockets connection


/**
* CRON JOB
**/


new cron('* * * * * * ', function(){
	
	
	db.test.find({}, function(err, convs){
		
		for(i = 0; i < convs.length; i++){
			conv_to_check = convs[i].conversation;
			conv_users = convs[i].active_user;
			if(conv_users != undefined)
				for(j = 0; j < conv_users.length; j++){
					user_to_check = conv_users[j].user;
					
					curDate = new Date();
					cur = (curDate.getHours()*60);
					cur += curDate.getMinutes();
					
					users_active_date = conv_users[j].last_active_date;
					active = (users_active_date.getHours()*60);
					active += users_active_date.getMinutes();										
					
					if((cur - active) >= 1){
						db.test.update( { conversation: conv_to_check, active_user: {$elemMatch: { user: user_to_check}} }, { $pull :{ active_user: {user: user_to_check} } }, {multi: true});
						
						
						//console.log("User "+user_to_check+" eliminated for inactivity!")
					}
				}
			
		}
		
		
	});
	
}, null, true, 'America/Los_Angeles');


