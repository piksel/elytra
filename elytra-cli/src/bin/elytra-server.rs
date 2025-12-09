#![feature(macro_metavar_expr)]

use std::{env::args, path::PathBuf, str::FromStr};

use color_eyre::eyre::OptionExt;
use elytra_cli::ElytraDevice;
use elytra_cli::wasm::WasmDevice;
use elytra_cli::tcp::TcpServer;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    eprintln!("elytra mock impl server");

    let file_path = args().skip(1).next().map(|s|  PathBuf::from_str(&s).unwrap())
        .ok_or_eyre("Missing argument FILE")?;

    let mut device = WasmDevice::new(&file_path)?;

    let mut server = TcpServer::new()?;
    loop {
        eprint!("Waiting for connection... ");
        let bytes = server.recieve()?;
        eprintln!("Recieved: {:02x?}", bytes);
        let bytes = device.send_command_raw(bytes.try_into().unwrap())?;
        eprintln!("Response: {:02x?}", bytes);
        server.respond(&bytes)?;
        eprintln!();
    }
}
