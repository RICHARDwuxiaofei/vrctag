// SPDX-License-Identifier: MIT
// Copyright (c) 2026 RICHARDwuxiaofei
// Optional audit with the installed JDK; official schemas stay unmodified.
import java.nio.file.*;import java.io.*;import java.util.zip.*;import javax.xml.XMLConstants;import javax.xml.validation.*;import javax.xml.transform.stream.StreamSource;import org.w3c.dom.ls.*;import org.w3c.dom.bootstrap.DOMImplementationRegistry;
class Validate3MF {
 public static void main(String[]args)throws Exception{
  SchemaFactory factory=SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
  factory.setProperty(XMLConstants.ACCESS_EXTERNAL_DTD,"");factory.setProperty(XMLConstants.ACCESS_EXTERNAL_SCHEMA,"file");
  var impl=(DOMImplementationLS)DOMImplementationRegistry.newInstance().getDOMImplementation("LS");
  factory.setResourceResolver((type,ns,pub,system,base)->{if(!"http://www.w3.org/XML/1998/namespace".equals(ns))return null;LSInput in=impl.createLSInput();try{in.setByteStream(new FileInputStream(args[1]));in.setSystemId(Path.of(args[1]).toUri().toString());return in;}catch(Exception e){throw new RuntimeException(e);}});
  Schema schema=factory.newSchema(Path.of(args[0]).toFile());int failures=0;
  try(var paths=Files.list(Path.of(args[2]))){for(Path p:paths.filter(x->x.toString().endsWith(".3mf")).sorted().toList()){
   try(ZipFile zip=new ZipFile(p.toFile());InputStream in=zip.getInputStream(zip.getEntry("3D/3dmodel.model"))){schema.newValidator().validate(new StreamSource(in));System.out.println(p.getFileName()+"\tPASS");}catch(Exception e){failures++;System.out.println(p.getFileName()+"\tFAIL\t"+e.getMessage());}
  }}if(failures>0)System.exit(1);
 }
}
