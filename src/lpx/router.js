const DEBUG = true;
NeedsTimingInfo = true;
const scaler_velocity_chordpad_row = 11;
const scaler_cc_chordpad_row = 40;
const scaler_cc_chordpad_scale = 50;
const scaler_cc_chordpad_limit = 7;
const scaler_performance = 10;
const scaler_cc_performance = 60;
const scaler_cc_performance_limit = 9;

const intervals = "2212221" // major scale
const notes_range_ini = 21; //A-1, firs white after 8 chords in scaler
const root = 24; // C0
const octave_up = 20; // octave up from 0 to octaves - 1
const octaves = [1,2,3]; // octaves up and down
let octave = 0; // octave index in octaves

function send_cc(index, root_cc) {
    Trace("Send CC");
    if (root_cc == undefined) {
        Trace("No CC root defined, CC message not send");
        return;
    } else {
        let cc_number = root_cc + index;
        Trace("cc_number " + cc_number);
        let cc = new ControlChange;
        cc.number = cc_number;
        cc.value = 127;
        cc.send();
    }
}

function HandleMIDI(event) {
    if (event instanceof NoteOn && event.pitch == scaler_velocity_chordpad_row) {
        Trace('Row selection for chord pad in scaler', event.pitch, event.velocity);
        event.velocity -= 1; //logic piano roll velocity is 1-127
        if (event.velocity > scaler_cc_chordpad_limit) {
            event.velocity = scaler_cc_chordpad_limit;
        }
        send_cc(event.velocity, scaler_cc_chordpad_row);
        send_cc(event.velocity, scaler_cc_chordpad_scale);
    } else if (event instanceof NoteOn && event.pitch == scaler_performance) {
        Trace('Row selection for performance in scaler', event.pitch , event.velocity);
        event.velocity -= 1; //logic piano roll velocity is 1-127
        if (event.velocity > scaler_cc_performance_limit) {
            event.velocity = scaler_cc_performance_limit;
        }
        send_cc(event.velocity, scaler_cc_performance);
    } else if (event instanceof NoteOn && event.pitch == octave_up) {
        if (DEBUG) Trace("Octave change")
        if (DEBUG) Trace(octave);
        octave = (octave + 1) % octaves.length;
        if (DEBUG) Trace(octave);
    } else if ((event instanceof NoteOn || event instanceof NoteOff) && event.pitch >= notes_range_ini) {
        //Modify pitch to white key from C3 (default) and mapping to white keys
        Trace('Displace octave', event.pitch);
        if (DEBUG) event.trace();
        var pitch_index = event.pitch - notes_range_ini;
        var pitch = root + octaves[octave] * 12;
        let intervals_len = intervals.length;
        for (var i = 0; i < pitch_index; i++) {
            pitch += parseInt(intervals[i % intervals_len]);
        }
        event.pitch = pitch;
        if (DEBUG) event.trace();
        event.send();
    } else {
        if (DEBUG) Trace("Not intercepted");
        if (DEBUG) event.trace();
        event.send();
    }
}