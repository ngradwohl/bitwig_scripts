loadAPI(4);

host.defineController("Keith McMillen", "Softstep 2", "1.0", "dd426d62-43f4-4f42-a3cc-2255086109c7");

host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["SSCOM MIDI 1"], ["SSCOM MIDI 1"]);
Color = {
    GREEN:0,
    RED:1,
    YELLOW:2
}

Led = {
    OFF:0,
    ON:1,
    BLINK:2,
    FAST_BLINK:3,
    FLASH:4
}

Pages = {
    TRAN:0,
    PRM:1,
    CTRL:2,
    CLIP:3
}

pages = ['TRAN', 'PRM', 'CTRL', 'CLIP']
current_page = 0

buttons = [44,52,60,68,76,40,48,56,64,72]
state = [0,0,0,0,0,0,0,0,0,0]
state_fine = [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
]

pressure = [
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0,
]



param_values = [0,0,0,0,0,0,0,0]

ledstates=[
    [[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],
     [Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF],[Color.GREEN,Led.OFF]],
    [[Color.GREEN,Led.ON],[Color.GREEN,Led.ON],[Color.GREEN,Led.ON],[Color.GREEN,Led.ON],[Color.YELLOW,Led.ON],
     [Color.GREEN,Led.ON],[Color.GREEN,Led.ON],[Color.GREEN,Led.ON],[Color.GREEN,Led.ON],[Color.YELLOW,Led.ON]],
    [[Color.RED,Led.ON],[Color.RED,Led.ON],[Color.RED,Led.ON],[Color.RED,Led.ON],[Color.RED,Led.ON],
     [Color.RED,Led.ON],[Color.RED,Led.ON],[Color.RED,Led.ON],[Color.RED,Led.ON],[Color.RED,Led.ON]],
    [[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],
     [Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON],[Color.YELLOW,Led.ON]],
]

function init() {
    host.getMidiInPort(0).setMidiCallback(onMidi);
    notificationSettings = host.getNotificationSettings();
    notificationSettings.setShouldShowTrackSelectionNotifications(true);
    notificationSettings.setShouldShowChannelSelectionNotifications(true);

    generic = host.getMidiInPort(0).createNoteInput("Softstep", "91????","81????");
    generic.setShouldConsumeEvents(true);
    out = host.getMidiOutPort(0)

    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 04 01 00 00 00 00 00 00 00 2f 7e 00 00 00 00 02 f7") //Standalone
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 03 00 00 00 00 00 00 00 00 50 07 00 00 00 00 00 f7"); // Tether
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 04 00 05 08 25 01 20 00 00 7b 2c 00 00 00 0c f7") // backlight

    cursorTrack = host.createCursorTrack(1, 1);
    primaryDevice = cursorTrack.createCursorDevice()
    primaryDevice.exists().markInterested();
    remoteControls = primaryDevice.createCursorRemoteControlsPage(8);
    
    userControls = host.createUserControlsSection(10);
    for( var b = 0; b<10; b++) {
        userControls.getControl(b).setLabel("Pad " + (b+1));
    }
    
    
    for( var i=0; i<8; i++) {
       remoteControls.getParameter( i ).value().addValueObserver(128,getValueObserver( i ));
    }

    transport = host.createTransportSection();

    transport.addIsPlayingObserver( function(value) {
        if (value) {
            println("playing");
            led(Pages.TRAN,0,Color.RED,Led.OFF);
            led(Pages.TRAN,1,Color.GREEN,Led.ON);
        } else {
            println("stoped");
            led(Pages.TRAN,0,Color.RED,Led.ON);
            led(Pages.TRAN,1,Color.GREEN,Led.OFF);
        } 
    })

    transport.addIsRecordingObserver(function(on) {
        led(Pages.TRAN,2,Color.RED, on ? Led.ON : Led.OFF );
    })

    transport.addClickObserver(function(on) {
        led(Pages.TRAN,5,Color.YELLOW, on ? Led.ON : Led.OFF );
    });

    transport.addIsLoopActiveObserver(function(on) {
        led(Pages.TRAN,6,Color.GREEN, on ? Led.ON : Led.OFF );
    });

    transport.addIsWritingArrangerAutomationObserver(function(on) {
        led(Pages.TRAN,7,Color.YELLOW, on ? Led.ON : Led.OFF );
    });

    transport.addOverdubObserver(function(on) {
        led(Pages.TRAN,8,Color.RED, on ? Led.ON : Led.OFF );
    });

    transport.addLauncherOverdubObserver(function(on) {
        led(Pages.TRAN,9,Color.RED, on ? Led.ON : Led.OFF );
    });

    trackBank = host.createMainTrackBank(1, 0, 9);
    track = trackBank.getTrack(0);
    slotBank = track.getClipLauncherSlots()
    slotBank.addHasContentObserver(function(idx, value) {
        led(Pages.CLIP, idx, Color.GREEN, value ? Led.ON : Led.OFF );
    });
    display(pages[current_page])
    updateLeds();
}

function exit() {
    
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 04 00 05 08 25 00 20 00 00 4c 1c 00 00 00 0c f7"); // backlight
    display("   ");
    resetLeds();

    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 04 00 00 00 00 00 00 00 00 17 1f 00 00 00 00 00 f7"); // standalone
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 03 01 00 00 00 00 00 00 00 68 66 00 00 00 00 00 f7"); // tether
}

function onMidi(status, data1, data2) {
//    printMidi(status, data1, data2);
    
    change = [0,0,0,0,0,0,0,0,0,0];
    change_fine = [
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
    ]

    if ( status == 176 && data1 == 80 && data2 == 0 ) {
        setPage(current_page - 1)
    }
    if ( status == 176 && data1 == 81 && data2 == 0 ) {
        setPage(current_page + 1)
    }

    for (var b=0; b<10; b++) {
        for( var i=0; i<4; i++) {
            if ( status == 176 && data1 == buttons[b]+i) {
                pressure[4*b+i]=data2;
            }

            if ( status == 176 && data1 == buttons[b]+i && data2 >= 20 ) {
                if ( state[b] == 0 ) {
                    state[b] = buttons[b]+i;
//                    println( "button " + b + " pressed");
                    change[b]=1
                }
                if (state_fine[4*b+i] == 0 ) {
                    state_fine[4*b+i] = 4*b+i
//                    println( "button " + b + " sub " + i + " pressed");
                    change_fine[4*b+i] = 1;
                }
            }
            if ( status == 176 && data1 == buttons[b]+i  && data2 < 10 ) {
                if ( state[b] == buttons[b]+i ) {
                    state[b] = 0;
//                    println( "button " + b + " released");
                    change[b]=-1
                }
                if (state_fine[4*b+i] == 4*b+i) {
                    state_fine[4*b+i] = 0;
//                    println( "button " + b + " sub " + i + " released");
                    change_fine[4*b+i] = -1;
                }
            }
        }
    }


    if (current_page == Pages.TRAN ) {
        if ( change[0]==-1 ) {
            transport.stop();
        }
        if ( change[1]==-1) {
            transport.play();
        }
        if ( change[2]==-1) {
            transport.record();
        }
        if ( change[3]==-1) {
            transport.tapTempo();
        }
        if (change[4] == -1) {
            if (primaryDevice.exists().get()) {
                primaryDevice.browseToReplaceDevice();
            } else {
                cursorTrack.browseToInsertAtStartOfChain();
            }
        }
        if (change[5] == -1 ) {
            transport.toggleClick();
        }
        if (change[6] == -1 ) {
            transport.toggleLoop();
        }
        if (change[7] == -1 ) {
            transport.toggleWriteArrangerAutomation();
        }
        if (change[8] == -1 ) {
            transport.toggleOverdub();
        }
        if (change[9] == -1 ) {
            transport.toggleLauncherOverdub();
        }

    } else if (current_page == Pages.PRM ) {
        pi = [5,6,7,8,0,1,2,3] 
        for (var i=0; i<8; i++) {
            idx = pi[i]
            if (change_fine[4*idx] == -1) {
                changeValue(i,+10);
            } 
            if (change_fine[4*idx+1] == -1) {
                changeValue(i,+1);
            } 
            if (change_fine[4*idx+2] == -1) {
                changeValue(i,-1);
            } 
            if (change_fine[4*idx+3] == -1) {
                changeValue(i,-10);
            } 
        }

        if (change_fine[4*9+1] == -1) {
            remoteControls.selectNext();
        }
        if (change_fine[4*9+2] == -1) {
            remoteControls.selectPrevious();
        }
        if (change_fine[4*4+1] == -1) {
            primaryDevice.selectNext();
            primaryDevice.selectInEditor();
        }
        if (change_fine[4*4+2] == -1) {
            primaryDevice.selectPrevious();
            primaryDevice.selectInEditor();
        }
    } else if (current_page == Pages.CTRL ) {
        // map pressure to cotroller
        for (var x=0; x<10; x++) {
            v = 0;
            for( var i=0; i<4; i++) {
                v = v > pressure[4*x+i] ? v : pressure[4*x+i];
            }
            if (v > 0) {
                println( "control " + x + " " + v);
                userControls.getControl(x).set(v, 64);
            }
        }
    } else if (current_page == Pages.CLIP ) {
        for (var i=0; i<9; i++) {
            if (change[i] == -1 ) {
                slotBank.launch(i);
            } 
        }

        if (change_fine[4*9+1] == -1) {
            trackBank.scrollForwards();
            track.selectInMixer();
        }
        if (change_fine[4*9+2] == -1) {
            trackBank.scrollBackwards();
            track.selectInMixer();
        }

        if (change_fine[4*9+3] == -1) {
            slotBank.stop()
        }
    }
}

function setPage(m) {
    println("set page "+ m);
    if ( m < 0 ) {
        current_page = pages.length-1;
    } else if ( m > pages.length-1) {
        current_page = 0;
    } else {
        current_page = m
    }
    display(pages[current_page]);
    updateLeds();
    host.showPopupNotification( pages[current_page]);
}


function led(page, number, color, mode ) {
    ledstates[page][number] = [color,mode];
    if (page == current_page) {
        for( var c=0; c<3; c++) {
            setLed(number,c,Led.OFF);
        }
        setLed(number, color, mode);    
    }
}

/**
 * Sets led number <led> (numbered from 1 to 10) to given color and mode
 */
function setLed(number, color, mode) {
    out.sendMidi(0xB0,40,number) // select led, numbered from 0
    out.sendMidi(0xB0,41,color) // green = 0, red = 1, yellow = 2
    out.sendMidi(0xB0,42,mode) // range(x) = (off, on, blink, fast, flash)
    out.sendMidi(0xB0,0,0)
    out.sendMidi(0xB0,0,0)
    out.sendMidi(0xB0,0,0)
}

/**
 * Switch all leds off
 */
function resetLeds() {
    for( var l= 0; l<10; l++) {
        for( var c=0; c<3; c++) {
            setLed(l,c,Led.OFF);
        }
    }
}

function updateLeds() {
    ls = ledstates[current_page];
    for( var l= 0; l<10; l++) {
        for( var c=0; c<3; c++) {
            setLed(l,c,Led.OFF);
        }
        setLed(l,ls[l][0],ls[l][1]);
    }
}

/**
 * Sets the text on the device's display. The text gets truncated to 4 chars
 */
function display(text) {
    for( var i=0; i<4; i++) {
        var cc = i < text.length ? text.charCodeAt(i) : 0x20;
        out.sendMidi(176,50+i,cc);
    }
}

function changeValue(p,v) {
    param_values[p] += v
    if (param_values[p] < 0) { param_values[p] = 0; }
    if (param_values[p] > 127) { param_values[p] = 127; }
    println( "set value " + p + " to " + param_values[p]);
    remoteControls.getParameter( p ).value().set(param_values[p], 128);
}

function getValueObserver( i ) {
    return function( value ) {
        param_values[i] = value
    }
}

