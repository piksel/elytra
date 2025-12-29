export interface EntryBase {
    name: string;
    flags: ExtraFlags;
    help?: string | undefined;
    icon?: string | undefined;
}

export interface Section extends EntryBase {
  icon?: string | undefined;
  fields: FieldDesc[];
}
export interface FieldDesc extends EntryBase {
  options: string[];
  valueType: string;
  min: number;
  max: number;
  valueKey: string;
  entryType: EntryType;
  entryIndex: number; 
}

export interface Action extends EntryBase {
  variant: ActionVariant;
}

export interface FieldWithValue extends FieldDesc {
    value: string | number;
}

export interface ExtraFlags {
    readonly: boolean,
    hasHelp: boolean,
    hasIcon: boolean,
    hasOptions: boolean
}

export interface EntryCommandData {
    read: Command;
    write: Command;
}

export type FieldRef = readonly [EntryType, number];

export const ValueTypes = {
    Text: 't',
    Secret: 's',
    Integer: 'i',
    Status: 'c',
    Bytes: 'b',
    Option: 'o',
    Toggle: 'x'
} as const;
export type ValueType = typeof ValueTypes[keyof typeof ValueTypes];

export const ActionVariants = {
    Main: 'm',
    Normal: 'n'
}
export type ActionVariant = typeof ActionVariants[keyof typeof ActionVariants];

export const EntryTypes = {
    Action: 'a',
    Prop: 'p',
    Info: 'i',
    Section: 's'
} as const;
export type EntryType = typeof EntryTypes[keyof typeof EntryTypes];

export const Commands = {
    Read: 'r',
    Write: 'w',
    ReadInfo: 'R',
    WriteInfo: 'W',
    Query: 'q',
    Meta: 'm',
    Action: 'a'
} as const;
export type Command = typeof Commands[keyof typeof Commands];

export const QueryTargets = {
    Field: 'f',
    Icon: 'i',
    Help: 'h',
    Layout: 'l',
    Option: 'o'
} as const;
export type QueryTarget = typeof QueryTargets[keyof typeof QueryTargets];

export type RwEntryType = Extract<EntryType, typeof EntryTypes.Info | typeof EntryTypes.Prop>;

export const EntryCommands: Record<RwEntryType, EntryCommandData> = {
    [EntryTypes.Info]: {
        read: "R",
        write: "W",
    },
    [EntryTypes.Prop]: {
        read: "r",
        write: "w",
    },
} as const;

export const EntryName: Record<EntryType, string> = {
    [EntryTypes.Info]: "Info Field",
    [EntryTypes.Prop]: "Prop Field",
    [EntryTypes.Action]: "Action",
    [EntryTypes.Section]: "Section",
} as const;

export interface ElytraConfig {
    sections: Section[];
    fields: Record<string, FieldDesc>;
    actions: Action[];
    deviceInfo: {
        name: string;
        manufacturer: string;
    }
}

export interface DeviceInfo {
    name: string;
    manufacturer: string;
    json: DeviceJson;
    resourceBaseUrl: string;
}

export interface DeviceJson {
    urls: {
        firmware?: string,
        documentation?: string,
        image?: string
    },
    description: string
}