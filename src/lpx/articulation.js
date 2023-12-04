const DEBUG = true;
const cc_articulation = 70;
let current_articulation = 1;
let activeNotes = [];
var NeedsTimingInfo = true;

const console = {
    maxFlush: 20,
    b:[],
    log: function(msg) {this.b.push(msg)},
    flush: function() {
        var i=0;
        while(i<=this.maxFlush && this.b.length>0) {
            Trace(this.b.shift());
            i++;
        }
    }
};

function Idle() {
    console.flush();
}

function HandleMIDI(event) {
    if (event instanceof ControlChange && event.number == cc_articulation && event.value != 64)  {
        current_articulation = event.value;
        if(DEBUG) console.log("Articulation " + current_articulation);
    } else if (event instanceof NoteOn) {
        event.articulationID = current_articulation;
        activeNotes.push(event);
        if(DEBUG) console.log(JSON.stringify(event));
    } else if (event instanceof NoteOff) {
        for (i = 0; i < activeNotes.length; i++) {
            // if there is an active note on the same pitch and distinct articulation, I need to send a note off with the stored channel and articulation
            if (activeNotes[i].pitch == event.pitch) {
                if (event.channel != activeNotes[i].channel) {
                    event.channel = activeNotes[i].channel;
                }
                activeNotes.splice(i, 1);
                break;
            }
        }
    }
    event.send();
}