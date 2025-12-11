use std::{cell::Cell, error::Error, fs::File, io::{Read, Write}, path::Path};
use log::debug;

use color_eyre::eyre::eyre;

#[cfg(feature = "wasmtime")]
use wasmtime::*;

#[cfg(feature = "wasmi")]
use wasmi::*;

use crate::ElytraDevice;

pub struct WasmDevice {
    instance: Instance,
    store: Store<HostState>,
    log: Cell<Vec<([u8; 64], [u8; 64])>>
}

type HostState = u32;

type Message = (u64, u64, u64, u64, u64, u64, u64, u64);

fn pack64(value: [u8; 64]) -> Message {
    let mut buf = [0u64; 8];
    for (i, bytes) in value.chunks(8).enumerate() {
        buf[i] = u64::from_be_bytes(bytes.try_into().unwrap());
    }
    buf.into()
}

impl WasmDevice {
    pub fn new(file_path: &Path) -> Result<Self, Box<dyn Error>> {

        let engine = Engine::default();
        // Now we can compile the above Wasm module with the given Wasm source.

        let mut file = File::open(file_path)?;
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)?;
        let module = Module::new(&engine, bytes)?;

        for e in module.exports() {
            debug!("WASM Export {}: {:#?}", e.name(), e.ty());
        }

        let mut store = Store::new(&engine, 0);
        let linker = <Linker<HostState>>::new(&engine);


        #[cfg(feature = "wasmtime")]
        let instance = linker.instantiate(&mut store, &module)?;

        #[cfg(feature = "wasmi")]
        let instance = linker.instantiate_and_start(&mut store, &module)?;

        Ok(Self {
            instance, store, log: Cell::new(vec![])
        })
    }
}

impl ElytraDevice for WasmDevice {
    fn send_command_raw(&mut self, bytes: [u8; 64]) -> Result<[u8; 64], Box<dyn std::error::Error>> {
        let msg_in = pack64(bytes);
        let send_fn = self.instance.get_typed_func::<Message, u32>(&mut self.store, "send")
            .unwrap();
        let recieve_fn = self.instance.get_typed_func::<u32, u64>(&mut self.store, "recieve")
            .unwrap();
        

        let res_pack_count: u32 = send_fn.call(&mut self.store, msg_in)?;

        if res_pack_count == 0 {
            return Err(eyre!("Error response from WASM device"))?
        }

        let mut out_data = [0u8; 64];
        let mut cursor = out_data.as_mut_slice();
        for i in 0..res_pack_count {
            let packed = recieve_fn.call(&mut self.store, i)?;
            let _ = cursor.write(&packed.to_be_bytes())?;
        }
        
        Ok(out_data)
    }

    fn log_chat(&mut self, bytes_out: [u8; 64], bytes_in: [u8; 64]) {
        self.log.get_mut().push((bytes_out, bytes_in));
    }
    
    fn get_log(&mut self) -> Vec<([u8; 64], [u8; 64])> {
        self.log.replace(vec![])
    }
}