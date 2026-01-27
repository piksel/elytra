use core::fmt::Debug;
use core::option::Option;

#[cfg(feature = "alloc")]
use alloc::borrow::Cow;

#[cfg(feature = "alloc")]
pub type OptionValue = Option<Cow<'static, str>>;
#[cfg(not(feature = "alloc"))]
pub type OptionValue = Option<&'static str>;

pub trait OptionValueProvider: Debug + Send + Sync {
    fn get(&self, index: usize) -> OptionValue;

    fn len(&self) -> usize;
}

impl OptionValueProvider for [&'static str] {
    fn get(&self, index: usize) -> OptionValue {
        if index < self.len() {
            Some(self[index].into())
        } else {
            None
        }
    }

    fn len(&self) -> usize {
        self.len()
    }
}

impl <const S: usize> OptionValueProvider for [&'static str; S] {
    fn get(&self, index: usize) -> OptionValue {
        if index < self.len() {
            Some(self[index].into())
        } else {
            None
        }
    }

    fn len(&self) -> usize {
        S
    }
}

// impl Debug for OptionValueProvider {
//     fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {

//         f.debug_struct("OptionValues").finish()
//         //.field("inner", &self.inner).field("str_fn", &self.str_fn).finish()
//     }
// }

// pub struct OptionValues<V: 'static> {
//     pub inner: &'static [V],
//     pub str_fn: &'static dyn Fn(&'static V) -> &'static str
// }

// impl <V> OptionValueProvider for OptionValues<V> {
//     fn get(&self, index: usize) -> Option<&'static str> {
//         self.inner.get(index).map(&self.str_fn)
//     }
//     fn len(&self) -> usize {
//         self.inner.len()
//     }
// }

// impl <V> Debug for OptionValues<V> {
//     fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
//         f.debug_struct("OptionValues").finish()
//         //.field("inner", &self.inner).field("str_fn", &self.str_fn).finish()
//     }
// }