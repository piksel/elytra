use core::prelude::rust_2024::{*};

use num_enum::{TryFromPrimitive};

#[repr(u8)]
#[derive(Copy, Clone, Debug, Eq, PartialEq, strum::Display, TryFromPrimitive)]
#[cfg_attr(feature = "defmt", derive(defmt::Format))]
pub enum ValueType {
    Text = 't' as u8,
    Secret = 's' as u8,
    Integer = 'i' as u8,
    Status = 'c' as u8,
    Bytes = 'b' as u8,
    Options = 'o' as u8,
    Toggle = 'x' as u8
}
impl ValueType {
    pub(crate) fn is_options(&self) -> bool {
        match self {
            Self::Options => true,
            _ => false
        }
    }
}

#[derive(Clone, Debug)]
#[cfg_attr(feature = "defmt", derive(defmt::Format))]
pub enum DefaultValue {
    Empty,
    Text(&'static str),
    Integer(i64),
    Options(&'static [u16]),
    Bytes(&'static [u8]),
    Enabled(bool)
}

impl From<&'static str> for DefaultValue {
    fn from(value: &'static str) -> Self {
        Self::Text(value)
    }
}

impl From<i64> for DefaultValue {
    fn from(value: i64) -> Self {
        Self::Integer(value)
    }
}

impl From<&'static [u8]> for DefaultValue {
    fn from(value: &'static [u8]) -> Self {
        Self::Bytes(value)
    }
}