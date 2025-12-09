use elytra_conf::{FieldValue, command::{CommandError, CommandHandler}};

use crate::{Action, ConfigField, InfoField, PROTO};

pub struct MockHandler;

impl MockHandler {
    pub const fn new() -> Self {
        Self{}
    }
}

impl CommandHandler<ConfigField, InfoField, Action> for MockHandler {
    async fn noop(&mut self) {
        eprintln!("CMD: noop")
    }

    async fn read_config(&mut self, config_field: ConfigField) 
        -> Result<FieldValue, CommandError> {
       eprintln!("CMD: read_config: {:?}", config_field);
       Ok(FieldValue::from_store(PROTO.config_field(config_field), [0u8; 64]))
    }

    async fn write_config(&mut self, config_field: ConfigField, value: FieldValue) 
        -> Result<(), CommandError> {
       eprintln!("CMD: write_config: {:?}", config_field);
       eprintln!(" => {:x?}", value);
       Ok(())
    }

    async fn read_info(&mut self, info_field: InfoField) 
        -> Result<FieldValue, CommandError>  {
       eprintln!("CMD: read_info: {:?}", info_field);
       Ok(FieldValue::from_store(PROTO.info_field(info_field), [0u8; 64]))
    }

    async fn write_info(&mut self, info_field: InfoField, value: FieldValue) 
        -> Result<(), CommandError>  {
       eprintln!("CMD: write_info {:?}", info_field);
       eprintln!(" => {:x?}", value);
       Ok(())
    }

    async fn do_action(&mut self, action: Action)
        -> Result<(), CommandError> {
       eprintln!("CMD: action: {:?}", action);
       Ok(())
    }
}