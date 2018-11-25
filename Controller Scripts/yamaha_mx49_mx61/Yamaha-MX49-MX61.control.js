
loadAPI(2);

const RGB_COLORS =
[
    [ 0.3294117748737335 , 0.3294117748737335 , 0.3294117748737335 , "Dark Gray"],
    [ 0.47843137383461   , 0.47843137383461   , 0.47843137383461   , "Gray"],
    [ 0.7882353067398071 , 0.7882353067398071 , 0.7882353067398071 , "Light Gray"],
    [ 0.5254902243614197 , 0.5372549295425415 , 0.6745098233222961 , "Silver"],
    [ 0.6392157077789307 , 0.4745098054409027 , 0.26274511218070984, "Dark Brown"],
    [ 0.7764706015586853 , 0.6235294342041016 , 0.43921568989753723, "Brown"],
    [ 0.34117648005485535, 0.3803921639919281 , 0.7764706015586853 , "Dark Blue"],
    [ 0.5176470875740051 , 0.5411764979362488 , 0.8784313797950745 , "Purplish Blue"],
    [ 0.5843137502670288 , 0.2862745225429535 , 0.7960784435272217 , "Purple"],
    [ 0.8509804010391235 , 0.21960784494876862, 0.4431372582912445 , "Pink"],
    [ 0.8509804010391235 , 0.18039216101169586, 0.1411764770746231 , "Red"],
    [ 1                  , 0.34117648005485535, 0.0235294122248888 , "Orange"],
    [ 0.8509804010391235 , 0.615686297416687  , 0.062745101749897  , "Light Orange"],
    [ 0.45098039507865906, 0.5960784554481506 , 0.0784313753247261 , "Green"],
    [ 0                  , 0.615686297416687  , 0.27843138575553894, "Cold Green"],
    [ 0                  , 0.6509804129600525 , 0.5803921818733215 , "Bluish Green"],
    [ 0                  , 0.6000000238418579 , 0.8509804010391235 , "Blue"],
    [ 0.7372549176216125 , 0.4627451002597809 , 0.9411764740943909 , "Light Purple"],
    [ 0.8823529481887817 , 0.4000000059604645 , 0.5686274766921997 , "Light Pink"],
    [ 0.9254902005195618 , 0.3803921639919281 , 0.34117648005485535, "Skin"],
    [ 1                  , 0.5137255191802979 , 0.24313725531101227, "Redish Brown"],
    [ 0.8941176533699036 , 0.7176470756530762 , 0.30588236451148987, "Light Brown"],
    [ 0.6274510025978088 , 0.7529411911964417 , 0.2980392277240753 , "Light Green"],
    [ 0.24313725531101227, 0.7333333492279053 , 0.3843137323856354 , "Grass Green"],
    [ 0.26274511218070984, 0.8235294222831726 , 0.7254902124404907 , "Light Blue"],
    [ 0.2666666805744171 , 0.7843137383460999 , 1                  , "Greenish Blue"],
];


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

   trackBank = host.createTrackBank(64,1,1);

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

   cursorTrack = host.createCursorTrack(1, 1);
   
   //primaryDevice = cursorTrack.getPrimaryDevice();
   primaryDevice = cursorTrack.createCursorDevice()
   primaryDevice.exists().markInterested();
   remoteControls = primaryDevice.createCursorRemoteControlsPage(8);

   primaryDevice.addNameObserver( 15, "Device", function( name ) {
        sendTemplateName( name );        
        out5.sendSysex("F0 43 10 7F 17 01 20 00 00 F7")

   })

   for( var i=0; i<8; i++) {
       remoteControls.getParameter( i ).name().addValueObserver(getMacroNameObserver(i))                
       remoteControls.getParameter( i ).value().addValueObserver(100,getValueObserver( i ));
   }
   primaryDevice.getChannel().getVolume().addValueObserver(100,getValueObserver(8));
   primaryDevice.getChannel().getPan().addValueObserver(100,getValueObserver(9));

    browser  = host.createPopupBrowser();
    resultColumn = browser.resultsColumn();
    cursorResult = resultColumn.createCursorItem();
    cursorResult.addValueObserver(100, "", getSelectedNameObserver() );
    cursorResultBank = resultColumn.createItemBank(1000);

    for (var i=0; i<cursorResultBank.getSize(); i++) {
        item = cursorResultBank.getItem(i)
        item.name().markInterested()
    }
}

macromapped = [ true, true, true, true, true, true, true ,true, true, true, true, true, true ];
macrovalue = [0,0,0,0,0,0,0,0,0,0,0,0]
selectedName = [""]
function getMacroIsMappedObserver( i ) {
    return function( mapped ) {
        macromapped[i] = mapped;
        sendValue(i,macrovalue[i],mapped);
    }
}

function getSelectedNameObserver() {
    return function( name ) {
        println( name );
        selectedName[0] = name
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
            remoteControls.getParameter( idx ).value().set(data2, 128);

        } else if ( idx == 8 ) {
            primaryDevice.getChannel().getVolume().set( data2, 128 );
        } else if ( idx == 9 ) {
            primaryDevice.getChannel().getPan().set( data2, 128 );
        } else if ( idx == 10) {
            if ( primaryDevice.getChannel().getSend(0) != null ) {
                primaryDevice.getChannel().getSend(0).set( data2, 128 );
            }
        } else if ( idx == 11 ) {
           if ( primaryDevice.getChannel().getSend(1) != null ) {
            primaryDevice.getChannel().getSend(1).set( data2, 128 );
            }
        }
    } 
    if (status == 144) {
        if ( data1 == 93 && data2 == 127 ) {
            transport.stop();
        } else if ( data1 == 94 && data2 == 127 ) {
            transport.play();

        } else if ( data1 == 60 && data2 == 127 ) {
            setTrackColor(10);
        } else if ( data1 == 61 && data2 == 127 ) {
            setTrackColor(11);

        } else if ( data1 == 62 && data2 == 127 ) {
            setTrackColor(13);

        } else if ( data1 == 63 && data2 == 127 ) {
            setTrackColor(23);

        } else if ( data1 == 64 && data2 == 127 ) {
            setTrackColor(6);

        } else if ( data1 == 65 && data2 == 127 ) {
            setTrackColor(16);


        } else if ( data1 == 118 && data2 == 127 ) {
            application.createAudioTrack(0);
            host.scheduleTask( function() {
                trackBank.scrollToChannel(0);
                c = RGB_COLORS[Math.floor(Math.random()*RGB_COLORS.length)]
                trackBank.getChannel(0).color().set(c[0], c[1], c[2])
            },100);

        } else if ( data1 == 119 && data2 == 127 ) {
            application.createInstrumentTrack(0);
            host.scheduleTask( function() {
                trackBank.scrollToChannel(0);
                c = RGB_COLORS[Math.floor(Math.random()*RGB_COLORS.length)]
                trackBank.getChannel(0).color().set(c[0], c[1], c[2])
            },100);

        } else if ( data1 == 54 && data2 == 127 ) {
            createSpecialTrack("HW Instrument");
        } else if ( data1 == 55 && data2 == 127 ) {
            createSpecialTrack("ACE.64");   
        } else if ( data1 == 56 && data2 == 127 ) {
            createSpecialTrack("Repro-1.64");
        } else if ( data1 == 57 && data2 == 127 ) {
            createSpecialTrack("Polysynth");
        } else if ( data1 == 58 && data2 == 127 ) {
            createSpecialTrack("Drum Machine");
        } else if ( data1 == 59 && data2 == 127 ) {
            if (primaryDevice.exists().get()) {
                primaryDevice.browseToReplaceDevice();
            } else {
                cursorTrack.browseToInsertAtStartOfChain();
            }

        }
//        generic.sendRawMidiEvent( status, data1, data2 );
    }
}

function createSpecialTrack(pluginName) {
            application.createInstrumentTrack(0);
            
            host.scheduleTask( function() {
                trackBank.scrollToChannel(0);
                c = RGB_COLORS[Math.floor(Math.random()*RGB_COLORS.length)]
                trackBank.getChannel(0).color().set(c[0], c[1], c[2])
                trackBank.getChannel(0).browseToInsertAtStartOfChain();
                application.arrowKeyDown();
                host.scheduleTask( function() {
                    for (var i=0; i<cursorResultBank.getSize(); i++) {
                        item = cursorResultBank.getItem(i)
                        item.isSelected().set(true);
                        name = item.name().getValue();
                        println( "Sel " + i + " -> " +item.name().getValue());
                        if (name == pluginName) break;
                    }
                    browser.commit();
                    t = trackBank.getChannel(0);
                    t.selectInMixer(); 

                }, 300); 
            }, 100);

}

function setTrackColor(color) {
    c = RGB_COLORS[color]
    cursorTrack.color().set(c[0], c[1], c[2])
}

function exit()
{
}
