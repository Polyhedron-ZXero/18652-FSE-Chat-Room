// Client Socket.IO initialization
var socket = io.connect();

// Message block styles
var myMessageBlock = '<div style="background-color:#32c5ff; margin:10px; padding-left:10px; padding-right:10px; padding-top:6px; padding-bottom:8px; word-wrap:break-word; white-space: pre-wrap"></div>';
var otherMessageBlock = '<div style="background-color:#ffffff; margin:10px; padding-left:10px; padding-right:10px; padding-top:6px; padding-bottom:8px; word-wrap:break-word; white-space: pre-wrap"></div>';

$(document).ready(function () {
    var chatApp = new Chat(socket);
    $('#send-message').val('');
    socket.emit('assignNickname', window.nickname);

    // Load messages from database
    socket.on('loadMessage', function (rows) {
        for (i in rows) {
            var messageBlock = $(otherMessageBlock).html(rows[i].message);
            $('#messages').append(messageBlock);
        }
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    // Listen to nickname result, return to previous page if name in use
    socket.on('nameResult', function (result) {
        var message;
        if (result.success) {
            $('#nickname').text(result.name);
        }
        else {
            alert(result.error);
            window.location.href = "index.html";
        }
    });

    // Listen to room join
    socket.on('joinResult', function (result) {
        $('#room').text(result.room);
    });

    // Listen to user messages and display them
    socket.on('message', function (message) {
        var messageBlock;
        if (!message.nickname) {
            // System message
            messageBlock = divSystemContentElement(message.text);
        }
        else {
            // User message
            messageBlock = $(otherMessageBlock).html(formatMessage(message));
        }
        $('#messages').append(messageBlock);
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    });

    $('#send-message').focus();

    // Click button to send a message
    $('#send-form').submit(function () {
        processUserInput(chatApp, socket);
        $('#send-message').focus();
        return false;
    });
    // Press Ctrl+Enter to send a message
    $('#send-message').keydown(function (e) {
        if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
            processUserInput(chatApp, socket);
            return false;
        }
    });
});

// Use pure text to display every character, for untrusted strings (user message)
function divEscapedContentElement(message) {
    return $('<div></div>').text(message);
}

// For trusted strings (system message)
function divSystemContentElement(message) {
    return $('<div style="font-size:12px; text-align:center"></div>').html(message);
}

// Inputted message by current user
function processUserInput(chatApp, socket) {
    if ($('#send-message').val() != '') {
        // Send message
        var message = {};
        message.nickname = window.nickname;
        message.time = chatApp.timestamp();
        message.text = $('#send-message').val();
        message.myself = true;
        chatApp.sendMessage($('#room').text(), message.text, message.time);

        // Display my message
        $('#messages').append($(myMessageBlock).html(formatMessage(message)));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
        $('#send-message').val('');

        // Save message
        message.myself = false;
        socket.emit('saveMessage', formatMessage(message));
    }
}

// Return a formatted message string with HTML
function formatMessage(message) {
    var text = '';
    text += message.myself ? '<div style="float:left; color:white"><strong>' : '<div style="float:left"><strong>';
    text += message.nickname;
    text += '</strong></div>';
    text += '<div style="float:right; color:#999999">';
    text += message.time;
    text += '</div>';
    text += '<div style="clear:both; font-size:6px"> </div>';
    text += message.myself ? '<div style="color:white">' : '<div>';
    text += message.text;
    text += '</div>';
    return text;
}