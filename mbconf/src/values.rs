use core::prelude::rust_2024::{*};
use defmt::Format;

#[repr(u8)]
#[derive(Copy, Clone, Debug, Format, Eq, PartialEq)]
pub enum ValueType {
    Text = 't' as u8,
    Secret = 's' as u8,
    Integer = 'i' as u8,
    Status = 'c' as u8,
    Bytes = 'b' as u8,
    Option = 'o' as u8
}