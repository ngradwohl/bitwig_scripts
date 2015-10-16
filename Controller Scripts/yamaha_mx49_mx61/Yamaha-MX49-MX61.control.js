
loadAPI(1);

host.defineController("Yamaha", "MX49/MX61", "1.0", "fadd4e99-a961-4237-9c97-478321ea072e")
host.defineMidiPorts(5, 5);
host.addDeviceNameBasedDiscoveryPair(
    ["Yamaha MX49/MX61 MIDI 1",
     "Yamaha MX49/MX61 MIDI 2",
     "Yamaha MX49/MX61 MIDI 3",
     "Yamaha MX49/MX61 MIDI 4",
     "Yamaha MX49/MX61 MIDI 5"],

    ["Yamaha MX49/MX61 MIDI 1",
     "Yamaha MX49/MX61 MIDI 2",
     "Yamaha MX49/MX61 MIDI 3",
     "Yamaha MX49/MX61 MIDI 4",
     "Yamaha MX49/MX61 MIDI 5"]);

function init() {
   host.getMidiInPort(0).setMidiCallback(onMidi0);
   host.getMidiInPort(1).setMidiCallback(onMidi1);

   generic = host.getMidiInPort(0).createNoteInput("Yamaha MX49/MX61");
   generic.setShouldConsumeEvents(false);

   transport = host.createTransportSection();
   application = host.createApplication();

   cursorTrack = host.createCursorTrack(0, 0);
   primaryDevice = cursorTrack.getPrimaryDevice();

}

function onMidi0(status, data1, data2) {
    //printMidi(status, data1, data2);
}

function onMidi1(status, data1, data2) {
    printMidi(status, data1, data2);
    if ( isPitchBend( status )) {
        println( "Control: " +  MIDIChannel( status ))
        var idx  = MIDIChannel( status );
        if ( idx < 8 ) {
            primaryDevice.getMacro( idx ).getAmount().set(data2, 128);
        } else if ( idx == 8 ) {
            primaryDevice.getChannel().getVolume().set( data2, 128 );
        } else if ( idx == 9 ) {
            primaryDevice.getChannel().getPan().set( data2, 128 );
        } else if ( idx == 10) {
            primaryDevice.getChannel().getSend(0).set( data2, 128 );
        } else if ( idx == 11 ) {
            primaryDevice.getChannel().getSend(1).set( data2, 128 );
        }
    } 
    if (status == 144) {
        if ( data1 == 93 && data2 == 127 ) {
            transport.stop();
        } else if ( data1 == 94 && data2 == 127 ) {
            transport.play();
        } else if ( data1 == 118 && data2 == 127 ) {
        } else if ( data1 == 119 && data2 == 127 ) {
        } else if ( data1 == 54 && data2 == 127 ) {
            application.createInstrumentTrack(0);
            cursorTrack.selectFirst();
            application.getAction("show_insert_popup_browser").invoke();
        } else if ( data1 == 55 && data2 == 127 ) {
            browser = primaryDevice.createDeviceBrowser(0,0);
            browser.startBrowsing()
        } else if ( data1 == 56 && data2 == 127 ) {
        } else if ( data1 == 57 && data2 == 127 ) {
        } else if ( data1 == 58 && data2 == 127 ) {
        } else if ( data1 == 59 && data2 == 127 ) {
        }
//        generic.sendRawMidiEvent( status, data1, data2 );
    }
}


function exit()
{
}
