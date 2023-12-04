// Repeats note that is played with specified beat divisions

var NeedsTimingInfo = true;
// load active notes with notes that start in the same interval (50ms) as the first note
var activeNotes = [];
var startTime = 0;
var note_time = 0;
var LAPSE = 0.05;

function HandleMIDI(event) {
	if (event instanceof NoteOn) {
        if (startTime == 0) {
            startTime = event.beat;
            activeNotes.push(event);
        } else {
            note_time = event.beat - startTime;
            if (note_time < LAPSE) {
                activeNotes.push(event);
            } else {
                activeNotes = [];
                startTime = event.beat;
                activeNotes.push(event);
            }
        }  
	}
	else if (event instanceof NoteOff) {
		// remove note from array
		for (i = 0; i < activeNotes.length; i++) {
			if (activeNotes[i].pitch == event.pitch) {
				activeNotes.splice(i, 1);
				break;
			}
		}
	}
	// pass non-note events through
	else event.send();

	// sort array of active notes
	activeNotes.sort(sortByPitchAscending);
}

//-----------------------------------------------------------------------------
function sortByPitchAscending (a, b) {
	if (a.pitch < b.pitch) {
    return -1;
  }
	if (a.pitch > b.pitch) {
    return 1;
  }
	return 0;
}

//-----------------------------------------------------------------------------
var wasPlaying = false;

function ProcessMIDI() {
	// Get timing information from the host application
	var musicInfo = GetTimingInfo();

	// clear activeNotes[] when the transport stops and send any remaining note off events
	if (wasPlaying && !musicInfo.playing) {
		for(i = 0;i < activeNotes.length; i++) {
			var off = new NoteOff(activeNotes[i]);
			off.send();
		}
	}

	wasPlaying = musicInfo.playing;

	if (activeNotes.length != 0) {

        var state = GetParameter("Reset");
        if (state == 1) {
            Reset();
        }

			var chosenNote = chooseNote(noteOrder, step);

			// send events
			var noteOn = new NoteOn(chosenNote);
			// noteOn.pitch = MIDI.normalizeData(noteOn.pitch + randomOctave);
			noteOn.pitch = MIDI.normalizeData(noteOn.pitch);
			// noteOn.sendAtBeat(nextBeat + randomDelay);
			noteOn.sendAtBeat(nextBeat);
			var noteOff = new NoteOff(noteOn);
			// noteOff.sendAtBeat(nextBeat + randomDelay + noteLength + randomLength);
			noteOff.sendAtBeat(nextBeat + noteLength);

			// advance to next beat
			nextBeat += 0.001;
			nextBeat = Math.ceil(nextBeat * division) / division;
		}
	}
}

function Reset() {
  NeedsTimingInfo = true;
  activeNotes = [];
  SetParameter ("Reset", 0);
}

//-----------------------------------------------------------------------------
var noteOrders = ["up", "down", "random"];

function chooseNote(noteOrder, step) {
	var order = noteOrders[noteOrder];
	var length = activeNotes.length
	if (order == "up") return activeNotes[step % length];
	if (order == "down") return activeNotes[Math.abs(step % length - (length - 1))];
	if (order == "random") return activeNotes[Math.floor(Math.random() * length)];
	else return 0;
}

//-----------------------------------------------------------------------------
// var PluginParameters =
// [
// 		{name:"Beat Division", type:"linear",
// 		minValue:1, maxValue:16, numberOfSteps:15, defaultValue:1},
//
// 		{name:"Note Order", type:"menu", valueStrings:noteOrders,
// 		minValue:0, maxValue:2, numberOfSteps: 3, defaultValue:0},
//
// 		{name:"Note Length", unit:"%", type:"linear",
// 		minValue:1, maxValue:200, defaultValue:100.0, numberOfSteps:199},
//
// 		{name:"Random Length", unit:"%", type:"linear",
// 		minValue:0, maxValue:200, numberOfSteps: 200, defaultValue:0},
//
// 		{name:"Random Delay", unit:"%", type:"linear",
// 		minValue:0, maxValue:200, numberOfSteps:200, defaultValue:0},
//
// 		{name:"Random Octave", type:"linear",
// 		minValue:1, maxValue:4, defaultValue:1, numberOfSteps:3}
// ];
var PluginParameters =
[
		{name:"Beat Division", type:"linear",
		minValue:1, maxValue:16, numberOfSteps:15, defaultValue:1},

		{name:"Note Order", type:"menu", valueStrings:noteOrders,
		minValue:0, maxValue:2, numberOfSteps: 3, defaultValue:0},

		{name:"Reset", type:"menu", valueStrings:["Off", "On"],
		minValue:0, maxValue:1, numberOfSteps: 2, defaultValue:0},

		{name:"Note Length", unit:"%", type:"linear",
		minValue:1, maxValue:200, defaultValue:100.0, numberOfSteps:199}
];

// ----------------------------------------------------------------------------
// Code from plugin.js

// Copy and paste this chunk of code into your script editor to create controls in your plugin

// var PluginParameters = [];

// Types of Plugin Parameters
const LINEAR_FADER = "lin";
const LOGARITHMIC_FADER = "log";
const MOMENTARY_BUTTON = "momentary";
const MENU = "menu";
const NOT_NEEDED = "";

/*
To create a plugin parameter (a fader or knob that changes something is a basic way of desribing it), call the createPluginParameter function as follows:
createPluginParameter("Enter a name in quotes", Enter a type from above in quotes (for example: LINEAR_FADER), Enter a minimum value, Enter a maximum value, Enter a default value, enter the number of steps, "Enter a unit in quotes", "Enter text to create a divider/header in the plug-in", Enter a list of value strings if you are creating a menu as follows: ["something", "something", "something"]);
*/

function createPluginParameter (name, type, minValue, maxValue, defaultValue, numberOfSteps, unit, text, valueStrings) {
  if (type == MENU) {
    PluginParameters.push (createMenuPluginParameter (name, type, minValue, maxValue, defaultValue, numberOfSteps, unit, text, valueStrings));
  }
  else {
    PluginParameters.push (createBasicPluginParameter (name, type, minValue, maxValue, defaultValue, numberOfSteps, unit, text));
  }
}

function createBasicPluginParameter (name, type, minValue, maxValue, defaultValue, numberOfSteps, unit, text) {
  return {name: name, type: type, minValue: minValue, maxValue: maxValue, numberOfSteps: numberOfSteps, unit: unit, text: text};
}

function createMenuPluginParameter (name, type, minValue, maxValue, defaultValue, numberOfSteps, unit, text, valueStrings) {
  return {name: name, type: type, minValue: minValue, maxValue: maxValue, numberOfSteps: numberOfSteps, unit: unit, text: text, valueStrings: valueStrings};
}

//Parameters for the plugin