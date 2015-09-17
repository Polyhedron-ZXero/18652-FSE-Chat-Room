var Chat = function (socket) {
    this.socket = socket;
};

Chat.prototype.sendMessage = function (room, text, time) {
    var message = {
        room: room,
        time: time,
        text: text
    };
    this.socket.emit('message', message);
};

// Return a timestamp with the format "mm/dd/yy h:mm:ss tt"
Chat.prototype.timestamp = function () {
    var now = new Date();
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    // Convert to 12-hour format
    var suffix = time[0] < 12 ? "AM" : "PM";
    time[0] = time[0] < 12 ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    time[1] = time[1] < 10 ? "0" + time[1] : time[1];
    time[2] = time[2] < 10 ? "0" + time[2] : time[2];

    return date.join("/") + " " + time.join(":") + " " + suffix;
}