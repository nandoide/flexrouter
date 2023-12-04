const DEBUG = true;
const cc_articulation = 70;
let current_articulation = 1;
NeedsTimingInfo = true;

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
        if(DEBUG) console.log(JSON.stringify(event));
    } else if (event instanceof NoteOff) {
        // NoteOff to all possible articulations to avoid stuck notes
        for (let i = 1; i <= 31; i++) {
            event.articulationID = i;
            event.send();
        }
    }
    event.send();
}