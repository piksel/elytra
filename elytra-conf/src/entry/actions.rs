use crate::{entry::{Constraints, EntryDesc, EntryVariant}, values::DefaultValue};

#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[cfg_attr(feature = "defmt", derive(defmt::Format))]
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
            self.icon,
            DefaultValue::Empty,
            false,
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