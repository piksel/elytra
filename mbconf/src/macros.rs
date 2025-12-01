

#[macro_export(local_inner_macros)]
macro_rules! mbconf {

    ( 
        info: { $( $i:ident: $ix:expr ),* },
        config: { $( $f:ident: $fx:expr ),* },
        sections: { $( $s:ident: $sx:expr ),* },
        actions: { $( $a:ident: $an:expr ),* },
        layout: { $( $ls:path: [ $( $lf:expr ),* ] ),* }
    ) => {
        #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq, defmt::Format)]
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

        #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq, defmt::Format)]
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

        #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq, defmt::Format)]
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

        #[repr(u8)]
        #[derive(Clone, Copy, Debug, PartialEq, Eq, defmt::Format)]
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