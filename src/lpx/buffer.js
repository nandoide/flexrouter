const DEBUG = true;
var NeedsTimingInfo = true;

const buffer = {
    maxFlush: 20,
    b:[],
    add: function(event) {this.b.push(event)},
    flush: function() {
        let i=0;
        let active_notes = [];
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
    if (event instanceof NoteOn) {
        buffer.push(event);
    } else if (event instanceof NoteOff) {
        for (i = 0; i < buffer.length; i++) {
            if (buffer[i].pitch == event.pitch) {
                buffer.splice(i, 1);
                break;
            }
        }
    } else {
        event.send();
    }
}
