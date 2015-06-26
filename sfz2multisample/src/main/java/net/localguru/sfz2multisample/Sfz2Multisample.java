package net.localguru.sfz2multisample;
import java.io.*;
import java.util.*;
import java.util.zip.*;
import java.util.StringTokenizer;
import javax.sound.sampled.*;
import javax.sound.sampled.spi.*;

public class Sfz2Multisample {
    public static void main( String args[] ) {
        Sfz2Multisample main = new Sfz2Multisample();

        String sfz_name = args[0];
        String multi_name =  sfz_name.replace("sfz", "multisample");
        String sfz = main.loadSfz( sfz_name );
        System.out.println( sfz_name );

//        System.out.println( sfz );

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"+
            "<multisample name=\""+sfz_name+"\">\n" +
            "<generator>Bitwig Studio</generator>\n" +
            "<category></category>\n"+
            "<creator>SFZ2Multisample</creator>\n"+
            "<description/>\n"+
            "<keywords/>\n"+
            "<layer name=\"Default\">\n";

        StringTokenizer tok = new StringTokenizer( sfz, "<[^>]*>" );
        List<String> sampleNames = new ArrayList<String>();
        String default_path="";

          String mode = "";
          while ( tok.hasMoreTokens()) {
            String res = tok.nextToken();
            if ( "region".equals( res ) || "group".equals( res ) || "control".equals( res )) {
                mode = res;
                continue;
            }
            String[] tmp =  res.trim().split(" ");
            Map<String,String> attributes = new HashMap<String,String>();
            String sample = "" ;
            boolean s =false;
            String key = "";
            for ( String t : tmp ) {
                if ( t.indexOf("=") == -1  && s ) {
                    sample += t + " ";
                    continue;
                }
//                System.out.println( "T: " + t );
                String[] data = t.split("=");
                if (data[0].trim().equals("")) continue;
                key = data[0]; 
                if (!data[0].trim().equals( "sample") && !data[0].trim().equals("default_path")) {
                    attributes.put(data[0].trim(), data[1].trim());
                } else { 
                    sample = data[1].trim() + " ";
                    s = true;
                }
            }
            if ( "default_path".equals( key )) {
                default_path = sample.trim();
                System.out.println( "DP: " + default_path ); 
            }
            if ( default_path != null && !"".equals( default_path )) {
                sample = default_path + sample;
            }
            sample = sample.trim().replace("\\","/");
            if ( "sample".equals(key)) {
                attributes.put( "sample", sample);
                sampleNames.add( sample);
            }
        
            if ( attributes.get("key") != null ) {
                String k = attributes.get("key");
                attributes.put("hikey", k);
                attributes.put("lokey", k);
                attributes.put("pitch_keycenter", k);

            }

            if ( mode.equals( "region" )) {
                if ( attributes.get("sample") == null ) {
                    attributes.put( "sample", sample);
                    sampleNames.add( sample);
                }
                float end = 1000F;
                try {
                    System.out.println( "Sample: " + attributes.get("sample"));
                    AudioInputStream audioInputStream = AudioSystem.getAudioInputStream(new File(sample));
                    long len = audioInputStream.getFrameLength();
                    AudioFormat format = audioInputStream.getFormat();
                    float fr = format.getFrameRate();
                    end = len;

                } catch ( Exception e ) {
                    e.printStackTrace();
                }
                String[] parts = sample.split("/");

                xml+="<sample file=\""+parts[ parts.length-1].trim()+"\" gain=\"0.000\" sample-start=\"0.000\" sample-stop=\""+end+"\" tune=\"0.0\">\n";
                xml+="<key high=\""+attributes.get("hikey")+"\" low=\""+attributes.get("lokey")+"\" root=\""+attributes.get("pitch_keycenter")+"\" track=\"true\"/>\n";
                xml+="<velocity/>\n"; 
                xml+="<loop/>\n";
                xml+="</sample>\n";
            }
        }
        xml+="</layer>\n";
        xml+="</multisample>\n";

        List<String> sampleNamesSeen = new ArrayList<String>();

        try {
            ZipOutputStream result = new ZipOutputStream( new BufferedOutputStream( new FileOutputStream( multi_name )));
            for ( String name: sampleNames ) {
                if ( sampleNamesSeen.contains( name )) { 
                    continue;
                }
                sampleNamesSeen.add( name );
                try { 
                    BufferedInputStream fis = new BufferedInputStream( new FileInputStream( name ), 4096);
                    String[] parts = name.split("/");
                    System.out.println(name); 
                    result.putNextEntry( new ZipEntry( parts[ parts.length-1]));
                    int count = 0;
                    byte[] data = new byte[4096];
                    while((count=fis.read( data, 0, 4096 )) != -1 ) {
                        result.write( data,0,count);
                    }
                    fis.close();
                } catch ( Exception e ) {
                    e.printStackTrace();
                }
            }

            result.putNextEntry( new ZipEntry( "multisample.xml"));
            byte[] data = xml.getBytes( "UTF-8");

            result.write( data, 0, data.length);


            result.close();
        } catch ( Exception ioe ) {
            ioe.printStackTrace();
        }




    }

    public String loadSfz( String filename ) {
        StringBuilder b = new StringBuilder();
        try { 
            BufferedReader reader = new BufferedReader( new InputStreamReader( new FileInputStream( filename )));
            String l = null;
            while ((l = reader.readLine()) != null ) {
                String content[] = l.split("//");
                if ( content.length > 0 ) {
                    System.out.println( content[0] );
                    b.append(content[0]);
                    b.append(" ");
                }
            }
            reader.close();
        } catch ( IOException ioe ) {
            ioe.printStackTrace();
        }
        return b.toString();
    }


}
