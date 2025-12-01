use core::prelude::rust_2024::{*};
use defmt::warn;

use crate::{
    entry::{Constraints, EntryDesc, EntryVariant},
    proto::MESSAGE_LENGTH,
    values::ValueType,
};

pub struct FieldValue {
    desc: &'static EntryDesc,
    data: [u8; MESSAGE_LENGTH],
}

impl FieldValue{
    pub const fn new(desc: &'static EntryDesc) -> Self {
        Self {
            desc,
            data: [0u8; MESSAGE_LENGTH]
        }
    }

    pub fn from_store(desc: &'static EntryDesc, bytes: [u8; MESSAGE_LENGTH]) -> Self {
        Self {
            desc,
            data: bytes
        }
    }

    pub fn from_message(desc: &'static EntryDesc, bytes: &[u8]) -> Self {
        let mut fv = Self {
            desc,
            data: [0u8; 64]
        };
        
        fv.data[0] = bytes.len() as u8;
        for i in 0..bytes.len() {
            fv.data[i + 1] = bytes[i]
        }
        fv.clamp();
        fv
    }

    pub fn into_store_bytes(self) -> [u8; MESSAGE_LENGTH] {
        self.data
    }

    pub fn into_message_bytes(mut self) -> [u8; MESSAGE_LENGTH] {
        if self.desc.variant == EntryVariant::Field(ValueType::Secret) {
            let max_len = MESSAGE_LENGTH.min(self.data[0] as usize);
            for i in 1..max_len {
                self.data[i] = '*' as u8;
            }
        }
        self.data[0] = 1;
        self.data
    }

    pub fn with_integer(mut self, value: i64) -> Self {
        self.set_integer(value);
        self
    }

    pub fn get_integer(&self) -> i64 {
        let value_bytes = self.data[1..=8].try_into().unwrap();
        i64::from_le_bytes(value_bytes)
    }

    pub fn set_integer(&mut self, value: i64) {
        let value_bytes = if let Constraints::Range(range) = &self.desc.constraints {
            value.clamp(range.start as i64, range.end as i64) 
        } else { 
            value 
        }.to_le_bytes();
        for i in 0..8 {
            self.data[i + 1] = value_bytes[i];
        }
    }

    pub fn get_option(&self) -> u64 {
        let value_bytes = self.data[1..=8].try_into().unwrap();
        u64::from_le_bytes(value_bytes)
    }

    pub fn set_option(&mut self, value: u64) {
        let Constraints::Values(values) = self.desc.constraints else {
            panic!("option has not values")
        };
        let value_bytes = value.clamp(0, values.len() as u64 - 1).to_le_bytes();
        for i in 0..8 {
            self.data[i + 1] = value_bytes[i];
        }
    }

    #[cfg(feature = "alloc")]
    pub fn get_text(&self) -> String {
        let end = self.data.iter().position(|&b| b == 0).unwrap_or(self.data.len());
        String::from_utf8_lossy(&self.data[1..end]).to_string()
    }

    #[cfg(not(feature = "alloc"))]
    pub fn get_text(&self) -> &str {
        use core::str;

        let end = self.data.iter().position(|&b| b == 0).unwrap_or(self.data.len());
        str::from_utf8(&self.data[1..end]).unwrap_or_default()
    }

    pub fn set_text(&mut self, value: &str) {
        let max_len = match &self.desc.constraints {
            Constraints::Range(range) => range.end as usize,
            _ => value.len(),
        };
        let max_len = value.floor_char_boundary(max_len);
        let value = if value.len() != max_len {
            &value[0..max_len]
        } else {value};
        let value_bytes = value.as_bytes();
        for i in 0..value_bytes.len() {
            self.data[i + 1] = value_bytes[i];
        }
    }

    pub fn clamp(&mut self) {
        match self.desc.variant {
            EntryVariant::Field(field_type) => match field_type {
                ValueType::Integer => {
                    self.set_integer(self.get_integer());
                },
                ValueType::Text => {
                    #[cfg(feature = "alloc")]
                    self.set_text(self.get_text());
                },
                ValueType::Secret => {
                    #[cfg(feature = "alloc")]
                    self.set_text(&self.get_text());
                },
                ValueType::Status => {},
                ValueType::Bytes => {},
                ValueType::Option => {
                    // self.set_option(self.get_option());
                }
            },
            _ => {
                warn!("tried to clamp entity variant {}", self.desc.variant)
            }
        }
    }
}