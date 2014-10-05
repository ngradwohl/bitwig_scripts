loadAPI(1);

host.defineController( "M-Audio", "iControl", "1.0", "336185fb-7e4b-46e5-9954-fd7100c3b99b");

host.defineMidiPorts(1,1);
host.addDeviceNameBasedDiscoveryPair(["iControl"],["iControl"]);
host.addDeviceNameBasedDiscoveryPair(["iControl MIDI 1"],["iControl MIDI 1"]);

var CC = {
    REC: 106,
    START: 107,
    REV: 108,
    PLAY: 109,
    FF: 110,
    LOOP: 111,
    
    SEL1 : 88,
    SEL8 : 95,
        
    ARM1: 64,
    ARM8: 71,
    
    MUTE1: 80,
    MUTE8: 87,
    
    SOLO1: 72,
    SOLO8: 79,
    
    KNOB1: 16,
    KNOB8: 23,
}

var MODE = {
    VOL:97,
    PAN:98,
    SEND1:99,
    SEND2:100,
    MACRO1:101,
    MACRO2:102,
    MACRO3:103,
}

var currentMode = MODE.VOL;

function getTrackObserver( track ) {
    return function( on ) {
         sendMidi( 176, CC.SEL1 + track, on ? 127 : 0 ); 
    }   
}
function getArmObserver( track ) {
    return function( on ) {
         sendMidi( 176, CC.ARM1 + track, on ? 127 : 0 ); 
    }   
}
function getSoloObserver( track ) {
    return function( on ) {
         sendMidi( 176, CC.SOLO1 + track, on ? 127 : 0 ); 
    }   
}
function getMuteObserver( track ) {
    return function( on ) {
         sendMidi( 176, CC.MUTE1 + track, on ? 127 : 0 ); 
    }   
}

function changeMode( mode ) {
    for ( var i = MODE.VOL; i<=MODE.MACRO3; i++) {
        sendMidi( 176, i, 0);    
    }
    sendMidi( 176, mode, 127);    
    currentMode = mode;
}

function init() {
   host.getMidiInPort(0).setMidiCallback(onMidi);
   transport = host.createTransportSection();
   transport.addIsPlayingObserver(function(on) {
        isPlay = on;
        sendMidi( 176, CC.PLAY, isPlay ? 127 : 0 );
   });

   transport.addIsLoopActiveObserver( function(on ) { sendMidi( 176, CC.LOOP, on ? 127 : 0 ); });
   transport.addIsRecordingObserver( function(on ) { sendMidi( 176, CC.REC, on ? 127 : 0 ); });

   masterTrack = host.createMasterTrackSection(0);

   trackBank = host.createTrackBank(8,1,0);
   for( var i=0; i<8; i++) { 
        var t = trackBank.getTrack(i)
        t.addIsSelectedObserver( getTrackObserver( i )); 
        t.getMute().addValueObserver( getMuteObserver( i )); 
        t.getSolo().addValueObserver( getSoloObserver( i )); 
        t.getArm().addValueObserver( getArmObserver( i )); 
    }

    changeMode( MODE.VOL );
}



function onMidi( status, data1, data2 ) {
    if ( status == 176 ) {
        if ( data1 == 24 ) {
            if ( data2 < 64 ) {
                transport.incPosition( data2/4, false );
            } else {
                transport.incPosition( (data2-128)/4, false );
            }
        }else if ( data1 == 7 ) {
            masterTrack.getVolume().set(data2, 128);
        } else if ( withinRange( data1, CC.SEL1, CC.SEL8 )) {
            if ( data2 == 127 ) {
                trackBank.getTrack( data1 - CC.SEL1 ).select();
            }
        } else if ( withinRange( data1, CC.MUTE1, CC.MUTE8 )) {
            if ( data2 == 127 ) {
                trackBank.getTrack( data1 - CC.MUTE1 ).getMute().toggle();
            }
        } else if ( withinRange( data1, CC.ARM1, CC.ARM8 )) {
            if ( data2 == 127 ) {
                trackBank.getTrack( data1 - CC.ARM1 ).getArm().toggle();
            }
        } else if ( withinRange( data1, CC.SOLO1, CC.SOLO8 )) {
            if ( data2 == 127 ) {
                trackBank.getTrack( data1 - CC.SOLO1 ).getSolo().toggle();
            }
        } else if ( withinRange( data1, CC.KNOB1, CC.KNOB8 )) {
            var value;
            if ( currentMode == MODE.PAN ) {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getPan();
            } else if ( currentMode == MODE.SEND1 ) {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getSend(0);
            } else if ( currentMode == MODE.SEND2 ) {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getSend(1);
            } else if ( currentMode == MODE.MACRO1 ) {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getPrimaryDevice().getMacro(0).getAmount();
            } else if ( currentMode == MODE.MACRO2 ) {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getPrimaryDevice().getMacro(1).getAmount();
            } else if ( currentMode == MODE.MACRO3 ) {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getPrimaryDevice().getMacro(2).getAmount();


            } else {
                value = trackBank.getTrack( data1 - CC.KNOB1 ).getVolume();
            }

            value.inc( (data2 < 64 ? data2 : data2 - 128), 128 );        

        } else if ( withinRange( data1, MODE.VOL, MODE.MACRO3 )) {
            if ( data2 == 127 ) {
                changeMode( data1 );
            }
        } else {
            if ( data2 == 127 ) {
                switch(data1) {
                    case CC.REC:
                        transport.record();
                        break;
                    case CC.START:
                        transport.setPosition(0);
                        break;
                    case CC.REV:
                        transport.rewind();
                        break;
                    case CC.PLAY:
                        transport.play();
                        break;
                    case CC.FF:
                        transport.fastForward();
                        break;
                    case CC.LOOP:
                        transport.toggleLoop();
                        break;
                }   
            }
        }
    }
    
    
}

function exit() {
}
