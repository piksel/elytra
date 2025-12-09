
use tokio::net::{TcpListener, TcpStream};
use std::io::{Error, ErrorKind, Result};

pub struct TcpServer {
    listener: TcpListener,
    stream: Option<TcpStream>,
    read_buf: [u8; 64],
}

impl TcpServer {
    pub async fn new() -> std::io::Result<Self> {
        let listener: TcpListener = TcpListener::bind("localhost:48000").await?; 
        Ok(Self{
            listener,
            stream: None,
            read_buf: [0u8; 64],
        })
    }

    pub async fn recieve(&mut self) -> std::io::Result<&[u8]> {
        let (stream, _) = self.listener.accept().await?;
        eprintln!("Got connection from {:?}", stream.peer_addr()?);
        loop {
            // Wait for the socket to be readable
            stream.readable().await?;

            // Creating the buffer **after** the `await` prevents it from
            // being stored in the async task.
            // let mut buf = [0; 4096];

            // Try to read data, this may still fail with `WouldBlock`
            // if the readiness event is a false positive.
            match stream.try_read(&mut self.read_buf) {
                Ok(0) => break,
                Ok(n) => {
                    println!("read {} bytes", n);
                    break;
                }
                Err(ref e) if e.kind() == ErrorKind::WouldBlock => {
                    continue;
                }
                Err(e) => {
                    return Err(e.into());
                }
            }
        }
        self.stream = Some(stream);
        Ok(&self.read_buf)
    }

    pub async fn respond(&mut self, bytes: &[u8]) -> Result<()> {
        let Some(stream) = self.stream.as_ref() else {
            return Err(Error::other("no current stream"));
        };
        loop {
            // Wait for the socket to be writable
            stream.writable().await?;

            // Try to write data, this may still fail with `WouldBlock`
            // if the readiness event is a false positive.
            match stream.try_write(bytes) {
                Ok(_) => {
                    break;
                }
                Err(ref e) if e.kind() == ErrorKind::WouldBlock => {
                    continue;
                }
                Err(e) => {
                    return Err(e.into());
                }
            }
        }
        
        self.stream = None;
        Ok(())
    }
}