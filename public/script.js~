var socket = io.connect("http://localhost:8080"); //Cambiar para que todos los puedan usar.
var conversation = "";
var pseudo = "";

$(function() {

	socket.emit('getConvs');

	socket.on('conv', function(conv){	
		addConversation(conv);	
	});
	
	socket.on('auth-login', function(auth){
		if(auth){
			$('.user-login-reg').hide();
			$('.chat').show();
			
			setFlash('Welcome to the Super chat! :)');
			
		    var pseudo = auth['username'];
			socket.emit('setPseudo', pseudo);
		
		}else{
			setFlash("Incorrect username or password!");
		}
	});

	socket.on('message', function(data) {

		if(data['conv'] === conversation){
			if( pseudo !== ""){							
				if(data['pseudo'] == pseudo) // En caso de que el mensaje hay sido enviado por la misma persona.
					data['pseudo'] = "Me";
			   addMessage(data['message'], data['pseudo']);				   
			}else{
				setFlash("You must login first! ");
			}
	   }
	});
	
	
	socket.on('register-success', function(data){
		if(data === false)
			setFlash("That username is already taken");
		else
			setFlash("The user "+data['username']+" was successfully added into the database");
	});
	
	
	/******************ACTIVE USERS*******************/
	
	socket.on('active_users', function(activeUsers){
		displayActiveUsers(activeUsers)
	});
	
	setInterval(function(){	
		if(conversation != "")	
			socket.emit('active-users', conversation);
	}, 3000);
	
	setInterval(function(){
		if(pseudo !== "" && conversation != "")
			socket.emit('keep-user-alive', {username: pseudo, conv: conversation});
	
	}, 5000);
	
	
	/******************STYLE*******************/
	
	$('.chat').hide(); //All the chat controls and stuff. 
	$('.flash').hide(); // Flash Message Space	
	
	$("#convSet").click(function(){ setConv();});
	$("#messageInput").keypress(function(e) {
		if(e.which == 13){
			if(conversation != ""){
				sentMessage();
			}else{
				setFlash("Please select a conversation! :)");
			}
		}		
	});
	$("#login-submit").click(function() {loginUser();});
	$("#register-submit").click(function() {register();});
	$(".addConv").click(function() {showAddConvForm();});
	$(".addConv-submit").click(function(){ addConversationDB(); return false; });
	
	$('.flash').bind('DOMNodeInserted DOMNodeRemoved', function(event) {
		$('.flash').fadeIn();
		setTimeout(function(){
			$('.flash').slideUp('slow');
		}, 10000);
	});
			

});

/******************LOGIN*******************/

function loginUser(){
	username = $('#login-username').val();
	password = $('#login-password').val();
	if(typeof username === undefined && typeof password === undefined){
		console.log("Error: loginUser: Parameters are empty.");
		return false;
	}
	
	if(username.length === 0 && password.length === 0){
		console.log("Error: loginUser: Parameters are empty.");
		return false;
	}
	
	$("#login-loader").removeClass('hidden');
	
	socket.emit('auth-user', {"username": username, "password": password});
	
	$("#login-submit").prop('disabled', true); // no funciona
	
	pseudo = username;
	
	return false; //To prevent the postback.
}

/******************REGISTER*******************/

function register(){
	username = $("#register-username").val();
	password = $('#register-password').val();
	passwordrepeat = $('#register-password-repeat').val();
	
	if(username == '' || password == '' || passwordrepeat == ''){
		setFlash("Please fill all fields");
		return false;
	}
	
	if(password !== passwordrepeat){
		setFlash("Passwords must match");
		return false;
	}

	user = { 'username' : username, 'password': password};
	
	socket.emit('register', user);

}


/******************FLASH*******************/

function setFlash(message){
	if(message.length === 0)
		return false;
	$('.flash').empty().append("<div class='alert alert-info'>"+message+"</div>");
}

/******************CONVERSATION*******************/

function showAddConvForm(){
	$('.convAdd').slideToggle('slow');
}

function addConversationDB(){
	convName = $('.addConv-name').val();
	if(typeof convName === undefined ){
		return false;
	}
	if(convName === "")
		return false;
		
	socket.emit('addConv', {"convName": convName});
	
	setFlash("Conversation Added! :) ");
}

function addConversation(conv){
	if(conv.length === 0)
		return false;
	$("#chatConvs").append('<div> <a href="#" onclick="setConv('+"'"+conv['conversation']+"'"+')" >'+conv['conversation']+'</a></div>');
}

function addMessage(msg, pseudo) {
	if(pseudo === 'Super Chat'){
		$("#chatEntries").append('<div class="message"><p><b>' + pseudo + ' : ' + msg + '</b></p></div>');	
	}else{
		$("#chatEntries").append('<div class="message"><p>' + pseudo + ' : ' + msg + '</p></div>');
	}
	
	$("#chatEntries").scrollTop($("#chatEntries").scrollTop()+50);
	
}

function sentMessage() {
   if ($('#messageInput').val() != "") 
   {
      socket.emit('message', {'message' : $('#messageInput').val(), 'pseudo' : pseudo });
      addMessage($('#messageInput').val(), "Me", new Date().toISOString(), true);
      $('#messageInput').val('');
   }
}

function setConv(convId){
	console.log("Setting conversation");
	if(convId != "")
	{
		$("#chatEntries").empty();
		socket.emit('setConv', { conversation: convId, user: pseudo});	
		conversation = convId;
		setFlash("Conversation started!");
	}else{
		console.log("ERROR: setConv: Parametro invalido. No se recibio ningun dato.");
	}
}

/******************PSEUDO*******************/

function setPseudo(pseudo) {
   if (pseudo != "")
   {
      socket.emit('setPseudo', pseudo);
      active_pseudo = pseudo;
   }else{
   		console.log("ERROR: setPsudo: No se recibio ningun parametro.");	
   }
}

/******************ACTIVE USERS*******************/

function displayActiveUsers(users){
	if(users === undefined)
		return "";
	list = "";	
	for(i = 0; i < users.length; i++){
		list += "<p><a href='#'>"+users[i]+"</a></p>"
	}
	
	$('.activeUsers').empty().append(list);	
}


