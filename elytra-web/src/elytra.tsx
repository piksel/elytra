import { 
    Action, Commands, EntryType, ExtraFlags, FieldDesc, FieldRef, 
    QueryTarget, QueryTargets, Section, ValueTypes, EntryCommands,
    EntryTypes,
    RwEntryType,
    EntryName,
    Command,
    ElytraConfig
} from "./types";

export class Elytra {

    encoder: TextEncoder;
    decoder: TextDecoder;
    device: ElytraDevice;

    constructor(device: ElytraDevice) {
        this.device = device;
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    async init(): Promise<ElytraConfig> {
        const result = await this.sendDeviceCommand(Commands.Meta, []);
      console.log('Got result: %o', result);
      const version = result.getUint8(1);
      const section_count = result.getUint8(2);
      const config_count = result.getUint8(3);
      const info_count = result.getUint8(4);
      const action_count = result.getUint8(5);

      console.log('INFO %o', {
        version,
        sections: section_count,
        configFields: config_count,
        infoFields: info_count,
        actions: action_count,
      })

      const sections = await this.querySections(section_count);
      const propFields = await this.queryEntries(EntryTypes.Prop, config_count);
      const infoFields = await this.queryEntries(EntryTypes.Info, info_count);
      const actions = await this.readActionInfo(action_count);

      const layouts = await this.queryLayouts(section_count);
      const sectionsWithLayout = sections.map((s, si) => ({
        ...s, 
        // fields: layouts[si].map(([l, li]) => `${l}${li}`)
        fields: layouts[si].map(([l, li]) => l === EntryTypes.Prop ? propFields[li] : infoFields[li])
      }));
      const fields = {
        ...(Object.fromEntries(propFields.map((f,i) => [`${EntryTypes.Prop}${i}`, f]))),
        ...(Object.fromEntries(infoFields.map((f,i) => [`${EntryTypes.Info}${i}`, f]))),
      }


      console.info("Layouts: %o", layouts);

      return {
        deviceInfo: {
            name: this.device.name(),
            manufacturer: this.device.manufacturer(),
        },
        sections: sectionsWithLayout,
        fields,
        actions,
      }
    }

    async getFieldValues(config: ElytraConfig) {
      return await this.readFieldValues(Object.values(config.fields).flat());
    }

    decodeZeroPadString(ab: ArrayBufferLike) {
        const buf = new Uint8Array(ab);
        return this.decoder.decode(buf.filter(b => b !== 0));
    }

    async sendDeviceCommand(command: Command, params: Array<number|string> | Uint8Array) {
        /*
        let syncRes = await this.device.exchange(new Uint8Array(64).buffer);
        let attempts = 0;
        while (new Uint8Array(syncRes.slice(1)).some(b => b != 0)) {
            console.warn('Garbage in USB pipe. Trying to sync..., %o', hx(new Uint8Array(syncRes)));
            syncRes = await this.device.sync();
            if (attempts++ > 10) {
                console.warn("Exceeded sync max attempts!");
                break;
            }
        };
        */

        
        const buf = new ArrayBuffer(64);
        const payload = new Uint8Array(buf);
        const dv  = new DataView(buf);
     
        dv.setUint8(0, this.encoder.encode(command).at(0));
        for (let i = 0; i < 63; i++) {
            const v = i >= params.length ? 0 : params[i];
            const val = typeof v === "string" ? this.encoder.encode(v).at(0) : v;
            dv.setUint8(i + 1, val);
        }

        // [command, ...params].map(v => (typeof v === "string" ? this.encoder.encode(v).at(0) : v) as number);
        console.log("%s => [%o]", command, hx(payload, payload.length));
        const response = await this.device.exchange(buf);
        const resDv = new DataView(response);
        if (resDv.getUint8(0) === 0) {
            console.error("  <= ER [%o]", hx(new Uint8Array(response), 64))
            throw new CommandError(new Uint8Array(resDv.buffer.slice(1)));
        }

        console.info("  <= OK [%o]", hx(new Uint8Array(response), 64));

        return resDv;
    }


    async queryAllProps(entry: EntryType, count: number, prop: QueryTarget = QueryTargets.Field): Promise<DataView[]> {
        const entries = Array(count);
        for (let i = 0; i < count; i++) {
            const data = await this.sendDeviceCommand(Commands.Query, [entry, i, prop]);

            if (!data) {
                console.error('Failed to get %s:%s %o: No data.', EntryCommands[entry].name, prop, i);
                entries[i] = new DataView(new ArrayBuffer());
                continue;
                // return [];
            }

            if (data.getUint8(0) !== 1) {
                console.error('Failed to get %s:%s %o. Got result code %o.', EntryCommands[entry].name, prop, i, data.getUint8(1));
                return [];
            }

            entries[i] = new DataView(data.buffer.slice(1));
        }

        return entries;
    }



    async readFieldValues(fields: FieldDesc[]) {
        
        const values = {};// Array.from(fields, field => [field.valueKey, "" as string | number]);
        for (const field of fields) {
            const entry = field.entryType;
            const data = await this.sendDeviceCommand(EntryCommands[entry].read, [field.entryIndex]);

            if (!data) {
                console.error('Failed to read %s %o: No data.', EntryName[entry], field.entryIndex);
                values[field.valueKey] = this.parseFieldValue(new DataView(new ArrayBuffer()), field);
                continue;
                // return [];
            }

            if (data.getUint8(0) === 0) {
                console.error('Failed to read %s %o. Got result code %o.', EntryName[entry], field.entryIndex, data.getUint8(1));
                return [];
            }

            const valueData = new DataView(data.buffer.slice(1));
            values[field.valueKey] = this.parseFieldValue(valueData, field);
        }

        return values;
    }

    async queryFieldValue(field: FieldDesc, entry: RwEntryType, fieldIndex: number) {
        const data = await this.sendDeviceCommand(EntryCommands[entry].read, [fieldIndex]);

        if (!data) {
            console.error('Failed to read %s %o: No data.', EntryName[entry], fieldIndex);
            return this.parseFieldValue(new DataView(new ArrayBuffer()), field);
        }

        if (data.getUint8(0) === 0) {
            console.error('Failed to read %s %o. Got result code %o.', EntryName[entry], fieldIndex, data.getUint8(1));
            return undefined;
        }

        const valueData = new DataView(data.buffer.slice(1));
        return this.parseFieldValue(valueData, field);
    }

    private parseEntry(dv: DataView, fieldIndex: number, entryType: EntryType): FieldDesc {
        return {
            flags: parseFlags(dv.getUint8(0)),
            valueType: String.fromCharCode(dv.getUint8(1)),
            min: Number(dv.getInt32(2, true)),
            max: Number(dv.getInt32(6, true)),
            name: this.decodeZeroPadString(dv.buffer.slice(10)),
            options: [],
            valueKey: entryType + fieldIndex,
            entryIndex: fieldIndex,
            entryType
        };
    }

    async queryEntries(entryType: EntryType, entryCount: number): Promise<FieldDesc[]> {
        const entries: FieldDesc[] = await this.queryAllProps(entryType, entryCount)
            .then(res => res.map((dv, i) => this.parseEntry(dv, i, entryType)));
        return Promise.all(entries.map(async (entry, i) => {
            if (entry.flags.hasHelp) {
                entry.help = await this.queryExtraText(entryType, i, QueryTargets.Help);
            }
            if (entry.flags.hasIcon) {
                console.log("Quering for entry %o icon... ", i)
                entry.icon = await this.queryExtraText(entryType, i, QueryTargets.Icon);
                console.log("Got icon: %o", entry.icon)
            }
            if (entry.flags.hasOptions) {
                console.log("Quering for entry %o options... ", i);
                entry.options = await this.queryFieldOptions(entryType, i, entry);
                console.log("Got options: %o", entry.options);
            }
            return entry;
        }));
        return entries;
    }

    async queryFieldOptions(entryDef: EntryType, entryIndex: number, entry: FieldDesc): Promise<string[]> {
        const optCount = entry.min;
        console.log("OptCount: %o max: %o min: %o", optCount, entry.max, entry.min)
        const options = Array(optCount);
        
        for(let i = 0; i < optCount; i++) {
            options[i] = await this.queryExtraText(entryDef, entryIndex, QueryTargets.Option, i);
        }
        return options;
    }

    async queryExtraText(entry: EntryType, index: number, prop: QueryTarget, propIndex?: number) {
        const propIndexBytes = typeof propIndex !== 'undefined' ? getUint32(propIndex) : [];
        const result = await this.sendDeviceCommand(Commands.Query, [entry, index, prop, ...propIndexBytes]);
        if (!result || result.getUint8(0) == 0) {
            return undefined;
        }
        return this.decodeZeroPadString(result.buffer.slice(1));
    }

    async querySections(section_count: number): Promise<Section[]> {
        const entries = await this.queryEntries(EntryTypes.Section, section_count);
        console.log('%o entries: %o', EntryName[EntryTypes.Section], entries);
        return entries.map(entry => ({
            flags: entry.flags,
            name: entry.name,
            fields: [],
            help: entry.help,
            icon: entry.icon,
        }));
    }

    async queryLayouts(section_count: number): Promise<FieldRef[][]> {
        const results = await this.queryAllProps(EntryTypes.Section, section_count, QueryTargets.Layout);
        console.log('Section layouts: %o', results);
        return results.map(dv => {
            const fieldRefs = [];
            for(let i = 0; i < 63; i ++) {
                const entryType = dv.getUint8(i * 2);
                if (entryType === 0) break;
                const fieldIndex = dv.getUint8((i * 2) + 1);
                fieldRefs[i] = [String.fromCharCode(entryType) as EntryType, fieldIndex];
            }
            return fieldRefs;
        });
    }

    async readActionInfo(action_count: number): Promise<Action[]> {
        const entries = await this.queryEntries(EntryTypes.Action, action_count);
        return entries.map(entry => ({
            flags: entry.flags,
            variant: entry.valueType,
            name: entry.name,
        }));
    }

    parseFieldValue(dv: DataView, field: FieldDesc): string | number {
        switch (field.valueType) {
            case 't': return this.decodeZeroPadString(dv.buffer);
            case 'i': return Number(dv.getBigInt64(0, true));
            case 'o': return this.decodeZeroPadString(dv.buffer);
            case 'c': return `${this.decodeZeroPadString(dv.buffer.slice(1))} (0x${dv.getUint8(0).toString(16).padStart(2, '0')})`;
            case 'b': return hx(new Uint8Array(dv.buffer), field.min);
            case 's': return this.decodeZeroPadString(dv.buffer);
            case 'x': return dv.getUint8(0);
            default: return `Unknown type: ${field.valueType}`;
        }
    }

    packFieldValue(value: string | number, field: FieldDesc): Uint8Array {
        const buf = new Uint8Array(63);
        const dv = new DataView(buf.buffer);
        console.log('Converting value %o to packed field %o', value, field);
        switch (field.valueType) {
            case 't':
            case 'o':
            case 's': {
                this.encoder.encodeInto(value.toString(), buf);
                break;
            }
            case 'b': {
                const raw = value.toString().replaceAll(' ', '').padStart(field.max * 2, '0');
                for(let i = 0; i < raw.length; i += 2) {
                    const byteStr = raw.substring(i, i + 2);
                    dv.setUint8(i, parseInt(byteStr, 16));
                }
                break;
            }
            case 'i': 
            {
                dv.setBigInt64(0, BigInt(value as number), true);
                break;
            };
            case 'x': {
                dv.setUint8(0, value ? 1 :0);
                break;
            }
            default: throw new Error(`Cannot set fields of type ${field.valueType}`);
        }
        return buf;
    }

    async writeField(field: FieldDesc, entry: RwEntryType, fieldIndex: number, value: string | number) {
        await this.sendDeviceCommand(EntryCommands[entry].write, [fieldIndex, ...this.packFieldValue(value, field)]);
    }
}

const hx = (arr: Uint8Array | number[], minLen: number = 0) => {
    const trimmed = Array.from(arr).reverse().reduce((pv, cv) => {
        if (cv != 0 || pv.length > 0) {
            return [...pv, cv]
        } else {
            return [];
        }
    }, [] as number[]).reverse();

    while (trimmed.length < minLen) {
        trimmed.push(0);
    }

    return `${trimmed.map(b => b.toString(16).padStart(2, '0')).join(' ')}`;
}

const parseFlags = (flags: number): ExtraFlags => ({
    readonly: !!(flags & 1 << 0),
    hasHelp: !!(flags & 1 << 1),
    hasIcon: !!(flags & 1 << 2),
    hasOptions: !!(flags & 1 << 3)
});

const getUint32 = (value: number) => {
    const dv = new DataView(new ArrayBuffer(4));
    dv.setUint32(0, value, true);
    return Array.from(new Uint8Array(dv.buffer));
}

interface ElytraDevice {
    disconnect(): Promise<void>;
    init(): Promise<void>;
    sync(): Promise<ArrayBufferLike>;
    exchange(input: ArrayBuffer): Promise<ArrayBufferLike>;
    name(): string;
    manufacturer(): string;
}

class CommandError extends Error {

    public details: string;
    constructor(data: Uint8Array) {
        const errorNames = [
            "Unknown Error",
            "InvalidCommand",   // 1
            "MissingArgument",  // 2
            "InvalidData",      // 3
            "InvalidField",     // 4
            "InvalidSection",   // 5
            "InvalidAction",    // 6
            "InvalidEntry",     // 7
            "InvalidQuery",     // 8
            "InvalidOption",    // 9
            "NotSupported",     // 10
            "Failed",           // 11
            "NoContent",        // 12
        ];

        const errorMessage = decodeZeroPadString(data.buffer.slice(1));
        const errorCode = data[0];
        const errorName = errorNames[errorCode] ?? "Unknown Error";
        super(`CommandError${errorCode}]: ${errorName}${errorMessage.length ? ':' : ''} ${errorMessage}`)
        this.details = hx(data)
    }
}

export class ElytraUSBDevice implements ElytraDevice {
    private inner: USBDevice;

    async init() {
        if (!navigator.usb) throw Error("Browser does not support WebUSB!")

        console.log('Connecting...')
        const device = await navigator.usb
            .requestDevice({ filters: [{ vendorId: 0xf569 }] });

        console.log("Device: %o", device);
        await device.open(); // Begin a session.

        await device.selectConfiguration(1); // Select configuration #1 for the device.
        await device.claimInterface(1); // Request exclusive control over interface #1.
        
        this.inner = device;
    }

    name(): string {
        // const {manufacturerName, productName, productId, serialNumber} = this.inner;
        // return JSON.stringify({manufacturerName, productName, productId, serialNumber}, null, '  ');
        return this.inner.productName;
    }

    manufacturer(): string {
        return this.inner.manufacturerName;
    }

    async exchange(input: ArrayBuffer): Promise<ArrayBufferLike> {
        const outRes = await this.inner.transferOut(1, input);
        const inRes = await this.inner.transferIn(1, 64);
        return inRes.data.buffer;
    }

    async sync(): Promise<ArrayBufferLike> {
        return await this.inner.transferIn(1, 64).then(r => r.data.buffer);
    }
    
    async disconnect() {
        if (this.inner.opened) {
            await this.inner.close();
        }
    }
}

export class ElytraWasmDevice implements ElytraDevice {
    sourceName: string;
    bytes: BufferSource;
    constructor(bytes: BufferSource, sourceName: string) {
        console.log("Got buffer source: %o", bytes);
        this.sourceName = sourceName;
        this.bytes = bytes;
    }

    initFailed = false;
    instance: WebAssembly.Instance;
    send: Function;
    recieve: Function;

    async init() {
        if (this.initFailed || this.instance) return;

        const results = await WebAssembly.instantiate(this.bytes, {});
        if (typeof results.instance.exports['send'] !== 'function' 
                || typeof  results.instance.exports['recieve'] !== 'function') {
            this.initFailed = true;
            throw new Error("provided file is not a valid elytra wasm dummy")
        }
        this.send = results.instance.exports.send;
        this.recieve = results.instance.exports.recieve;
        this.instance = results.instance;
    }

    sync(): Promise<ArrayBufferLike> {
        return this.read();
    }

    read(): Promise<ArrayBufferLike> {
        const outBuf = new Uint8Array(64);
        const dv = new DataView(outBuf.buffer);
        for(let i = 0; i < 8; i++) {
            const b = this.recieve(i);
            // console.log('RECV at %o: %o', i, b);
            dv.setBigInt64(i * 8, b, false);
        }
        return Promise.resolve(outBuf.buffer);
    }

    exchange(input: ArrayBuffer): Promise<ArrayBufferLike> {
        console.log(input);
        const packedView = new DataView(input);
        const args = [];
        for (let i = 0; i < 8; i++) {
            args[i] = packedView.getBigInt64(i * 8, false);
        }
        // const args = Array.from(packedView);
        console.log("Args: %o", args);

        const res = this.send(...args) as number;
        console.log("WASM RES: %o", res);

        return this.read();
    }

    async disconnect() {
        this.initFailed = false;
    }


    name(): string {
        return this.sourceName;
    }


    manufacturer(): string {
        return "WASM Dummy";
    }
}

export const localWasmFileDevice = async () => {
    if (!('showOpenFilePicker' in window && typeof window.showOpenFilePicker === "function")) {
        throw new Error("showOpenFilePicker is not supported by the browser")
    }
    const [fileHandle]: [FileSystemFileHandle] = await window.showOpenFilePicker({
        types: [
            {
                description: "WASM files",
                accept: {
                    "application/wasm": [".wasm"],
                },
            },
        ],
        excludeAcceptAllOption: true,
        multiple: false,
    });
  const fileData = await fileHandle.getFile() as File;
  console.log("Got file handle: %o, data: %o", fileHandle, fileData);

  return new ElytraWasmDevice(await fileData.arrayBuffer(), fileData.name);
}

export const cloudWasmFileDevice = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch WASM file: ${res.status} ${res.statusText}`);
    }
    const lastPath = new URL(url, location.href).pathname.split('/').pop();
    return new ElytraWasmDevice(await res.arrayBuffer(), lastPath);
}

const decodeZeroPadString = (ab: ArrayBufferLike) => new TextDecoder().decode(new Uint8Array(ab).filter(b => b !== 0));