let mongo = require('mongodb').MongoClient;
let client = require('socket.io').listen(4000).sockets;

//Connect to MongoDB
mongo.connect('mongodb://127.0.0.1/mongochat', (err, db) =>{
	if(err){
		throw err;
	}

	console.log('MongoDB Connected');

	//Connect to socket.io
	client.on('connection', (socket)=>{
		let chat = db.collection('chats');

		//Create function to send status to the server
		sendStatus = function(s){
			socket.emit('status', s);
		};

		//Get Chats from Mongo Collection
		chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
			if(err){
				throw err;
			}

			//Emit the messages
			socket.emit('output', res);
		});
		//Handle input events
		socket.on('input', (data)=>{
			let name = data.name;
			let message = data.message;

			//Check for name and message
			if(name == '' || message == ''){
				//Send Error message
				sendStatus('Please Enter a name and message');
			} else{
				//Insert message into db
				chat.insert({name: name, message: message}, function(){
						client.emit('output', [data]);

						//Send status object
						sendStatus({
							message: 'Message sent',
							clear: true
						});
					});
			}
		});
		//Handle clearing of chat
		socket.on('clear', (data)=>{
			chat.remove({}, ()=>{
				//Emit event
				socket.emit('cleared');
			});
		});
	});
});
