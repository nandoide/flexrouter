const DEBUG = true;
NeedsTimingInfo = true;
const scaler_chordpad_row = 11;
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
const octaves = [0,1,2,3,4]; // octaves up and down
let octave = 0; // octave index in octaves

const modulations4pad = [0, 32, 54]; //first three modulation of the logic onscreen midi keyboard
const modulations4perform = [76, 98, 127];//second three modulations of the logic onscreen midi keyboard

const instrument = 9;
const cc_instrument = 88;

const articulation = 0;
const cc_articulation = 70;

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

function send_cc_with_value(cc_number, value) {
    Trace("Send CC with value " + cc_number + " " + value);
    let cc = new ControlChange;
    cc.number = cc_number;
    cc.value = value;
    cc.send();
}

function send_note(pitch, velocity) {
    Trace("Send Note " + pitch + " " + velocity);
    let on = new NoteOn;
    on.pitch = pitch;
    on.velocity = velocity;
    on.send();
    let off = new NoteOff(on);
    off.sendAfterBeats(1);
}

function send_scaler_chorpad(pitch, velocity) {
    if(DEBUG) Trace('Row selection for chord pad in scaler ' + pitch + ' ' + velocity);
    velocity -= 1; //logic piano roll velocity is 1-127
    if (velocity > scaler_cc_chordpad_limit) {
        velocity = scaler_cc_chordpad_limit;
    }
    send_cc(velocity, scaler_cc_chordpad_row);
    send_cc(velocity, scaler_cc_chordpad_scale);
}

function send_scaler_performance(pitch, velocity) {
    if(DEBUG) Trace('Row selection for performance in scaler ' + pitch + ' ' + velocity);
    velocity -= 1; //logic piano roll velocity is 1-127
    if (velocity > scaler_cc_performance_limit) {
        velocity = scaler_cc_performance_limit;
    }
    send_cc(velocity, scaler_cc_performance);
}

function HandleMIDI(event) {
    if (event instanceof NoteOn && event.pitch == scaler_chordpad_row) {
        send_scaler_chorpad(event.pitch, event.velocity);
    } else if (event instanceof NoteOn && event.pitch == scaler_performance) {
        send_scaler_performance(event.pitch, event.velocity);
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
    } else if (event instanceof ControlChange && event.number == 1) {
        //For screen keyboard in logic pro
        //Create a note on and off event for every modulation mapped to control keys in scaler
        if (DEBUG) Trace("Toggle bank of scaler pad rows");
        if (DEBUG) event.trace();
        if (DEBUG) Trace(event.value);
        let index = modulations4pad.indexOf(event.value);
        if (index > -1) {
            send_note(scaler_chordpad_row, index + 1);
            send_scaler_chorpad(scaler_chordpad_row, index + 1);
        } else {
            index = modulations4perform.indexOf(event.value);
            if (index > -1) {
                send_note(scaler_performance, index + 1);
                send_scaler_performance(scaler_performance, index + 1);   
            }
        }
    } else if (event instanceof Note && event.pitch == instrument) {
        send_cc_with_value(cc_instrument, event.velocity - 1);
    } else if (event instanceof Note && event.pitch == articulation) {
        send_cc_with_value(cc_articulation, event.velocity);
    } else {
        if (DEBUG) Trace("Not intercepted");
        if (DEBUG) event.trace();
        event.send();
    }
}
