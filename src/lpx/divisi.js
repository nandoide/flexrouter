const DEBUG = true;
var NeedsTimingInfo = true;
const DIVISI_CHANNEL_START = 2;
const DIVISI_CHANNEL_MONO = 8;
const LAPSE = 0.05;
let lastTime = new Date().getTime();
let lastTime_idle = null;
let wasPlaying = false;

const console = {
    maxFlush: 20,
    b: [],
    log: function (msg) { this.b.push(msg) },
    flush: function () {
        var i = 0;
        while (i <= this.maxFlush && this.b.length > 0) {
            Trace(this.b.shift());
            i++;
        }
    }
};

const activeNotes = {
    maxFlush: 100,
    b: [],
    sended: [],
    add: function (event) { this.b.push(event) },
    sortByPitchAscending: function (a, b) {
        if (a.pitch < b.pitch) {
            return -1;
        }
        if (a.pitch > b.pitch) {
            return 1;
        }
        return 0;
    },
    rechannel: function (divisi_notes) {
        // sort divisi_notes by pitch ascending
        divisi_notes.sort(this.sortByPitchAscending);
        if (divisi_notes.length > 2) {
            for (let i = 0; i < divisi_notes.length; i++) {
                divisi_notes[i].channel = i + DIVISI_CHANNEL_START;
            }
        } else if (divisi_notes.length == 1) {
            divisi_notes[0].channel = DIVISI_CHANNEL_MONO;
        } else if (divisi_notes.length == 2) {
            divisi_notes[0].channel = DIVISI_CHANNEL_MONO;
        }
        // if (divisi_notes.length > 0) console.log(JSON.stringify(divisi_notes));
        // substitute divisi_notes in b
        for (let i = 0; i < divisi_notes.length; i++) {
            for (let j = 0; j < this.b.length; j++) {
                if (this.b[j].pitch == divisi_notes[i].pitch) {
                    this.b[j] = divisi_notes[i];
                    break;
                }
            }
        }
    },
    divisi: function (channel) {
        let c = [];
        let divisi_notes = [];
        // copy b in c
        let k = Math.min(this.maxFlush, this.b.length);
        for (let i = 0; i < k; i++) {
            c[i] = this.b[i];
        }
        // get the group of notes that start in the same interval (50ms)
        startTime = 0;
        note_time = 0;
        for (let i = 0; i < c.length; i++) {
            if (startTime == 0) {
                startTime = c[i].beatPos;
                divisi_notes.push(c[i]);
            } else {
                note_time = c[i].beatPos - startTime;
                if (note_time < LAPSE) {
                    divisi_notes.push(c[i]);
                } else {
                    this.rechannel(divisi_notes);
                    divisi_notes = [];
                    startTime = c[i].beatPos;
                    divisi_notes.push(c[i]);
                }
            }
        }
        this.rechannel(divisi_notes);
    },
    send: function () {
        let i = 0;
        while (i <= this.maxFlush && this.b.length > 0) {
            let event = this.b.shift();
            //console.log(JSON.stringify(event));
            event.send();
            this.sended.push(event);
            i++;
        }
    },
    noteoff: function () {
        for(let i = 0; i < this.sended.length; i++) {
            let off = new NoteOff(this.sended[i]);
            off.send();
        }
    }
};

console.log("Starting");

function Idle() {
    const now = new Date().getTime();
    //if (lastTime_idle) Trace(`Idle ${now - lastTime}ms`);
    lastTime_idle = now;
    console.flush();
}

function ProcessMIDI() {
    // Get timing information from the host application
	let musicInfo = GetTimingInfo();

	// clear activeNotes[] when the transport stops and send any remaining note off events
	if (wasPlaying && !musicInfo.playing) {
		activeNotes.noteoff();
	}
	wasPlaying = musicInfo.playing;
    const now = new Date().getTime();
    // let lapse_from_last_execution = now - lastTime;
    activeNotes.divisi();
    activeNotes.send();
    // lastTime = now;
}

function HandleMIDI(event) {
    if (event instanceof NoteOn) {
        activeNotes.add(event);
    } else if (event instanceof NoteOff) {
        for (i = 0; i < activeNotes.sended.length; i++) {
            if (activeNotes.sended[i].pitch == event.pitch) {
                event.channel = activeNotes.sended[i].channel;
                activeNotes.sended.splice(i, 1);
                break;
            }
        }
        event.send();
    } else {
        event.send();
    }
}