
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

   host.getMidiInPort(4).setMidiCallback(onMidi5);
   host.getMidiInPort(4).setSysexCallback(onSysex5);

   generic = host.getMidiInPort(0).createNoteInput("Yamaha MX49/MX61");
   out1 = host.getMidiOutPort(0)

   out2 = host.getMidiOutPort(1)
   out3 = host.getMidiOutPort(2)
   out4 = host.getMidiOutPort(3)
   out5 = host.getMidiOutPort(4)

   generic.setShouldConsumeEvents(false);

   out5.sendSysex("F0 43 10 7F 17 01 20 00 00 F7")

    sendTemplateName( "Bitwig");
    sendName(8, "Vol")
    sendName(9, "Pan")
    sendName(10, "Send 1")
    sendName(11, "Send 2")

    for( var i= 0; i<8; i++) {
        sendValue( i, 0, macromapped[i] );
    }

   transport = host.createTransportSection();
   application = host.createApplication();

   cursorTrack = host.createCursorTrack(0, 0);
   
   //primaryDevice = cursorTrack.getPrimaryDevice();
   primaryDevice = cursorTrack.createCursorDevice()

   primaryDevice.addNameObserver( 15, "Device", function( name ) {
        sendTemplateName( name );        
        out5.sendSysex("F0 43 10 7F 17 01 20 00 00 F7")

   })

   for( var i=0; i<8; i++) {
       primaryDevice.getMacro( i ).addLabelObserver( 24, "Macro "+i, getMacroNameObserver(i))                
       primaryDevice.getMacro( i ).getAmount().addValueObserver(100,getValueObserver( i ));
       primaryDevice.getMacro( i ).getModulationSource().addIsMappedObserver( getMacroIsMappedObserver( i ));
   }
}

macromapped = [ true, true, true, true, true, true, true ,true ];
macrovalue = [0,0,0,0,0,0,0,0]
function getMacroIsMappedObserver( i ) {
    return function( mapped ) {
        macromapped[i] = mapped;
        sendValue(i,macrovalue[i],mapped);
    }
}

function getMacroNameObserver( i ) {
    return function( macroname ) {
        sendName( i, macroname );
    }
}

function getValueObserver( i ) {
    return function( value ) {
        macrovalue[i] = value
        sendValue(i, value, macromapped[i] );  
    }
}

function onMidi0(status, data1, data2) {
    //printMidi(status, data1, data2);
}

function sendTemplateName( name ) {
    for ( var i=0; i<15; i++) {
        var c = i<name.length ? name.charCodeAt(i) : 0x20;
        out5.sendSysex("F0 43 10 7F 17 01 00 "+hexpad(i)+" "+hexpad(c)+" F7")
    }
}

function sendName( param, name ) {
    var str = "F0 43 10 7F 17 01 "+hexpad(48+param)+" 09 ";

    for( var i=0; i<24; i++) {
        var cc = i < name.length ? name.charCodeAt(i) : 0x20;
        str += hexpad(cc) + " "
    }
    str += "F7"
    out5.sendSysex(str)
}

function sendValue( param, value, active ) {
    var str = "F0 43 10 7F 17 01 "+hexpad(0x30+param)+" 21 "
    var valstr = active ? value.toString(10) : "-";
    for ( var i=0; i< 8; i++) {
        var c = i < valstr.length ? valstr.charCodeAt(i) : 0x20;
        str += hexpad(c)+" ";
    }
    str += (active ? "00 " : "01 ") + "00 F7"
    out5.sendSysex(str);
}

function hexpad( i ) {
    var t = "00"+i.toString(16);
    return t.substr(t.length-2);
}

function onMidi5(status, data1, data2) {
  //  printMidi(status, data1, data2);
}


function onSysex5(data) {
//    printMidi(data)
}

function onMidi1(status, data1, data2) {
    printMidi(status, data1, data2);
    if ( isPitchBend( status )) {
        var idx  = MIDIChannel( status );
        sendValue(idx, Math.round(100*data2/127), idx >= 8 || macromapped[idx]);

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
