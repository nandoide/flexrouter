// noteoffs.js

var NeedsTimingInfo = true;
var activeNotes = [];

function HandleMIDI(event) {
	if (event instanceof NoteOn) {
        activeNotes.push(event);
	} else if (event instanceof NoteOff) {
		// remove note from array
		for (i = 0; i < activeNotes.length; i++) {
			if (activeNotes[i].pitch == event.pitch) {
                // we need create a specific noteoff for active event because the channel could change
                if (event.channel != activeNotes[i].channel) {
                    // new_noteoff = new NoteOff(activeNotes[i]);
                    // new_noteoff.send();
                    event.channel = activeNotes[i].channel;
                }
                activeNotes.splice(i, 1);
				break;
			}
		}
	}
    event.send();
}