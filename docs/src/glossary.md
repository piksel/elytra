# Glossary
Some generic words have a more specific meaning in the Elytra codebase and docs. This is the description of these words and how they are being used.

## Entry
One of the items that the elytra configuration consists of. They are one of the following types: [Info](#info), [Prop](#prop), [Action](#action) or [Section](#section), and have a fixed entry index (that is unique within each type).

## Info
*(short for Information)* Represents an "ethereal" value, such as the current status or the time. These *can* also be written to, 
but it's more akin to running a command (like, "reset status" or "set time"), as the value is not expected to be persisted 
(reading back the value after writing it shouldn't necessarily match).

## Prop
*(short for Property)* Represents a persisted field in the device and are generally used for settings. Although the device firmware
may implement the reading/writing of these values however they choose, they should generally return the same value when read back
after it has been written. As the PropID is meant to be used as an index into a storage device, you should avoid re-ordering (and removing) props. Instead, use [sections](#section) to change the order/hide them.

## Action


## Section
A logical grouping of [Fields](#field) that can be used for presenting the fields to the user in a context with a name and an optional icon. Fields that are not in a section will be hidden from the user.

## Field
Generally refers to either an [Entry](#entry) or an [Info](#info) (field). That being said, the "Query Field" command can still be used with other entries, such as [Action](#action) and [Section](#section).