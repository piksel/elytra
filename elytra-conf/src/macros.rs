

#[macro_export(local_inner_macros)]
macro_rules! elytra {

    ( 
        info: { $( $i:ident: $ix:expr ),* },
        config: { $( $f:ident: $fx:expr ),* },
        sections: { $( $s:ident: $sx:expr ),* },
        actions: { $( $a:ident: $an:expr ),* },
        layout: { $( $ls:path: [ $( $lf:expr ),* ] ),* }
    ) => {

        // #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq)]
        pub enum Action {
            $(
                $a = ${index()},
            )*
        }
        impl ActionIndex for Action {
            fn as_index(self) -> usize {
                self as usize
            }
            fn from_byte(byte: u8) -> Option<Self> {
                match byte {
                    $(
                        ${index()} => Some(Self::$a),
                    )*
                    _ => None
                }
            }
        }

        // #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq)]
        pub enum ConfigField {
            $(
                $f = ${index()},
            )*
        }

        impl ConfigIndex for ConfigField {
            fn as_index(self) -> usize {
                self as usize
            }
            fn from_byte(byte: u8) -> Option<Self> {
                match byte {
                    $(
                        ${index()} => Some(Self::$f),
                    )*
                    _ => None
                }
            }
        }

        // #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq)]
        pub enum Section {
            $(
                $s = ${index()},
            )*
        }
        impl SectionIndex for Section {
            fn as_index(self) -> usize {
                self as usize
            }
            fn from_byte(byte: u8) -> Option<Self> {
                match byte {
                    $(
                        ${index()} => Some(Self::$s),
                    )*
                    _ => None
                }
            }
        }

        // #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq)]
        pub enum InfoField {
            $(
                $i = ${index()},
            )*
        }
        impl InfoIndex for InfoField {
            fn as_index(self) -> usize {
                self as usize
            }
            fn from_byte(byte: u8) -> Option<Self> {
                match byte {
                    $(
                        ${index()} => Some(Self::$i),
                    )*
                    _ => None
                }
            }
        }

        pub type ProtoImpl = Proto<${count($s)}, ${count($f)}, ${count($i)}, ${count($a)}, ${count($lf)}, Section, ConfigField, InfoField, Action>;
        pub const PROTO: ProtoImpl = Proto::new(            
            [$(
                $sx.as_entry(),
            )*],
            [$(
                $fx.as_entry(),
            )*],
            [$(
                $ix.as_entry(),
            )*],
            [$(
                $an.as_entry(),
            )*],
            [$(
                $(
                ($ls, $lf),
                )*
            )*],
        );
    };
}

#[cfg(test)]
mod test_empty {
    use crate::prelude::*;

    elytra!{
        info: {},
        config: {},
        sections: {},
        actions: {},
        layout: {}
    }

    #[test]
    fn test_empty() {
        assert_eq!(0, PROTO.info_fields.len());
        assert_eq!(0, PROTO.config_fields.len());
        assert_eq!(0, PROTO.sections.len());
        assert_eq!(0, PROTO.actions.len());
        assert_eq!(0, PROTO.layout.len());
    }
}

#[cfg(test)]
mod test_2 {
    use crate::prelude::*;

    elytra!{
        info: {
            Foo: info("Foo")
        },
        config: {
            One: config("One"),
            Two: config("Two")
        },
        sections: {
            Top: section("Top"),
            Mid: section("Mid"),
            Bot: section("Bot")
        },
        actions: {
            Begin: action("Being"),
            End: action("End")
        },
        layout: {
            Section::Top: [
                Field::Info(InfoField::Foo)
            ],
            Section::Mid: [
                Field::Conf(ConfigField::One)
            ],
            Section::Bot: [
                Field::Conf(ConfigField::Two)
            ]
        }
    }

    #[test]
    fn test_some_entries() {
        assert_eq!(1, PROTO.info_fields.len());
        assert_eq!(2, PROTO.config_fields.len());
        assert_eq!(3, PROTO.sections.len());
        assert_eq!(2, PROTO.actions.len());
        assert_eq!([
            (Section::Top, Field::Info(InfoField::Foo)),
            (Section::Mid, Field::Conf(ConfigField::One)),
            (Section::Bot, Field::Conf(ConfigField::Two)),
        ], PROTO.layout);
    }
}