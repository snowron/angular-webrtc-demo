const io = require('socket.io')()
const cors = require('cors')
const express = require('express')
const app = express()
app.use(cors());

app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
var users = {}
io.on('connection', function (socket) {
	users[socket.handshake.query.who] = socket
	socket.on('callSomeone', function (message) {
		users[message.toUser].emit("answerSomeone", message)
	});
	socket.on('answerSomeone', function (message) {
		users[message.toUser].emit("answerSomeone", message)
	});
	socket.on('ice', function (message) {
		users[message.toUser].emit("ice", message)
	});
});
io.origins('*:*')

var qq = app.listen(3002, () => {
	console.log("server starting on port : ")
});

io.listen(qq)
