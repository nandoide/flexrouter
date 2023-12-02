function HandleMIDI(event) {
	if (event.channel == 1) {
		event.channel = 16;
	}
    if (event instanceof NoteOn && event.pitch == 25 && event.velocity == 3) {
        Trace("Instrument change to channel" + event.velocity);
        event.trace();
    }
	event.send();
}
