const DEBUG = true;
var NeedsTimingInfo = true;
const DIVISI_CHANNEL_START = 2;
const DIVISI_CHANNEL_MONO = 8;

const activeNotes = {
    maxFlush: 20,
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
        LAPSE = 0.05;
        for (let i = 0; i < c.length; i++) {
            if (startTime == 0) {
                startTime = c[i].beatPos;
                divisi_notes.push(c[i]);
            } else {
                note_time = c[i].beatPos - startTime;
                if (note_time < LAPSE) {
                    divisi_notes.push(c[i]);
                } else {
                    divisi_notes = [];
                    startTime = c[i].beatPos;
                    divisi_notes.push(c[i]);
                }
            }
        }
        // if (divisi_notes.length > 1) Trace(JSON.stringify(divisi_notes));
        // sort divisi_notes by pitch ascending
        divisi_notes.sort(this.sortByPitchAscending);
        // rechannel divisi_notes, starting from channel 2 (channel 1 is the original one) 
        // if (divisi_notes.length > 1) Trace(JSON.stringify(divisi_notes));
        if (divisi_notes.length > 1) {
            for (let i = 0; i < divisi_notes.length; i++) {
                divisi_notes[i].channel = i + DIVISI_CHANNEL_START;
            }
        } else if (divisi_notes.length == 1) {
            divisi_notes[0].channel = DIVISI_CHANNEL_MONO;
        }
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
    send: function () {
        let i = 0;
        while (i <= this.maxFlush && this.b.length > 0) {
            let event = this.b.shift();
            Trace(JSON.stringify(event));
            event.send();
            this.sended.push(event);
            i++;
        }
    }
};

function ProcessMIDI() {
    activeNotes.divisi();
    activeNotes.send();
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