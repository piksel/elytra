import { Action, ActionVariants, EntryType, EntryTypes, ExtraFlags, FieldDesc, Section } from "./types";

const fieldFromRef = (propFields: FieldDesc[], infoFields: FieldDesc[]): (value: readonly [EntryType, number]) => FieldDesc =>
    (([et, index]) => et === EntryTypes.Info ? infoFields[index] : propFields[index]);

const FLAGS_RO: ExtraFlags = {hasHelp: false, hasIcon: false, readonly: true, hasOptions: false} as const;
const FLAGS_RW = {...FLAGS_RO, readonly: false} as const;

export const MOCK_INFO_FIELDS: FieldDesc[] = [
    {
        flags: FLAGS_RO,
        "valueType": "c",
        "min": 0,
        "max": 63,
        "name": "Connection Status",
        valueKey: 'i0',
        options: [],
        entryIndex: 0,
        entryType: EntryTypes.Info
    },
    {
        flags: FLAGS_RO,
        "valueType": "b",
        "min": 8,
        "max": 8,
        "name": "Flash Unique ID",
        valueKey: 'i1',
        options: [],
        entryIndex: 1,
        entryType: EntryTypes.Info
    },
    {
        flags: FLAGS_RO,
        "valueType": "b",
        "min": 4,
        "max": 4,
        "name": "Flash JEDEC ID",
        valueKey: 'i2',
        options: [],
        entryIndex: 2,
        entryType: EntryTypes.Info
    }
];

export const MOCK_PROP_FIELDS: FieldDesc[] = [
    {
        "valueType": "t",
        flags: FLAGS_RW,
        "min": 0,
        "max": 63,
        "name": "Network (SSID)",
        valueKey: 'p0',
        options: [],
        entryIndex: 0,
        entryType: EntryTypes.Prop
    },
    {
        "valueType": "s",
        flags: FLAGS_RW,
        "min": 0,
        "max": 63,
        "name": "Password",
        valueKey: 'p1',
        options: [],
        entryIndex: 1,
        entryType: EntryTypes.Prop
    },
    {
        "valueType": "i",
        flags: FLAGS_RW,
        "min": -15,
        "max": 15,
        "name": "Brightness Offset",
        valueKey: 'p2',
        options: [],
        entryIndex: 0,
        entryType: EntryTypes.Prop
    }
];


export const MOCK_SECTIONS: Section[] = [
    {
        flags: FLAGS_RO,
        "name": "WiFi",
        fields: [
            [EntryTypes.Info, 0] as const,
            [EntryTypes.Prop, 0] as const,
            [EntryTypes.Prop, 1] as const,
        ].map(fieldFromRef(MOCK_PROP_FIELDS, MOCK_INFO_FIELDS))
    },
    {
        flags: FLAGS_RO,
        "name": "Display",
        fields: [
            [EntryTypes.Prop, 2] as const,
        ].map(fieldFromRef(MOCK_PROP_FIELDS, MOCK_INFO_FIELDS))
    },
    {
        flags: FLAGS_RO,
        "name": "Hardware Info",
        fields: [
            [EntryTypes.Info, 1] as const,
            [EntryTypes.Info, 2] as const
        ].map(fieldFromRef(MOCK_PROP_FIELDS, MOCK_INFO_FIELDS))
    }
];

export const MOCK_ACTIONS: Action[] = [
    {
        name: "Reset",
        flags: FLAGS_RO,
        variant: ActionVariants.Normal,
    },
    {
        name: "DFU",
                flags: FLAGS_RO,
        variant: ActionVariants.Normal,
    },
    {
        name: "Smile",
                flags: FLAGS_RO,
        variant: ActionVariants.Normal,
    }
]

