const DEBUG = true;
let instrument_channel = 1;
let instrument_change_beatpos = 0;
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

function send_cc(cc_number, value, channel) {
    Trace("Send CC with value " + cc_number + " " + value + " " + channel);
    let cc = new ControlChange;
    cc.number = cc_number;
    cc.value = value;
    //cc.channel = channel;
    cc.send();
}

function send_note(pitch, velocity , channel) {
    Trace("Send Note " + pitch + " " + velocity);
    let on = new NoteOn;
    on.pitch = pitch;
    on.velocity = velocity;
    on.channel = channel;
    on.send();
    let off = new NoteOff(on);
    off.sendAfterBeats(1);
}

function HandleMIDI(event) {
    // if(DEBUG) event.trace();
    if (event instanceof ControlChange && event.number == 88) {
        // if(DEBUG) event.trace();
        if (event.value  <= 10  ) {
            console.log("1 Change instrument channel " + (event.value + 1)) ;
            instrument_change_beatpos = event.beatPos;
            instrument_channel = event.value + 1;
            console.log("2 Change instrument channel " + instrument_channel + " at beat " + instrument_change_beatpos);
            send_note(25, 0); //ks for tremolo articulation
        }
    } else if (event instanceof NoteOff) {
        // NoteOff to omni to avoid stuck notes
        for (let i = 1; i <= 16; i++) {
            event.channel = i;
            event.send();
        }
    } else {
        event.channel = instrument_channel;
        event.send();
    }
    //if(DEBUG) Trace('out');
    //if(DEBUG) event.trace();
}
   