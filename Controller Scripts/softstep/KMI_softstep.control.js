loadAPI(2);

host.defineController("Keith McMillen", "Softstep 2", "1.0", "dd426d62-43f4-4f42-a3cc-2255086109c7");

host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["SSCOM MIDI 1"], ["SSCOM MIDI 1"]);
GREEN = 0
RED = 1
YELLOW = 2

OFF = 0
ON = 1
BLINK = 2
FAST_BLINK = 3
FLASH = 4

TRAN=0
PRM=1
CTRL=2
CLIP=3

pages = ['TRAN', 'PRM', 'CTRL', 'CLIP']
current_page = 0

buttons = [44,52,60,68,76,40,48,56,64,72]
state = [0,0,0,0,0,0,0,0,0,0]

ledstates=[
    [[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF],[GREEN,OFF]],
    [[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON],[GREEN,ON]],
    [[RED,ON],[RED,ON],[RED,ON],[RED,ON],[RED,ON],[RED,ON],[RED,ON],[RED,ON],[RED,ON],[RED,ON]],
    [[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON],[YELLOW,ON]],
]

function init() {
    host.getMidiInPort(0).setMidiCallback(onMidi);
    notificationSettings = host.getNotificationSettings();
    notificationSettings.setShouldShowTrackSelectionNotifications(true);
    notificationSettings.setShouldShowChannelSelectionNotifications(true);

    generic = host.getMidiInPort(0).createNoteInput("Softstep", "91????","81????");
    generic.setShouldConsumeEvents(false);
    out = host.getMidiOutPort(0)

    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 04 01 00 00 00 00 00 00 00 2f 7e 00 00 00 00 02 f7") //Standalone
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 03 00 00 00 00 00 00 00 00 50 07 00 00 00 00 00 f7"); // Tether
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 04 00 05 08 25 01 20 00 00 7b 2c 00 00 00 0c f7") // backlight

    transport = host.createTransportSection();
    trackBank = host.createMainTrackBank(5, 0, 1);

    transport.addIsPlayingObserver( function(value) {
        if (value) {
            println("playing");
            led(TRAN,0,RED,OFF);
            led(TRAN,1,GREEN,ON);
        } else {
            println("stoped");
            led(TRAN,0,RED,ON);
            led(TRAN,1,GREEN,OFF);
        } 
    })

    transport.addClickObserver(function(on) {
        led(TRAN,2,YELLOW, on ? ON : OFF );
    });



    for(var p=0; p<5; p++) {
        var track = trackBank.getTrack(p);
        track.getClipLauncher().setIndication(true);
    }

    display(pages[current_page])
    updateLeds();

}

function exit() {
    resetLeds();
    display("   ");
    // standalone
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 04 00 00 00 00 00 00 00 00 17 1f 00 00 00 00 00 f7")
    // tether
    
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 09 00 0b 2b 3a 00 10 03 01 00 00 00 00 00 00 00 68 66 00 00 00 00 00 f7");
    // backlight
    out.sendSysex("f0 00 1b 48 7a 01 00 00 00 00 00 00 00 00 00 00 00 01 00 04 00 05 08 25 00 20 00 00 4c 1c 00 00 00 0c f7")


}

function onMidi(status, data1, data2) {
//    printMidi(status, data1, data2);
    
    change = [0,0,0,0,0,0,0,0,0,0];

    if ( status == 176 && data1 == 80 && data2 == 0 ) {
        setPage(current_page - 1)
    }
    if ( status == 176 && data1 == 81 && data2 == 0 ) {
        setPage(current_page + 1)
    }

    for (var b=0; b<10; b++) {
        for( var i=0; i<4; i++) {
            if ( status == 176 && data1 == buttons[b]+i && data2 >= 20 ) {
                if ( state[b] == 0 ) {
                    state[b] = buttons[b]+i;
                    println( "button " + b + " pressed");
                    change[b]=1
                }
            }
            if ( status == 176 && data1 == buttons[b]+i  && data2 < 10 ) {
                if ( state[b] == buttons[b]+i ) {
                    state[b] = 0;
                    println( "button " + b + " released");
                    change[b]=-1
                }
            }
        }
    }


    if (current_page == TRAN ) {
        if ( change[0]==-1 ) {
            transport.stop();
        }
        if ( change[1]==-1) {
            transport.play();
        }
        if (change[2] == -1 ) {
            transport.toggleClick();
        }

    } else if (current_page == PRM ) {
        for (var i=0; i<10; i++) {
            if ( change[i] == 1 ) {
                println( " led " + i + " on");
                led(PRM,i,RED,ON);
            } else if ( change[i] == -1 ) {
                led(PRM,i,RED,OFF);
            }
        }
    } else if (current_page == CTRL ) {
    } else if (current_page == CLIP ) {
    }
}

function setPage(m) {
    println("set page "+ m);
    if ( m < 0 ) {
        current_page = 0;
    } else if ( m > pages.length-1) {
        current_page = pages.length-1;
    } else {
        current_page = m
    }
    display(pages[current_page]);
    updateLeds();
}


function led(page, number, color, mode ) {
    ledstates[page][number] = [color,mode];
    if (page == current_page) {
        for( var c=0; c<3; c++) {
            setLed(number,c,OFF);
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
            setLed(l,c,OFF);
        }
    }
}
function updateLeds() {
    ls = ledstates[current_page];
    for( var l= 0; l<10; l++) {
        for( var c=0; c<3; c++) {
            setLed(l,c,OFF);
        }
        setLed(l,ls[l][0],ls[l][1]);
    }
}



/**
 * Sets the text on the device's display. The text gets truncated to 4 chars
 */
function display(text) {
    // We want exctly 4 chars in the string
    //text = text[:4]
    //text = text + (' ' * (4-len(text)))

    //# Now send to the device
    //for n, c in enumerate(text):
    //    softstep.write_short(176,50+n,ord(c))
    for( var i=0; i<4; i++) {
        var cc = i < text.length ? text.charCodeAt(i) : 0x20;
        out.sendMidi(176,50+i,cc);
    }
}

