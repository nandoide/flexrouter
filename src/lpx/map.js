const DEBUG = true;
NeedsTimingInfo = true;
const cc_values4pad = [30, 31, 32, 33, 34, 35, 36, 37]
const pitchs4pad = [36, 38, 40]; //bindings for the four rows of scaler pad
const modulations4pad = [0, 32, 54]; //first four modulations4pad of the logic onscreen midi keyboard
const pitchs4perform = [24, 26, 28]
const modulations4perform = [76, 98, 127]
const scales_CC_root = ["", "50", "60", "70", "80"];
const perform_CC_root = ["", "90", "100", "110", "120"];
const intervals = "2212221" // major
const notes_range_ini = 57; //A2
// note 56 (G2#) ups the octave of the mapped notes
const octave_up = 56;
const octaves = 2;
const scaler_pad_binds = [36, 38, 40, 41, 43, 45, 47, 47];
const scaler_perform_binds_bank0 = [24, 26, 28, 29]; //8 performance alternatives from C0
const scaler_perform_binds_bank1 = [31, 33, 35, 37];
let scale = 'major';
let root = 60; //C3
let octave = 0;
let scaler_pad_bank = 0;
let scaler_perform_bank = 0;
let root_pad_CC = 50;
let root_perform_CC = 60;

function HandleMIDI(event) {
    event.trace();
    if (event instanceof ControlChange && event.number == 23) {
        //Create a note on and off event for every modulation mapped to control keys in scaler
        Trace("mod");
        event.trace();
        if (DEBUG) Trace(event.value);
        if (event.value >= 64) {
            scaler_pad_bank = 1;
        } else {
            scaler_pad_bank = 0;
        }
        // Assign extremes of knob to perform mode
        if (event.value < 10) scaler_pad_bank = 2;
        if (event.value > 120) scaler_pad_bank = 3;
    } else if (event instanceof ControlChange && event.number == 1) {
        //For screen keyboard in logic pro
        //Create a note on and off event for every modulation mapped to control keys in scaler
        if (DEBUG) Trace("Toggle bank of scaler pad rows");
        if (DEBUG) event.trace();
        if (DEBUG) Trace(event.value);
        let index = modulations4pad.indexOf(event.value);
        if (index > -1) {
            send_scaler_keyswitch(index)
            send_scaler_cc(index, root_pad_CC);
        } else {
            index = modulations4perform.indexOf(event.value);
            Trace("performances? " + event.value + ' ' + index)
            if (index > -1) {
                send_scaler_cc(index, root_perform_CC);
            }
        }
    } else if (event instanceof ControlChange && event.number == 20) {
        // change upper left knob of nanokey to modulation cc-1
        event.number = 1;
        event.send();
    } else if (event instanceof ControlChange && event.number == 24) {
        // change down left knob of nanokey to expression cc-11
        event.number = 11;
        event.send();
    } else if (event instanceof ControlChange && event.number == 21) {
        // change down left knob of nanokey to reverb cc-19 in spitfire audio
        event.number = 19;
        event.send();
    } else if (event instanceof NoteOn && event.pitch == octave_up) {
        if (DEBUG) Trace("Octave change")
        if (DEBUG) Trace(octave);
        octave = (octave + 1) % octaves;
        if (DEBUG) Trace(octave);
        event.velocity = 0;
        event.send();
    } else if ((event instanceof NoteOn || event instanceof NoteOff) && event.pitch >= notes_range_ini) {
        //Modify pitch to white key from C3
        Trace('Displace octave', event.pitch);
        if (DEBUG) event.trace();
        var pitch_index = event.pitch - notes_range_ini;
        var pitch = root + octave * 12;
        let intervals_len = intervals.length;
        for (var i = 0; i < pitch_index; i++) {
            pitch += parseInt(intervals[i % intervals_len]);
        }
        event.pitch = pitch;
        if (DEBUG) event.trace();
        event.send();
    } else if ((event instanceof NoteOn || event instanceof NoteOff) && event.pitch < 24) {
        // don't send keyswitches kontakt zone (C-2, C-1) to scaler
	} else if (event instanceof ControlChange && cc_values4pad.indexOf(event.number) > -1 && scaler_pad_bank <= 1) {
        let index = cc_values4pad.indexOf(event.number) + scaler_pad_bank * 4;
        // send CC control for the scale of the pad row
        send_scaler_cc(index, root_pad_CC);
        // send keyswitch for row pad
        send_scaler_keyswitch(index);
    } else if (event instanceof ControlChange && cc_values4pad.indexOf(event.number) > -1 && scaler_pad_bank <= 3) {
        //performances
        let index = cc_values4pad.indexOf(event.number) + (scaler_pad_bank - 2) * 4;
        send_scaler_cc(index, root_perform_CC);
    } else if (event instanceof NoteOn && scaler_pad_binds.indexOf(event.pitch) > -1) {
        let index = scaler_pad_binds.indexOf(event.pitch);
        // send CC control to set the scale related to the pad row
        send_scaler_cc(index, root_pad_CC);
    } else {
        if (DEBUG) Trace("Not intercepted");
        if (DEBUG) event.trace();
        event.send();
    }

    function send_scaler_keyswitch(index) {
        let on = new NoteOn;
        on.pitch = scaler_pad_binds[index];
        on.channel = 1;
        if (DEBUG) Trace('Mod', on.pitch);
        on.velocity = 1;
        on.send();
        var off = new NoteOff(on);
        off.sendAfterBeats(1);
        return off;
    }

    function send_scaler_cc(index, root_cc) {
        Trace("Send cc to scaler");
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
}

function ParameterChanged(param, value) {
    switch (param) {
        case 0:
            if (value === "")
                root_pad_CC = undefined;
            else
                root_pad_CC = parseInt(scales_CC_root[value]);
            break;
        case 1:
            if (value === "")
                root_perform_CC = undefined;
            else
                root_perform_CC = parseInt(perform_CC_root[value]);
            break;
        default:
            Trace('Parameter not defined');
    }
}
// parameter definitions
var PluginParameters = [
    {
        name: 'CC root for pad row scale', type: 'menu', valueStrings: scales_CC_root,
        defaultValue: 0, numberOfSteps: scales_CC_root.length
    },
    {
        name: 'CC root for performances', type: 'menu', valueStrings: perform_CC_root,
        defaultValue: 0, numberOfSteps: perform_CC_root.length
    }
];