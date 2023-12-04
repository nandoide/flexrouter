const DEBUG = true;
var NeedsTimingInfo = true;

const buffer = {
    maxFlush: 10,
    b:[],
    add: function(event) {this.b.push(event)},
    flush: function() {
        var i=0;
        while(i<=this.maxFlush && this.b.length>0) {
            let event = this.b.shift();
            Trace(JSON.stringify(event));
            event.send();
            i++;
        }
    }
};

function ProcessMIDI() {
    buffer.flush();
}

function HandleMIDI(event) {
    buffer.add(event);
}
