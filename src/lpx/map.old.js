const DEBUG = true;
NeedsTimingInfo = true;
const pitchs = [36,38,40,41,43,45];
const modulations = [0,32,54,76,98,127];
const scales = ['major', 'minor', 'harmonic', 'melodic', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'ionian', 'eolian'];
const note_start = 24; //C0
const notes = MIDI._noteNames.slice(note_start); //from C0
const scale_intervals = {
    'major': "2212221", 'ionian': "2212221", 'ion': "2212221", 'maj': "2212221", 'M': "2212221",
    'dorian': "2122212", 'dor': "2212221",
    'phrygian': "1222122", 'phr': "1222122",
    'lydian': "2221221", 'lyd': "2221221",
    'mixolydian': "2212212", 'mix': "2212212",
    'aeolian': "2122122", 'minor': "2122122", 'min': "2122122", 'm': "2122122",
    'locrian': "1221222", 'loc': "1221222",
    'harmonic': "2122131", 'har': "2122131", 'h': "2122131",
    'melodic': "2122221", 'mel': "2122221"
}
const notes_range_ini = 57; //A2
// note 56 (G2#) ups the octave of the mapped notes
const octave_up = 56;
const octaves = 2;
const scaler_pad_binds_bank0 = [36, 38, 40, 41];

const scaler_pad_binds_bank1 = [43, 45, 47, 47];
let scale = 'major';
let root = 60; //C3
let octave = 0; 
let scaler_pad_bank = 0;
		
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
    } else if (event instanceof ControlChange && event.number == 1) {
        //Create a note on and off event for every modulation mapped to control keys in scaler
        if (DEBUG) Trace("Toggle bank of scaler pad rows");
        if (DEBUG) event.trace();
        if (DEBUG) Trace(event.value);
        var index = modulations.indexOf(event.value);
        if (index > -1) {
            var on = new NoteOn;
            on.pitch = pitchs[index];
            on.channel = 1;
            if (DEBUG) Trace('Mod', on.pitch);
            on.velocity = 1; 
            on.send();
            var off = new NoteOff(on);
            off.sendAfterBeats(1);
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
        Trace(pitch);
        for (var i = 0; i < pitch_index; i++) {
        		Trace('Here' + ' ' + i + ' ' + scale_intervals[scale][i % 7]);
		  		pitch += parseInt(scale_intervals[scale][i % 7]);
        }
        event.pitch = pitch;
        if (DEBUG) event.trace();
        event.send();
    } else if ((event instanceof NoteOn || event instanceof NoteOff) && event.pitch < 24) {
        // don't send keyswitches zone to scaler
    } else if ((event instanceof NoteOn || event instanceof NoteOff) && scaler_pad_bank == 1 && scaler_pad_binds_bank0.indexOf(event.pitch) >= 0) {
    	// apply scaler pad change
    	var pad_pos = scaler_pad_binds_bank0.indexOf(event.pitch);
		event.pitch = scaler_pad_binds_bank1[pad_pos];
		event.send();
    } else {
        if (DEBUG) Trace("Not intercepted");
        if (DEBUG) event.trace();
        event.send();
    }
}

function ParameterChanged(param, value) {
    switch(param) {
        case 1:
            root = value + note_start;
            Trace('Parameter root: ' + root);
            break;
        case 2:
		    scale = scales[value];
            Trace('Parameter scale: ' + scale);
            break;
        default:
        		root = note_start;
        		scale = "major";
            
    }
}
// parameter definitions
var PluginParameters = [
 	{
		name:"Scaler pad row 1:",
		type:"text"
	},
    {name:'Key', type:'menu', valueStrings:notes,
        defaultValue:MIDI.noteNumber('C3'), numberOfSteps: notes.length},
    {name:'Scale', type:'menu', valueStrings:scales,
        defaultValue:0, numberOfSteps: scales.length},
    {
		name:"Scaler pad row 2:",
		type:"text"
	},
	{name:'Key', type:'menu', valueStrings:notes,
        defaultValue:MIDI.noteNumber('C3'), numberOfSteps: notes.length},
    {name:'Scale', type:'menu', valueStrings:scales,
        defaultValue:0, numberOfSteps: scales.length}
];