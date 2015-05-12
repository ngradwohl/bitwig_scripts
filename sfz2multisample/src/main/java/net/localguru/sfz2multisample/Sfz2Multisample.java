package net.localguru.sfz2multisample;
import java.io.*;
import java.util.*;
import java.util.zip.*;
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
            "    <generator>Bitwig Studio</generator>\n" +
            "    <category>Organ</category>\n"+
            "    <creator>guru</creator>\n"+
            "    <description/>\n"+
            "    <keywords/>\n"+
            "  <layer name=\"Default\">\n";

        String[] regions = sfz.split( "<region>");
        List<String> sampleNames = new ArrayList<String>();
        for ( String region : regions ) {
            System.out.println( region );
            if (region.trim().startsWith( "<group>")) continue;
            if (region.trim().equals("")) continue;
            String[] tmp =  region.trim().split(" ");
            Map<String,String> attributes = new HashMap<String,String>();
            String sample = "" ;
            boolean s =false;
            for ( String t : tmp ) {
                if ( s ) {
                    sample += t + " ";
                    continue;
                } 
                System.out.println( "T: " + t );
                String[] data = t.split("=");
                if (data[0].trim().equals("")) continue;
                if (!data[0].trim().equals( "sample")) {
                    attributes.put(data[0].trim(), data[1].trim());
                } else { 
                    sample = data[1].trim() + " ";
                    s = true;
                }
            }
            sample = sample.trim().replace("\\","/");

            attributes.put( "sample", sample);
            sampleNames.add( sample);
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
        xml+="</layer>\n";
        xml+="</multisample>\n";

        try {
        
            ZipOutputStream result = new ZipOutputStream( new BufferedOutputStream( new FileOutputStream( multi_name )));
            for ( String name: sampleNames ) {
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
                b.append(content[0]);
                b.append(" ");
            }
            reader.close();
        } catch ( IOException ioe ) {
            ioe.printStackTrace();
        }
        return b.toString();
    }


}
