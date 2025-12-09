use crate::{entry::{Constraints, EntryDesc, EntryVariant}, values::DefaultValue};


#[derive(Debug, Eq, PartialEq)]
#[cfg_attr(feature = "defmt", derive(defmt::Format))]
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
            DefaultValue::Empty,
            false
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