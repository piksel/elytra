use std::{cell::Cell, io::{Read, Write}, net::{SocketAddr, TcpListener, TcpStream, ToSocketAddrs}};

use crate::ElytraDevice;

pub struct TcpDevice {
    addrs: Vec<SocketAddr>,
    log: Cell<Vec<([u8; 64], [u8; 64])>>
}

impl TcpDevice {
    pub fn new<A: ToSocketAddrs>(addr: A) -> std::io::Result<Self> {
        Ok(Self{ 
            log: Cell::new(vec![]), 
            addrs: addr.to_socket_addrs()?.collect() 
        })
    }
}

impl ElytraDevice for TcpDevice {
    fn send_command_raw(&mut self, bytes: [u8; 64]) -> Result<[u8; 64], Box<dyn std::error::Error>> {
        let mut stream = TcpStream::connect(self.addrs.as_slice())?;

        stream.write_all(&bytes)?;

        let mut in_bytes = [0u8; 64];
        stream.read_exact(&mut in_bytes)?;

        Ok(in_bytes)
    }
    
    fn log_chat(&mut self, bytes_out: [u8; 64], bytes_in: [u8; 64]) {
        self.log.get_mut().push((bytes_out, bytes_in));
    }
    
    fn get_log(&mut self) -> Vec<([u8; 64], [u8; 64])> {
        self.log.replace(vec![])
    }

}

pub struct TcpServer {
    listener: TcpListener,
    stream: Option<TcpStream>,
    read_buf: [u8; 64],
}

impl TcpServer {
    pub fn new() -> std::io::Result<Self> {
        let listener: TcpListener = TcpListener::bind("localhost:48000")?; 
        Ok(Self{
            listener,
            stream: None,
            read_buf: [0u8; 64],
        })
    }

    pub fn recieve(&mut self) -> std::io::Result<&[u8]> {
        let (mut stream, _) = self.listener.accept()?;
        eprintln!("Got connection from {:?}", stream.peer_addr()?);
        stream.read(self.read_buf.as_mut_slice())?;
        self.stream = Some(stream);
        Ok(&self.read_buf)
    }

    pub fn respond(&mut self, bytes: &[u8]) -> std::io::Result<()> {
        let Some(mut stream) = self.stream.as_ref() else {
            return Err(std::io::Error::other("no current stream"));
        };
        stream.write(bytes)?;    
        stream.flush()?;
        self.stream = None;
        Ok(())
    }
}