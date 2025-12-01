use core::prelude::rust_2024::{*};
use defmt::Format;

pub trait ActionIndex: Sized + Copy + Eq + Format {
    fn as_index(self) -> usize;
    fn from_byte(byte: u8) -> Option<Self>;
}

pub trait ConfigIndex: Sized + Copy + Eq + Format {
    fn as_index(self) -> usize;
    fn from_byte(byte: u8) -> Option<Self>;
}

pub trait SectionIndex: Sized + Copy + Eq + Format  {
    fn as_index(self) -> usize;
    fn from_byte(byte: u8) -> Option<Self>;
}

pub trait InfoIndex: Sized + Copy + Eq + Format {
    fn as_index(self) -> usize;
    fn from_byte(byte: u8) -> Option<Self>;
}