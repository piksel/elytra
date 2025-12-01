use core::prelude::rust_2024::{*};
use core::{ops::Range};

use defmt::Format;
use bitflags::bitflags;

pub mod options;

use crate::{command::CommandResponse, entry::options::{OptionValueProvider}, proto::{EntryType, MESSAGE_LENGTH}};

use super::{
    traits::{ConfigIndex, InfoIndex}, 
    values::ValueType,
};

#[derive(Copy, Clone, Debug, Eq, PartialEq, Format)]
pub enum Field<CI: ConfigIndex, II: InfoIndex> {
    Conf(CI),
    Info(II)
}

impl <CI: ConfigIndex, II: InfoIndex> Field<CI, II> {
    pub fn bits(&self) -> [u8; 2] {
        match self {
            Self::Conf(ci) => [EntryType::Config as u8, ci.as_index() as u8],
            Self::Info(ii) => [EntryType::Info as u8, ii.as_index() as u8],
        }
    }
}

#[derive(Debug, Eq, PartialEq, Format)]
pub struct SectionEntry {
    pub name: &'static str,
    pub icon: Option<&'static str>,
    pub help: Option<&'static str>,
}

#[allow(unused)]
impl SectionEntry {
    pub const fn as_entry(self) -> EntryDesc {
        EntryDesc::new(
            self.name, 
            EntryVariant::Section, 
            true,
            Constraints::None,
            self.help, 
            self.icon,
        )
    }
    pub const fn with_icon(self, icon: &'static str) -> Self {
        Self {
            icon: Some(icon),
            ..self
        }
    }
    pub const fn with_help(self, help: &'static str) -> Self {
        Self {
            help: Some(help),
            ..self
        }
    }
}

#[allow(unused)]
pub const fn section(name: &'static str) -> SectionEntry {
    SectionEntry { name, icon: None, help: None }
}

#[derive(Debug, Format)]
pub struct FieldEntry {
    pub value_type: ValueType,
    pub readonly: Option<bool>,
    pub name: &'static str,
    pub constraints: Constraints,
    pub help: Option<&'static str>,
    pub icon: Option<&'static str>,
}

#[allow(unused)]
impl FieldEntry {
    pub const fn as_entry(self) -> EntryDesc {
        let Some(readonly) = self.readonly else {
            panic!("proto field writable configuration is ambigous: use .writable() or .readonly()") 
        };
        EntryDesc::new(
            self.name, 
            EntryVariant::Field(self.value_type), 
            readonly,
            self.constraints, 
            self.help, 
            self.icon
        )
    }
    pub const fn with_icon(self, icon: &'static str) -> Self {
        Self {
            icon: Some(icon),
            ..self
        }
    }
    pub const fn with_help(self, help: &'static str) -> Self {
        Self {
            help: Some(help),
            ..self
        }
    }
    pub const fn with_range(self, range: Range<i32>) -> Self {
        Self {
            constraints: Constraints::Range(range),
            ..self
        }
    }
    pub const fn with_type(self, value_type: ValueType) -> Self {
        Self {
            value_type,
            ..self
        }
    }
    pub const fn writable(self) -> Self {
        Self {
            readonly: Some(false),
            ..self
        }
    }
    pub const fn readonly(self) -> Self {
        Self {
            readonly: Some(true),
            ..self
        }
    }
}

#[allow(unused)]
pub const fn bytes(name: &'static str, size: u8) -> FieldEntry {
    FieldEntry {
        name,
        value_type: ValueType::Bytes,
        constraints: Constraints::Length(size as u64),
        readonly: Some(true),
        help: None,
        icon: None
    }
}

#[allow(unused)]
pub const fn secret(name: &'static str) -> ConfigEntry {
    ConfigEntry {
        name,
        value_type: ValueType::Secret,
        constraints: Constraints::None,
        readonly: Some(false),
        help: None,
        icon: None
    }
}

#[allow(unused)]
pub const fn status(name: &'static str) -> InfoEntry {
    InfoEntry {
        name,
        value_type: ValueType::Status,
        constraints: Constraints::None,
        readonly: Some(true),
        help: None,
        icon: None
    }
}

#[allow(unused)]
pub const fn integer(name: &'static str) -> InfoEntry {
    InfoEntry {
        name,
        value_type: ValueType::Integer,
        constraints: Constraints::None,
        readonly: None,
        help: None,
        icon: None
    }
}

#[allow(unused)]
pub const fn option(name: &'static str, values: &'static dyn OptionValueProvider) -> InfoEntry {
    ConfigEntry {
        name,
        value_type: ValueType::Option,
        constraints: Constraints::Values(values),
        readonly: Some(false),
        help: None,
        icon: None
    }
}

pub type InfoEntry = FieldEntry;
#[allow(unused)]
pub const fn info(name: &'static str) -> InfoEntry {
    InfoEntry {
        name,
        value_type: ValueType::Text,
        constraints: Constraints::None,
        readonly: Some(true),
        help: None,
        icon: None
    }
}

pub type ConfigEntry = FieldEntry;
#[allow(unused)]
pub const fn config(name: &'static str) -> FieldEntry {
    FieldEntry {
        name,
        value_type: ValueType::Text,
        constraints: Constraints::None,
        readonly: Some(false),
        help: None,
        icon: None
    }
}

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Format)]
#[allow(unused)]
pub enum ActionVariant {
    Main = 'm' as u8,
    Normal = 'n' as u8,
    Danger = 'd' as u8,
    Green = 'g' as u8,
    Blue = 'b' as u8,
    Teal = 't' as u8,
    Pink = 'p' as u8,
    Purple = 'l' as u8,
    Cyan = 'c' as u8,
    Orange = 'o' as u8,
    Yellow = 'y' as u8,
}

pub struct ActionEntry {
    pub name: &'static str,
    pub variant: ActionVariant,
    pub help: Option<&'static str>,
    pub icon: Option<&'static str>,
}

#[allow(unused)]
pub const fn action(name: &'static str) -> ActionEntry {
    ActionEntry {
        name,
        variant: ActionVariant::Normal,
        help: None,
        icon: None
    }
}

#[allow(unused)]
impl ActionEntry {
    pub const fn as_entry(self) -> EntryDesc {
        EntryDesc::new( 
            self.name, 
            EntryVariant::Action(self.variant), 
            true, 
            Constraints::None, 
            self.help, 
            self.icon 
        )
    }
    pub const fn with_icon(self, icon: &'static str) -> Self {
        Self {
            icon: Some(icon),
            ..self
        }
    }
    pub const fn with_help(self, help: &'static str) -> Self {
        Self {
            help: Some(help),
            ..self
        }
    }
}

bitflags! {
    #[derive(Debug, Eq, PartialEq)]
    pub struct ExtraFlags: u8 {
        const ReadOnly = 1 << 0;
        const HasHelp = 1 << 1;
        const HasIcon = 1 << 2;
    }
}

impl Format for ExtraFlags {
    fn format(&self, fmt: defmt::Formatter) {
        defmt::write!(fmt, "[");
        for (i, (name, _)) in self.iter_names().enumerate() {
            if i != 0 {
                defmt::write!(fmt, ", ");
            }
            defmt::write!(fmt, "{}", name)
        }
        defmt::write!(fmt, "]");
    }
}

#[derive(Debug, Eq, PartialEq, Format)]
pub enum EntryVariant {
    Action(ActionVariant),
    Field(ValueType),
    Section
}

impl EntryVariant {
    pub fn bits(&self) -> u8 {
        match self {
            EntryVariant::Action(action_variant) => *action_variant as u8,
            EntryVariant::Field(value_type) => *value_type as u8,
            EntryVariant::Section => 0u8,
        }
    }
}

#[derive(Debug)]
pub enum Constraints {
    None,
    Range(Range<i32>),
    Length(u64),
    Values(&'static dyn OptionValueProvider)
}

impl Format for Constraints {
    fn format(&self, fmt: defmt::Formatter) {
        match self {
            Constraints::None => defmt::write!(fmt, "NoneConstraints"),
            Constraints::Range(range) => defmt::write!(fmt, "RangeConstraint({}, {})", range.start, range.end),
            Constraints::Length(len) => defmt::write!(fmt, "LengthConstraints({})", len),
            Constraints::Values(ovp) => defmt::write!(fmt, "ValuesConstraints({})", ovp.len()),
        }
    }
}

impl Constraints {

    pub fn bits(&self) -> [u8; 8] {
        match self {
            Constraints::None => [0; 8],
            Constraints::Range(Range { start, end}) => {
                let s= start.to_le_bytes();
                let e = end.to_le_bytes();
                [s[0], s[1], s[2], s[3], e[0], e[1], e[2], e[3]]
            },
            Constraints::Length(len) => len.to_le_bytes(),
            Constraints::Values(opt_vals) => (opt_vals.len() as u64).to_le_bytes(),
        }
    }
}

#[derive(Debug, Format)]
pub struct EntryDesc {
    pub variant: EntryVariant,
    pub readonly: bool,
    pub name: &'static str,
    pub constraints: Constraints,
    pub help: Option<&'static str>,
    pub icon: Option<&'static str>,
}

impl EntryDesc {
    pub const fn new(
        name: &'static str,
        variant: EntryVariant,
        readonly: bool,
        constraints: Constraints,
        help: Option<&'static str>,
        icon: Option<&'static str>
    ) -> Self {
        if name.len() == 0 { panic!("name is required"); }
        if name.as_bytes().len() > Self::MAX_ENTRY_NAME_LEN { panic!("name is too long") }

        Self {
            name,
            variant,
            readonly,
            constraints,
            help,
            icon,
        }
    }

    pub fn flags(&self) -> ExtraFlags {
        let mut flags = ExtraFlags::empty();
        flags.set(ExtraFlags::ReadOnly, self.readonly);
        flags.set(ExtraFlags::HasHelp, self.help.is_some());
        flags.set(ExtraFlags::HasIcon, self.icon.is_some());
        flags
    }

    const MAX_ENTRY_NAME_LEN: usize = MESSAGE_LENGTH - (
        1 // flags
        +
        1 // variant
        +
        8 // constraints
    );
}

impl From<&EntryDesc> for CommandResponse {
    fn from(value: &EntryDesc) -> Self {
        let mut res = CommandResponse::new();
        res.push(value.flags().bits()); // readonly (1 byte)
        res.push(value.variant.bits());  // type (1 byte)
        res.extend(value.constraints.bits()); // 8 byte
        // use the rest of the message buffer for field name
        res.extend(value.name.bytes());
        res
    }
}