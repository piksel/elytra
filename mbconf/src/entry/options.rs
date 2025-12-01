use core::fmt::Debug;
use core::option::Option;

pub trait OptionValueProvider: Debug + Send + Sync {
    fn get(&self, index: usize) -> Option<&'static str>;
    fn len(&self) -> usize;
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