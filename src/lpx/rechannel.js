const DEBUG = true;
let instrument_channel = 1;

function send_cc(cc_number, value, channel) {
    Trace("Send CC with value " + cc_number + " " + value + " " + channel);
    let cc = new ControlChange;
    cc.number = cc_number;
    cc.value = value;
    //cc.channel = channel;
    cc.send();
}

function HandleMIDI(event) {
    // if(DEBUG) event.trace();
    if (event instanceof ControlChange && event.number == 88) {
        // if(DEBUG) event.trace();
        if (event.value  <= 10  ) {
            Trace("1 Change instrument channel " + (event.value + 1)) ;
            send_cc(123, 0, instrument_channel); // all notes off
            instrument_channel = event.value + 1     ;
            Trace("2 Change instrument channel " + instrument_channel);
        }
    } else {
      event.channel = instrument_channel;
    	  event.send();
    }
    //if(DEBUG) Trace('out');
    //if(DEBUG) event.trace();
}
   